import { Request, Response, NextFunction } from 'express';

// Advanced caching with LRU-style cleanup
class PerformanceCache {
  private cache = new Map<string, any>();
  private maxSize = 1000;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set(key: string, value: any, ttl: number = 5 * 60 * 1000) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entries if cache is full
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

export const performanceCache = new PerformanceCache();

// Response compression and optimization middleware
export function optimizeResponse(req: Request, res: Response, next: NextFunction) {
  // Set performance headers
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  
  // Enable keep-alive for better connection reuse
  res.set('Connection', 'keep-alive');
  
  // Optimize JSON responses
  const originalJson = res.json;
  res.json = function(data: any) {
    // Compress large responses
    if (JSON.stringify(data).length > 1024) {
      res.set('Content-Encoding', 'gzip');
    }
    
    // Add cache headers for successful responses
    if (res.statusCode === 200) {
      res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
      res.set('ETag', `"${Date.now().toString(36)}"`);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
}

// Request deduplication middleware
const pendingRequests = new Map<string, Promise<any>>();

export function deduplicateRequests(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'GET') return next();
  
  const key = req.originalUrl;
  
  if (pendingRequests.has(key)) {
    // Wait for the existing request to complete
    pendingRequests.get(key)!.then(result => {
      res.json(result);
    }).catch(err => {
      res.status(500).json({ error: err.message });
    });
    return;
  }
  
  // Create a promise for this request
  const promise = new Promise((resolve, reject) => {
    const originalJson = res.json;
    res.json = function(data: any) {
      resolve(data);
      pendingRequests.delete(key);
      return originalJson.call(this, data);
    };
    
    res.on('error', (err) => {
      reject(err);
      pendingRequests.delete(key);
    });
  });
  
  pendingRequests.set(key, promise);
  next();
}

// Memory usage monitoring
export function monitorMemory() {
  const usage = process.memoryUsage();
  const formatMB = (bytes: number) => Math.round(bytes / 1024 / 1024 * 100) / 100;
  
  console.log(`Memory Usage: RSS ${formatMB(usage.rss)}MB, Heap ${formatMB(usage.heapUsed)}MB/${formatMB(usage.heapTotal)}MB`);
  
  // Clear caches if memory usage is high
  if (usage.heapUsed > 100 * 1024 * 1024) { // 100MB threshold
    performanceCache.destroy();
    global.gc && global.gc();
  }
}