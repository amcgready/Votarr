// src/config/rateLimit.ts
import rateLimit from 'express-rate-limit';
import { config } from './environment';
import { log } from './logger';

// Default rate limit configuration
export const defaultRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn(`Rate limit exceeded for IP ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Please try again later',
    });
  },
});

// Stricter rate limit for authentication routes
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn(`Auth rate limit exceeded for IP ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many login attempts, please try again later',
    });
  },
});

// Rate limit for media endpoints
export const mediaRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many media requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn(`Media rate limit exceeded for IP ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many media requests, please try again later',
    });
  },
});

// Rate limit for voting endpoints
export const voteRateLimit = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 5, // 5 votes per 10 seconds
  message: 'Too many vote requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn(`Vote rate limit exceeded for IP ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many vote requests, please try again later',
    });
  },
});
