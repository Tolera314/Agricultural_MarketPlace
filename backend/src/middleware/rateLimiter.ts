import type { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

/**
 * In-memory sliding-window rate limiter for sensitive endpoints.
 * Automatically cleans up expired tracking records.
 */
class MemoryRateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly message: string;

  constructor(options: { maxRequests: number; windowMs: number; message: string }) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
    this.message = options.message;

    // Periodically clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (now > record.resetAt) {
        this.records.delete(key);
      }
    }
  }

  public middleware(keyExtractor?: (req: Request) => string) {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
      const key = keyExtractor ? `${ip}:${keyExtractor(req)}` : ip;
      const now = Date.now();

      let record = this.records.get(key);

      if (!record || now > record.resetAt) {
        record = {
          count: 1,
          resetAt: now + this.windowMs,
        };
        this.records.set(key, record);
      } else {
        record.count += 1;
      }

      const remaining = Math.max(0, this.maxRequests - record.count);
      const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

      if (record.count > this.maxRequests) {
        res.setHeader('Retry-After', retryAfterSeconds);
        return res.status(429).json({
          success: false,
          error: {
            message: this.message,
            retryAfterSeconds,
          },
        });
      }

      next();
    };
  }
}

// 1. General Auth Rate Limiter: max 15 requests per 15 minutes per IP
export const authRateLimiter = new MemoryRateLimiter({
  maxRequests: 20,
  windowMs: 15 * 60 * 1000,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
}).middleware();

// 2. Sensitive Password Recovery Limiter: max 5 requests per 15 minutes per identifier/IP
export const passwordRecoveryLimiter = new MemoryRateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  message: 'Too many password reset requests. Please check your existing code or wait 15 minutes.',
}).middleware((req) => String(req.body?.identifier || '').trim().toLowerCase());

// 3. OTP Verification Limiter: max 6 verification attempts per 15 minutes
export const otpVerificationLimiter = new MemoryRateLimiter({
  maxRequests: 6,
  windowMs: 15 * 60 * 1000,
  message: 'Too many verification code attempts. Please wait 15 minutes before trying again.',
}).middleware((req) => String(req.body?.identifier || '').trim().toLowerCase());
