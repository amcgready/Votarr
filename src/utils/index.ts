// Path: src/utils/index.ts

import crypto from 'crypto';

export const generateRandomString = (length: number): string => {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const parseError = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export const sanitizeObject = <T extends object>(obj: T): Partial<T> => {
  return Object.entries(obj)
    .filter(([_, value]) => value !== undefined && value !== null)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
    array.slice(index * size, (index + 1) * size)
  );
};

export class RateLimiter {
  private timestamps: number[] = [];
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  tryAcquire(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(time => now - time < this.windowMs);
    
    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }
    
    this.timestamps.push(now);
    return true;
  }

  getWaitTime(): number {
    if (this.timestamps.length < this.maxRequests) {
      return 0;
    }
    return this.windowMs - (Date.now() - this.timestamps[0]);
  }
}

export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
};

export const throttle = <F extends (...args: any[]) => any>(
  func: F,
  limit: number
) => {
  let inThrottle: boolean;
  let lastResult: ReturnType<F>;

  return (...args: Parameters<F>): ReturnType<F> => {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func(...args);
      setTimeout(() => (inThrottle = false), limit);
    }
    return lastResult;
  };
};

export const retry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
  onRetry?: (error: any, attempt: number) => void
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 1) throw error;
    
    if (onRetry) {
      onRetry(error, retries);
    }
    
    await sleep(delay);
    return retry(fn, retries - 1, delay, onRetry);
  }
};
