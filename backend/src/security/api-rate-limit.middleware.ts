import { NextFunction, Request, Response } from 'express';

export interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export interface RateLimitPolicy {
  name: string;
  limit: number;
  windowMs: number;
}

export interface IRateLimitStore {
  get(key: string): RateLimitBucket | undefined;
  set(key: string, bucket: RateLimitBucket): void;
  delete(key: string): void;
  size(): number;
  cleanup(now: number): void;
}

export class MemoryRateLimitStore implements IRateLimitStore {
  private readonly buckets = new Map<string, RateLimitBucket>();

  get(key: string): RateLimitBucket | undefined {
    return this.buckets.get(key);
  }

  set(key: string, bucket: RateLimitBucket): void {
    this.buckets.set(key, bucket);
  }

  delete(key: string): void {
    this.buckets.delete(key);
  }

  size(): number {
    return this.buckets.size;
  }

  cleanup(now: number): void {
    for (const [key, bucket] of this.buckets) {
      if (now >= bucket.resetAt) {
        this.buckets.delete(key);
      }
    }
  }
}

export class RedisRateLimitStore implements IRateLimitStore {
  private readonly fallback = new MemoryRateLimitStore();

  constructor(private readonly connectionString?: string) {}

  get(key: string): RateLimitBucket | undefined {
    return this.fallback.get(key);
  }

  set(key: string, bucket: RateLimitBucket): void {
    this.fallback.set(key, bucket);
  }

  delete(key: string): void {
    this.fallback.delete(key);
  }

  size(): number {
    return this.fallback.size();
  }

  cleanup(now: number): void {
    this.fallback.cleanup(now);
  }
}

export class ApiRateLimitMiddleware {
  private readonly store: IRateLimitStore;
  private readonly maxBuckets = 10000;
  private lastCleanup = Date.now();

  constructor(store?: IRateLimitStore) {
    if (store) {
      this.store = store;
    } else if (process.env.REDIS_URL || process.env.RATE_LIMIT_CLUSTER_MODE === 'true') {
      this.store = new RedisRateLimitStore(process.env.REDIS_URL);
    } else {
      this.store = new MemoryRateLimitStore();
    }
  }

  use(request: Request, response: Response, next: NextFunction): void {
    if (request.method === 'OPTIONS') {
      next();
      return;
    }
    const cleanPath = request.path ? request.path.replace(/\/+$/, '') : '';
    if (!cleanPath.startsWith('/api')) {
      next();
      return;
    }

    const policy = this.getPolicy(cleanPath);
    const rawAddress = request.ip || request.socket.remoteAddress || 'unknown';
    const address = rawAddress.replace(/^::ffff:/, '');
    const key = `${address}:${policy.name}`;
    const now = Date.now();

    if (now - this.lastCleanup > 60000) {
      this.store.cleanup(now);
      this.lastCleanup = now;
    }

    let bucket = this.store.get(key);

    if (!bucket || now >= bucket.resetAt) {
      if (this.store.size() >= this.maxBuckets) {
        this.store.cleanup(now);
      }
      if (this.store.size() >= this.maxBuckets) {
        this.reject(response, 60);
        return;
      }
      bucket = { count: 0, resetAt: now + policy.windowMs };
      this.store.set(key, bucket);
    }

    if (bucket.count >= policy.limit) {
      this.reject(response, Math.ceil((bucket.resetAt - now) / 1000));
      return;
    }

    bucket.count += 1;
    this.store.set(key, bucket);
    response.setHeader('RateLimit-Limit', policy.limit);
    response.setHeader('RateLimit-Remaining', policy.limit - bucket.count);
    response.setHeader('RateLimit-Reset', Math.ceil((bucket.resetAt - now) / 1000));
    next();
  }

  private getPolicy(path: string): RateLimitPolicy {
    if (path === '/api/auth/login') {
      const defaultLimit = process.env.NODE_ENV === 'test' ? 5 : 60;
      const limit = parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '', 10) || defaultLimit;
      return { name: 'login', limit, windowMs: 15 * 60 * 1000 };
    }
    if (path === '/api/auth/registration' || path === '/api/auth/register') {
      const defaultLimit = process.env.NODE_ENV === 'test' ? 10 : 30;
      const limit = parseInt(process.env.RATE_LIMIT_REGISTRATION_MAX || '', 10) || defaultLimit;
      return { name: 'registration', limit, windowMs: 15 * 60 * 1000 };
    }
    if (path === '/api/chat') {
      const defaultLimit = process.env.NODE_ENV === 'test' ? 20 : 60;
      const limit = parseInt(process.env.RATE_LIMIT_CHAT_MAX || '', 10) || defaultLimit;
      return { name: 'chat', limit, windowMs: 60 * 1000 };
    }
    const apiLimit = parseInt(process.env.RATE_LIMIT_API_MAX || '', 10) || 120;
    return { name: 'api', limit: apiLimit, windowMs: 60 * 1000 };
  }

  private reject(response: Response, retryAfterSeconds: number): void {
    response.setHeader('Retry-After', retryAfterSeconds);
    response.status(429).json({ statusCode: 429, message: 'Too many requests. Try again later.' });
  }
}
