import { NAME_REGISTER } from '@/enums/name-register.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CacheService } from '@/modules/cache/cache.service';

type OtpResult = {
  email: string | null;
  otp: string | null;
  time: string | null;
};

@Injectable()
export class OtpService {
  private readonly TTL_OTP = 600_000;
  
  constructor(
    private readonly cacheService: CacheService,
    @InjectQueue(NAME_REGISTER.OTP) private sendOtpQueue: Queue,
  ) {}

  async genOtp(
    name: string,
    email: string,
    firstName: string,
    lastName: string,
    currentTime: number,
  ): Promise<void> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.cacheService.set(
      `${name}:${email}`,
      JSON.stringify({ email, otp, time: currentTime.toString() }),
      this.TTL_OTP,
    );
    await this.sendOtpQueue.add(`${name}`, { email, otp, firstName, lastName });
  }

  async getValueOtp(name: string, email: string): Promise<OtpResult> {
    const cachedData = await this.cacheService.get<string>(`${name}:${email}`);
    if (cachedData) {
      return {
        email: JSON.parse(cachedData).email || null,
        otp: JSON.parse(cachedData).otp || null,
        time: JSON.parse(cachedData).time || null,
      };
    }
    return {
      email: null,
      otp: null,
      time: null,
    };
  }

  async deleteOtp(name: string, email: string) {
    await this.cacheService.del(`${name}:${email}`);
  }

  async validateOtp(name: string, email: string, otp: string) {
    const otpKey = `${name}:${email}`;
    const failCountKey = `${otpKey}:failCount`;
    const blockKey = `${otpKey}:block`;
    const blockLevelKey = `${otpKey}:blockLevel`;

    const isBlocked = await this.cacheService.get<string>(blockKey);
    if (isBlocked) {
      const ttl = await this.cacheService.getTtl(blockKey);
      return { success: false, retryAfter: ttl && ttl > 0 ? ttl : undefined };
    }

    const cachedData = await this.cacheService.get<string>(otpKey);
    if (!cachedData) {
      return { success: false, message: 'OTP expired or does not exist' };
    }

    const { otp: storedOtp } = JSON.parse(cachedData);
    if (storedOtp === otp) {
      await this.cacheService.del(failCountKey);
      await this.cacheService.del(blockKey);
      await this.cacheService.del(blockLevelKey);
      return { success: true };
    }

    let failCount = (await this.cacheService.get<number>(failCountKey)) || 0;
    failCount += 1;
    await this.cacheService.set(failCountKey, failCount, 3600_000); // 1 hour
    const blockLevel = (await this.cacheService.get<number>(blockLevelKey)) || 0;

    if (blockLevel === 0 && failCount >= 5) {
      await this.cacheService.set(blockKey, '1', 60_000);
      await this.cacheService.set(blockLevelKey, 1, 60_000);
    }

    if (blockLevel === 1 && failCount >= 10) {
      await this.cacheService.set(blockKey, '1', 60_000 * 2);
      await this.cacheService.set(blockLevelKey, 2, 60_000 * 2);
    }

    if (blockLevel === 2 && failCount >= 15) {
      await this.cacheService.set(blockKey, '1', 60_000 * 24);
      await this.cacheService.set(blockLevelKey, 3, 60_000 * 24);
    }
    
    return { success: false, message: 'Invalid OTP' };
  }
}
