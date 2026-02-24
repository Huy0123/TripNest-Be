import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../auth/dto/register.dto';
import * as dayjs from 'dayjs';
import { NAME_QUEUE } from 'src/enums/name-queue.enum';
import { UserRole } from 'src/enums/user-role.enum';
import { AuthProvider } from 'src/enums/auth.enum';
import { CacheService } from '../cache/cache.service';
import { GoogleDto } from '../auth/dto/google.dto';
import { UploadService } from '../upload/upload.service';
import { UpdateUserDto } from './dto/update-user.dto';
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly timeResendEmail = 600;
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheService: CacheService,
    private readonly uploadService: UploadService,
  ) {}

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
        throw new HttpException('User already exists', HttpStatus.CONFLICT);
      }

      // User có Google account, thêm local login
      if (password !== confirmPassword) {
        throw new HttpException(
          'Passwords do not match',
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
      throw new HttpException('Passwords do not match', HttpStatus.BAD_REQUEST);
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

  // Gửi OTP xác thực
  async sendVerificationAccount(email: string) {
    this.logger.log(`Starting verification email to ${email}`);
    const currentTime = dayjs().valueOf();
    const cachedData = await this.cacheService.getValueOtp(
      NAME_QUEUE.SEND_OTP_VERIFY_ACCOUNT,
      email,
    );

    if (cachedData.time && (currentTime - Number(cachedData.time)) / 1000 < this.timeResendEmail) {
      this.logger.warn(
        `Attempt to resend verification email to ${email} too soon`,
      );
      throw new HttpException(
        `Please wait before requesting another verification email: ${(currentTime - Number(cachedData.time)) / 1000}s`,
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
    await this.cacheService.genOtp(
      NAME_QUEUE.SEND_OTP_VERIFY_ACCOUNT,
      email,
      userEmail?.firstName || '',
      userEmail?.lastName || '',
      currentTime,
    );
    this.logger.log(`Verification email sent to ${email}`);
    return {
      success: true,
      message: `Verification email sent successfully to ${email}`,
    };
  }

  async verifyAccount(email: string, otp: string) {
    this.logger.log(`Start verifying account for ${email}`);
    const cachedData = await this.cacheService.validateOtp(
      NAME_QUEUE.SEND_OTP_VERIFY_ACCOUNT,
      email,
      otp,
    );

    if (!cachedData.success) {
      if (cachedData.retryAfter) {
        throw new HttpException(
          `Too many failed attempts. Please try again after ${cachedData.retryAfter} seconds`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new HttpException(
        cachedData.message || 'Invalid OTP',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.userRepository.update({ email }, { isActive: true });
    this.logger.log(`User ${email} verified successfully`);
    await this.cacheService.deleteOtp(
      NAME_QUEUE.SEND_OTP_VERIFY_ACCOUNT,
      email,
    );
    this.logger.log(`End verifying account for ${email}`);
    return { success: true, message: 'Account verified successfully' };
  }

  async findUserById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
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

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    this.logger.log(`Starting to upload avatar for user ID: ${userId}`);
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (user.avatar) {
        const publicId = this.extractPublicId(user.avatar);
        if (publicId) {
          try {
            await this.uploadService.deleteImage(publicId);
            this.logger.log(`Deleted old avatar for user ID: ${userId}`);
          } catch (err) {
            this.logger.warn(`Failed to delete old avatar: ${err.message}`);
          }
        }
      }

      const uploadedImage = await this.uploadService.uploadImage(
        file,
        'user_avatars',
      );

      user.avatar = uploadedImage.url;
      await this.userRepository.save(user);

      this.logger.log(`Avatar uploaded successfully for user ID: ${userId}`);
      return {
        message: 'Avatar uploaded successfully',
        avatar: user.avatar,
      };
    } catch (error) {
      this.logger.error(`Error uploading avatar for user ID: ${userId}`, error.stack);
      throw error;
    }
  }

  async findAll() {
    this.logger.log('Fetching all users');
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    this.logger.log(`Fetching user with ID: ${id}`);
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const { password, ...result } = user;
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    this.logger.log(`Updating user with ID: ${id}`);
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (updateUserDto.avatar !== undefined && user.avatar && user.avatar !== updateUserDto.avatar) {
      const publicId = this.extractPublicId(user.avatar);
      if (publicId) {
        try {
          await this.uploadService.deleteImage(publicId);
          this.logger.log(`Deleted old avatar for user ID: ${id} during update`);
        } catch (err) {
          this.logger.warn(`Failed to delete old avatar during update: ${err.message}`);
        }
      }
    }

    const updatedUser = Object.assign(user, updateUserDto);
    await this.userRepository.save(updatedUser);
    
    const { password, ...result } = updatedUser;
    return result;
  }

  async remove(id: string) {
    this.logger.log(`Removing user with ID: ${id}`);
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (user.avatar) {
      const publicId = this.extractPublicId(user.avatar);
      if (publicId) {
        try {
          await this.uploadService.deleteImage(publicId);
          this.logger.log(`Deleted avatar for user ID: ${id} during account removal`);
        } catch (err) {
          this.logger.warn(`Failed to delete avatar during removal: ${err.message}`);
        }
      }
    }

    await this.userRepository.softRemove(user);
    return { success: true, message: 'User deleted successfully' };
  }

  private extractPublicId(url: string): string | null {
    try {
      if (!url || !url.includes('cloudinary.com')) return null;
      
      const parts = url.split('/upload/');
      if (parts.length < 2) return null;
      
      const pathWithVersion = parts[1];
      const pathParts = pathWithVersion.split('/');
      
      if (pathParts[0].startsWith('v')) {
        pathParts.shift();
      }
      
      const filenameWithExt = pathParts.join('/');
      const lastDotIndex = filenameWithExt.lastIndexOf('.');
      
      if (lastDotIndex !== -1) {
        return filenameWithExt.substring(0, lastDotIndex);
      }
      return filenameWithExt;
    } catch (error) {
      this.logger.error('Error extracting public ID from URL', error.stack);
      return null;
    }
  }
}

