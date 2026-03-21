import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  Inject,
  forwardRef,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../auth/dto/register.dto';
import dayjs from 'dayjs';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { NAME_QUEUE } from 'src/enums/name-queue.enum';
import { UserRole } from 'src/enums/user-role.enum';
import { AuthProvider } from 'src/enums/auth.enum';
import { OtpService } from '../auth/otp.service';
import { GoogleDto } from '../auth/dto/google.dto';
import { UploadService } from '../upload/upload.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { ErrorMessages } from '@/constants/error-messages.constant';
@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);
  private readonly timeResendEmail = 60;
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => OtpService))
    private readonly otpService: OtpService,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      this.logger.warn('Admin credentials not found in environment variables. Skipping seeding.');
      return;
    }

    const admin = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (!admin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const newAdmin = this.userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        isActive: true,
        providers: [AuthProvider.LOCAL],
      });
      await this.userRepository.save(newAdmin);
      this.logger.log(`Initial admin account created: ${adminEmail}`);
    }
  }

  async findByEmail(email: string, withPassword = false): Promise<any> {
    const query = this.userRepository.createQueryBuilder('user')
      .where('user.email = :email', { email });
    
    if (withPassword) {
      query.addSelect('user.password');
    }

    return await query.getOne();
  }

  async register(user: RegisterDto) {
    const { email, password, confirmPassword, firstName, lastName } = user;
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    // Nếu user đã tồn tại với Google, thêm local provider
    if (existingUser) {
      if (existingUser.providers?.includes(AuthProvider.LOCAL)) {
        throw new HttpException(ErrorMessages.AUTH.USER_ALREADY_EXISTS, HttpStatus.CONFLICT);
      }

      // User có Google account, thêm local login
      if (password !== confirmPassword) {
        throw new HttpException(
          ErrorMessages.AUTH.PASSWORD_MISMATCH,
          HttpStatus.BAD_REQUEST,
        );
      }
      const hashedPassword = await bcrypt.hash(password, 10);

      existingUser.password = hashedPassword;
      existingUser.providers = [...(existingUser.providers || []), AuthProvider.LOCAL];
      await this.userRepository.save(existingUser);
      
      if (!existingUser.isActive) {
        await this.sendVerificationAccount(email);
        return {
          id: existingUser.id,
          message:
            'Local login added to existing Google account. Please verify your email.',
        };
      }

      return {
        id: existingUser.id,
        message: 'Local login added to existing Google account successfully.',
      };
    }

    // Tạo user mới với local provider
    if (password !== confirmPassword) {
      throw new HttpException(ErrorMessages.AUTH.PASSWORD_MISMATCH, HttpStatus.BAD_REQUEST);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      providers: [AuthProvider.LOCAL],
      isActive: false,
      role: UserRole.USER,
    });
    await this.userRepository.save(newUser);
    await this.sendVerificationAccount(email);
    return { id: newUser.id };
  }

  async createByAdmin(createUserAdminDto: CreateUserAdminDto) {
    const { email, password, firstName, lastName, role, isActive } = createUserAdminDto;
    
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new HttpException(ErrorMessages.AUTH.USER_ALREADY_EXISTS, HttpStatus.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || UserRole.USER,
      isActive: isActive !== undefined ? isActive : true,
      providers: [AuthProvider.LOCAL],
    });

    await this.userRepository.save(newUser);
    return { id: newUser.id };
  }

  // Gửi OTP xác thực
  async sendVerificationAccount(email: string) {
    this.logger.log(`Starting verification email to ${email}`);
    const currentTime = dayjs().valueOf();
    const cachedData = await this.otpService.getValueOtp(
      NAME_QUEUE.SEND_OTP_VERIFY_ACCOUNT,
      email,
    );

    if (cachedData.time && (currentTime - Number(cachedData.time)) / 1000 < this.timeResendEmail) {
      this.logger.warn(
        `Attempt to resend verification email to ${email} too soon`,
      );
      const remainingTime = Math.ceil(
        this.timeResendEmail - (currentTime - Number(cachedData.time)) / 1000,
      );
      throw new HttpException(
        ErrorMessages.AUTH.OTP_WAIT(remainingTime),
        HttpStatus.BAD_REQUEST,
      );
    }

    const userEmail = await this.userRepository.findOne({ where: { email } });
    if (userEmail?.isActive) {
      this.logger.warn(`User ${email} is already active`);
      throw new HttpException(
        `User ${email} is already active`,
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.otpService.genOtp(
      NAME_QUEUE.SEND_OTP_VERIFY_ACCOUNT,
      email,
      userEmail?.firstName || '',
      userEmail?.lastName || '',
      currentTime,
    );
    this.logger.log(`Verification email sent to ${email}`);
  }

  async verifyAccount(email: string, otp: string) {
    this.logger.log(`Start verifying account for ${email}`);
    const cachedData = await this.otpService.validateOtp(
      NAME_QUEUE.SEND_OTP_VERIFY_ACCOUNT,
      email,
      otp,
    );

    if (!cachedData.success) {
      if (cachedData.retryAfter) {
        throw new HttpException(
          ErrorMessages.AUTH.OTP_TOO_MANY_ATTEMPTS(cachedData.retryAfter),
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new HttpException(
        ErrorMessages.AUTH.OTP_INVALID,
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.userRepository.update({ email }, { isActive: true });
    this.logger.log(`User ${email} verified successfully`);
    await this.otpService.deleteOtp(
      NAME_QUEUE.SEND_OTP_VERIFY_ACCOUNT,
      email,
    );
    this.logger.log(`End verifying account for ${email}`);
  }

  async findUserById(id: string, withRefreshToken = false) {
    const query = this.userRepository.createQueryBuilder('user')
      .where('user.id = :id', { id });
    
    if (withRefreshToken) {
      query.addSelect('user.hashedRefreshToken');
    }

    return await query.getOne();
  }

  async createOrUpdateGoogleUser(data: GoogleDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: data.email },
    });

    // User đã có account (local hoặc google)
    if (existingUser) {
      // Nếu chưa có google provider
      if (!existingUser.providers?.includes(AuthProvider.GOOGLE)) {
        existingUser.providers = [...(existingUser.providers || []), AuthProvider.GOOGLE];
        existingUser.googleId = data.googleId;
        if (data.picture) {
          existingUser.avatar = data.picture;
        }

        // Nếu account chưa active (local chưa verify), auto-active vì Google đã verify
        if (!existingUser.isActive) {
          existingUser.isActive = true;
          this.logger.log(
            `Auto-activated account ${data.email} via Google login`,
          );
        }
        await this.userRepository.save(existingUser);
        return existingUser;
      }
      await this.userRepository.save(existingUser);
      return existingUser;
    }

    // Tạo user mới với Google provider
    const newUser = this.userRepository.create({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      avatar: data.picture,
      googleId: data.googleId,
      providers: [AuthProvider.GOOGLE],
      isActive: true,
      role: UserRole.USER,
    });

    this.logger.log(`Created new user ${data.email} via Google`);
    await this.userRepository.save(newUser);
    return newUser;
  }

  async findAll(queryDto: UserQueryDto): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10 } = queryDto;
    this.logger.log('Fetching all users with pagination');
    
    const [data, total] = await this.userRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    this.logger.log(`Fetching user with ID: ${id}`);
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new HttpException(ErrorMessages.NOT_FOUND.USER, HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    this.logger.log(`Updating user with ID: ${id}`);
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new HttpException(ErrorMessages.NOT_FOUND.USER, HttpStatus.NOT_FOUND);
    }

    const updatedUser = Object.assign(user, updateUserDto);

    await this.userRepository.save(updatedUser);

    return updatedUser;
  }

  async updateHashedRefreshToken(id: string, hashedRefreshToken: string | null) {
    await this.userRepository.update(id, { hashedRefreshToken: hashedRefreshToken as any });
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    this.logger.log(`Starting to upload avatar for user ID: ${userId}`);
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new HttpException(ErrorMessages.NOT_FOUND.USER, HttpStatus.NOT_FOUND);
      }

      if (user.avatarPublicId) {
        try {
          await this.uploadService.deleteImage(user.avatarPublicId);
          this.logger.log(`Deleted old avatar for user ID: ${userId}`);
        } catch (err) {
          this.logger.warn(`Failed to delete old avatar: ${err.message}`);
        }
      }

      const uploadedImage = await this.uploadService.uploadImage(
        file,
        'user_avatars',
      );

      user.avatar = uploadedImage.secure_url;
      user.avatarPublicId = uploadedImage.public_id;
      await this.userRepository.save(user);

      this.logger.log(`Avatar uploaded successfully for user ID: ${userId}`);
      return { avatar: user.avatar };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Lỗi tải ảnh đại diện cho user ID: ${userId}`, error.message);
      throw new HttpException(ErrorMessages.UPLOAD.AVATAR_FAILED, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(id: string) {
    this.logger.log(`Xóa người dùng với ID: ${id}`);
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new HttpException(ErrorMessages.NOT_FOUND.USER, HttpStatus.NOT_FOUND);
    }

    if (user.avatarPublicId) {
      try {
        await this.uploadService.deleteImage(user.avatarPublicId);
      } catch (err) {
        this.logger.warn(`Không thể xóa ảnh đại diện khi xóa tài khoản: ${err.message}`);
      }
    }

    // Soft delete — không xóa vĩnh viễn khỏi database
    await this.userRepository.softRemove(user);
    return { id };
  }

  // Gửi OTP quên mật khẩu
  async sendForgotPasswordOtp(email: string) {
    this.logger.log(`Starting forgot password OTP for ${email}`);
    const currentTime = dayjs().valueOf();

    const cachedData = await this.otpService.getValueOtp(
      NAME_QUEUE.SEND_OTP_FORGOT_PASSWORD,
      email,
    );

    if (cachedData.time && (currentTime - Number(cachedData.time)) / 1000 < this.timeResendEmail) {
      this.logger.warn(`Attempt to resend forgot password OTP to ${email} too soon`);
      throw new HttpException(
        ErrorMessages.AUTH.OTP_WAIT(Math.ceil(this.timeResendEmail - (currentTime - Number(cachedData.time)) / 1000)),
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new HttpException(ErrorMessages.NOT_FOUND.USER, HttpStatus.NOT_FOUND);
    }

    if (!user.providers?.includes(AuthProvider.LOCAL)) {
      throw new HttpException(
        ErrorMessages.AUTH.GOOGLE_ONLY_ACCOUNT,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.otpService.genOtp(
      NAME_QUEUE.SEND_OTP_FORGOT_PASSWORD,
      email,
      user.firstName || '',
      user.lastName || '',
      currentTime,
    );

    this.logger.log(`Gửi OTP quên mật khẩu tới ${email}`);
    return { email };
  }

  // Xác minh OTP quên mật khẩu (chỉ kiểm tra, không xoá OTP)
  async verifyForgotPasswordOtp(email: string, otp: string) {
    this.logger.log(`Verifying forgot password OTP for ${email}`);

    const cachedData = await this.otpService.validateOtp(
      NAME_QUEUE.SEND_OTP_FORGOT_PASSWORD,
      email,
      otp,
    );

    if (!cachedData.success) {
      if (cachedData.retryAfter) {
        throw new HttpException(
          ErrorMessages.AUTH.OTP_TOO_MANY_ATTEMPTS(cachedData.retryAfter),
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new HttpException(
        ErrorMessages.AUTH.OTP_INVALID,
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(`Xác minh OTP quên mật khẩu thành công cho ${email}`);
    return { email };
  }

  // Xác thực OTP và đặt lại mật khẩu
  async resetPassword(email: string, otp: string, newPassword: string) {
    this.logger.log(`Starting password reset for ${email}`);

    const cachedData = await this.otpService.validateOtp(
      NAME_QUEUE.SEND_OTP_FORGOT_PASSWORD,
      email,
      otp,
    );

    if (!cachedData.success) {
      if (cachedData.retryAfter) {
        throw new HttpException(
          ErrorMessages.AUTH.OTP_TOO_MANY_ATTEMPTS(cachedData.retryAfter),
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new HttpException(
        ErrorMessages.AUTH.OTP_INVALID,
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new HttpException(ErrorMessages.NOT_FOUND.USER, HttpStatus.NOT_FOUND);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    await this.otpService.deleteOtp(
      NAME_QUEUE.SEND_OTP_FORGOT_PASSWORD,
      email,
    );

    this.logger.log(`Đặt lại mật khẩu thành công cho ${email}`);
    return { email };
  }

}

