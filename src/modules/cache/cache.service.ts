import { NAME_QUEUE } from '@/enums/name-queue.enum';
import { NAME_REGISTER } from '@/enums/name-register.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Cache } from 'cache-manager';
type OtpResult = {
  email: string | null;
  otp: string | null;
  time: string | null;
};
@Injectable()
export class CacheService {
  private readonly TTL_OTP = 600_000;
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
    await this.cacheManager.set(
      `${name}:${email}`,
      JSON.stringify({ email, otp, time: currentTime.toString() }),
      this.TTL_OTP,
    );
    await this.sendOtpQueue.add(`${name}`, { email, otp, firstName, lastName });
  }

  async getValueOtp(name: string, email: string): Promise<OtpResult> {
    const cachedData = await this.cacheManager.get(`${name}:${email}`);
    if (cachedData) {
      return {
        email: JSON.parse(cachedData as string).email || null,
        otp: JSON.parse(cachedData as string).otp || null,
        time: JSON.parse(cachedData as string).time || null,
      };
    }
    return {
      email: null,
      otp: null,
      time: null,
    };
  }

  async deleteOtp(name: string, email: string) {
    await this.cacheManager.del(`${name}:${email}`);
  }

  async validateOtp(name: string, email: string, otp: string) {
    const otpKey = `${name}:${email}`;
    const failCountKey = `${otpKey}:failCount`;
    const blockKey = `${otpKey}:block`;
    const blockLevelKey = `${otpKey}:blockLevel`;

    const isBlocked = await this.cacheManager.get(blockKey);
    if (isBlocked) {
      const ttl = await this.cacheManager.ttl(blockKey);
      return { success: false, retryAfter: ttl && ttl > 0 ? ttl : undefined };
    }

    const cachedData = await this.cacheManager.get(otpKey);
    if (!cachedData) {
      return { success: false, message: 'OTP expired or does not exist' };
    }

    const { otp: storedOtp } = JSON.parse(cachedData as string);
    if (storedOtp === otp) {
      await this.cacheManager.del(failCountKey);
      await this.cacheManager.del(blockKey);
      await this.cacheManager.del(blockLevelKey);
      return { success: true };
    }

    let failCount = (await this.cacheManager.get(failCountKey)) as number;
    failCount = (failCount || 0) + 1;
    await this.cacheManager.set(failCountKey, failCount, 3600_000); // 1 hour
    const blockLevel = (await this.cacheManager.get(blockLevelKey)) as number;

    if (blockLevel === 0 && failCount >= 5) {
      await this.cacheManager.set(blockKey, '1', 60_000);
      await this.cacheManager.set(blockLevelKey, '1', 60_000);
    }

    if (blockLevel === 1 && failCount >= 10) {
      await this.cacheManager.set(blockKey, '1', 60_000 * 2);
      await this.cacheManager.set(blockLevelKey, '2', 60_000 * 2);
    }

    if (blockLevel === 2 && failCount >= 15) {
      await this.cacheManager.set(blockKey, '1', 60_000 * 24);
      await this.cacheManager.set(blockLevelKey, '3', 60_000 * 24);
    }
    return { success: false, message: 'Invalid OTP' };
  }

  async set(key: string, value: any, ttl?: number) {
    await this.cacheManager.set(key, value, ttl);
  }

  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async del(key: string) {
    await this.cacheManager.del(key);
  }

  async acquireLock(key: string, ttl: number): Promise<boolean> {
    const store = (this.cacheManager as any).store;
    if (store.client && typeof store.client.set === 'function') {
      // Use Redis SET NX if available
      // redis v4: set(key, value, { PX: ttl, NX: true })
      // or legacy: set(key, value, 'PX', ttl, 'NX')
      try {
        const result = await store.client.set(key, 'LOCKED', {
          PX: ttl,
          NX: true,
        });
        return result === 'OK';
      } catch (e) {
         // Fallback or error logging
         Logger.error('Failed to acquire lock via redis client', e);
      }
    }
    
    // Fallback for non-redis stores or failure: check and set (not atomic)
    const exists = await this.cacheManager.get(key);
    if (exists) return false;
    await this.cacheManager.set(key, 'LOCKED', ttl);
    return true;
  }

  async releaseLock(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }
}
