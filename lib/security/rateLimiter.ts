interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (req: any) => string;
  message?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

export class RateLimiter {
  private static limits: Map<string, RateLimitEntry> = new Map();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize rate limiter with cleanup
   */
  static initialize() {
    if (!this.cleanupInterval) {
      // Clean up expired entries every 5 minutes
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Check rate limit for a given key and configuration
   */
  static async checkLimit(
    key: string, 
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
    const limitKey = `${key}:${windowStart}`;
    
    const current = this.limits.get(limitKey) || {
      count: 0,
      resetTime: windowStart + config.windowMs,
      firstRequest: now
    };
    
    // Check if window has expired
    if (now > current.resetTime) {
      current.count = 0;
      current.resetTime = windowStart + config.windowMs;
      current.firstRequest = now;
    }
    
    // Check if limit exceeded
    if (current.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      };
    }
    
    // Increment count
    current.count++;
    this.limits.set(limitKey, current);
    
    return {
      allowed: true,
      remaining: config.maxRequests - current.count,
      resetTime: current.resetTime
    };
  }

  /**
   * Get rate limit info without incrementing
   */
  static async getLimitInfo(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
    const limitKey = `${key}:${windowStart}`;
    
    const current = this.limits.get(limitKey);
    
    if (!current) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: windowStart + config.windowMs
      };
    }
    
    if (now > current.resetTime) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: windowStart + config.windowMs
      };
    }
    
    return {
      allowed: current.count < config.maxRequests,
      remaining: Math.max(0, config.maxRequests - current.count),
      resetTime: current.resetTime
    };
  }

  /**
   * Reset rate limit for a key
   */
  static resetLimit(key: string): void {
    const keysToDelete = Array.from(this.limits.keys()).filter(k => k.startsWith(key + ':'));
    keysToDelete.forEach(k => this.limits.delete(k));
  }

  /**
   * Clean up expired entries
   */
  private static cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.limits.delete(key));
  }

  /**
   * Get rate limit statistics
   */
  static getStats() {
    const now = Date.now();
    const activeEntries = Array.from(this.limits.entries()).filter(
      ([_, entry]) => now <= entry.resetTime
    );
    
    return {
      totalEntries: this.limits.size,
      activeEntries: activeEntries.length,
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Destroy rate limiter and cleanup
   */
  static destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.limits.clear();
  }
}

// Predefined rate limit configurations
export const RateLimitConfigs = {
  // General API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests'
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts'
  },
  
  // Poll creation
  createPoll: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many poll creation attempts'
  },
  
  // Voting
  vote: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many voting attempts'
  },
  
  // Search
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many search requests'
  }
};

// Key generators for different contexts
export const KeyGenerators = {
  // By IP address
  byIp: (req: any) => {
    const ip = req.headers['x-forwarded-for'] || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress || 
               'unknown';
    return `ip:${ip}`;
  },
  
  // By user ID
  byUserId: (req: any) => {
    const userId = req.user?.id || req.headers['x-user-id'] || 'anonymous';
    return `user:${userId}`;
  },
  
  // By IP and user ID combination
  byIpAndUser: (req: any) => {
    const ip = req.headers['x-forwarded-for'] || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress || 
               'unknown';
    const userId = req.user?.id || req.headers['x-user-id'] || 'anonymous';
    return `ip:${ip}:user:${userId}`;
  },
  
  // By endpoint
  byEndpoint: (req: any) => {
    const ip = req.headers['x-forwarded-for'] || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress || 
               'unknown';
    const endpoint = req.url || req.path || 'unknown';
    return `endpoint:${endpoint}:ip:${ip}`;
  }
};

// Initialize rate limiter
RateLimiter.initialize();
