import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async set(key: string, value: any, ttl?: number) {
    await this.cacheManager.set(key, value, ttl);
  }

  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async del(key: string) {
    await this.cacheManager.del(key);
  }

  async getTtl(key: string): Promise<number | undefined> {
  return typeof this.cacheManager.ttl === 'function'
    ? this.cacheManager.ttl(key)
    : undefined;
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
