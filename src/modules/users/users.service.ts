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
import { CacheService } from '../cache/cache.service';
import { GoogleDto } from '../auth/dto/google.dto';
import { UserProfilesService } from '../user_profiles/user_profiles.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly timeResendEmail = 600;
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheService: CacheService,
    private readonly userProfilesService: UserProfilesService,
  ) {}

  async findByEmail(email: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      return user;
    }
    return null;
  }

  async register(user: RegisterDto) {
    const { email, password, confirmPassword, firstName, lastName } = user;
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    // Nếu user đã tồn tại với Google, thêm local provider
    if (existingUser) {
      if (existingUser.providers?.includes('local')) {
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
      existingUser.providers = [...(existingUser.providers || []), 'local'];

      await this.sendVerificationAccount(email);
      await this.userRepository.save(existingUser);

      return {
        id: existingUser.id,
        message:
          'Local login added to existing Google account. Please verify your email.',
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
      providers: ['local'],
      isActive: false,
      role: UserRole.USER,
    });
    await this.sendVerificationAccount(email);
    await this.userRepository.save(newUser);
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

    if (
      cachedData.time &&
      (currentTime - Number(cachedData.time)) / 1000 < this.timeResendEmail
    ) {
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
      if (!existingUser.providers?.includes('google')) {
        existingUser.providers = [...(existingUser.providers || []), 'google'];
        existingUser.googleId = data.googleId;
        if (data.picture) {
          const profile = await this.userProfilesService.findOne(
            existingUser.id,
          );
          if (profile) {
            profile.avatarUrl = data.picture;
            await this.userProfilesService.update(existingUser.id, profile);
          }
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
      googleId: data.googleId,
      providers: ['google'],
      isActive: true,
      role: UserRole.USER,
    });

    this.logger.log(`Created new user ${data.email} via Google`);
    await this.userRepository.save(newUser);
    return newUser;
  }
}
