import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../utils/errors.js';

/**
 * General API rate limiter
 * Limits requests per IP address
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_ERROR',
        message: 'Too many requests from this IP, please try again later'
      }
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_ERROR',
        message: 'Too many login attempts, please try again later'
      }
    });
  }
});

/**
 * Post creation rate limiter
 * Limits post creation to 3 posts per 24 hours per user
 * This is handled in the postService, but we add an additional IP-based limit
 */
export const postCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 post creation attempts per hour
  message: 'Too many post creation attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_ERROR',
        message: 'Too many post creation attempts, please try again later'
      }
    });
  }
});

/**
 * Report rate limiter
 * Prevents spam reporting
 */
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 reports per hour
  message: 'Too many report submissions, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_ERROR',
        message: 'Too many report submissions, please try again later'
      }
    });
  }
});

/**
 * Comment rate limiter
 * Prevents spam commenting
 */
export const commentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 comments per hour
  message: 'Too many comments, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_ERROR',
        message: 'Too many comments, please try again later'
      }
    });
  }
});

/**
 * File upload rate limiter
 * Prevents abuse of file upload endpoints
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit each IP to 30 uploads per hour
  message: 'Too many file uploads, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_ERROR',
        message: 'Too many file uploads, please try again later'
      }
    });
  }
});

/**
 * Search rate limiter
 * Prevents abuse of search endpoints
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 searches per minute
  message: 'Too many search requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_ERROR',
        message: 'Too many search requests, please try again later'
      }
    });
  }
});
