import { Injectable, Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject('REDIS_CLIENT') private redisClient: Redis,
  ) {}

  async set(key: string, value: any, ttl?: number) {
    this.logger.log(`Setting cache key: ${key}`);
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl) {
      await this.redisClient.set(key, stringValue, 'PX', ttl);
    } else {
      await this.redisClient.set(key, stringValue);
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    const data = await this.redisClient.get(key);
    if (!data) return undefined;
    return data as T;
  }

  async getCacheVersion(namespace: string): Promise<number> {
    const versionStr = await this.redisClient.get(`${namespace}:version`);
    return versionStr ? parseInt(versionStr, 10) : 1;
  }

  async incrementCacheVersion(namespace: string): Promise<number> {
    return await this.redisClient.incr(`${namespace}:version`);
  }

  async del(key: string) {
    this.logger.log(`Deleting cache key: ${key}`);
    if (key.includes('*')) {
      const keys = await this.redisClient.keys(key);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
    } else {
      await this.redisClient.del(key);
    }
  }

  async getTtl(key: string): Promise<number | undefined> {
    this.logger.log(`Getting TTL for cache key: ${key}`);
    return await this.redisClient.pttl(key);
  }

  async acquireLock(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redisClient.set(`${key}:lock`, 'LOCKED', 'PX', ttl, 'NX');
      return result === 'OK';
    } catch (e) {
      Logger.error('Failed to acquire lock via redis client', e);
      return false;
    }
  }

  async releaseLock(key: string): Promise<void> {
    await this.redisClient.del(`${key}:lock`);
  }
}
