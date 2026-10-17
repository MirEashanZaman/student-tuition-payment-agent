import { NextFunction, Request, Response } from 'express';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimitPolicy {
  name: string;
  limit: number;
  windowMs: number;
}

export class ApiRateLimitMiddleware {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private readonly maxBuckets = 10000;
  private lastCleanup = Date.now();

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
      this.removeExpiredBuckets(now);
      this.lastCleanup = now;
    }

    let bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      if (this.buckets.size >= this.maxBuckets) {
        this.removeExpiredBuckets(now);
      }
      if (this.buckets.size >= this.maxBuckets) {
        this.reject(response, 60);
        return;
      }
      bucket = { count: 0, resetAt: now + policy.windowMs };
      this.buckets.set(key, bucket);
    }

    if (bucket.count >= policy.limit) {
      this.reject(response, Math.ceil((bucket.resetAt - now) / 1000));
      return;
    }

    bucket.count += 1;
    response.setHeader('RateLimit-Limit', policy.limit);
    response.setHeader('RateLimit-Remaining', policy.limit - bucket.count);
    response.setHeader('RateLimit-Reset', Math.ceil((bucket.resetAt - now) / 1000));
    next();
  }

  private getPolicy(path: string): RateLimitPolicy {
    if (path === '/api/auth/login') {
      return { name: 'login', limit: 5, windowMs: 15 * 60 * 1000 };
    }
    if (path === '/api/auth/registration' || path === '/api/auth/register') {
      return { name: 'registration', limit: 10, windowMs: 15 * 60 * 1000 };
    }
    if (path === '/api/chat') {
      return { name: 'chat', limit: 20, windowMs: 60 * 1000 };
    }
    return { name: 'api', limit: 120, windowMs: 60 * 1000 };
  }

  private removeExpiredBuckets(now: number): void {
    for (const [key, bucket] of this.buckets) {
      if (now >= bucket.resetAt) {
        this.buckets.delete(key);
      }
    }
  }

  private reject(response: Response, retryAfterSeconds: number): void {
    response.setHeader('Retry-After', retryAfterSeconds);
    response.status(429).json({ statusCode: 429, message: 'Too many requests. Try again later.' });
  }
}
