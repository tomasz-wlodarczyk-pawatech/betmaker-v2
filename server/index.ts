import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { optimizeResponse, deduplicateRequests, monitorMemory } from "./performance";

const app = express();

// Security headers
app.use(
  helmet({
    frameguard: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://www.googletagmanager.com",
          "https://www.google-analytics.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        frameAncestors: ["*"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "*"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
  }),
);

// Enable gzip compression
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024,
  }),
);

// Set caching headers for static assets
app.use("/assets", (req, res, next) => {
  if (
    req.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
  ) {
    res.set("Cache-Control", "public, max-age=31536000, immutable"); // 1 year
    res.set("Expires", new Date(Date.now() + 31536000000).toUTCString());
  }
  next();
});

// Cache API responses for better performance
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

app.use("/api", (req, res, next) => {
  // Only cache GET requests
  if (req.method !== "GET") {
    return next();
  }
  
  const cacheKey = req.originalUrl;
  const cachedResponse = apiCache.get(cacheKey);
  
  if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_DURATION) {
    res.set("X-Cache", "HIT");
    res.set("Cache-Control", "public, max-age=300"); // 5 minutes
    return res.json(cachedResponse.data);
  }
  
  // Override res.json to cache the response
  const originalJson = res.json;
  res.json = function(data) {
    if (res.statusCode === 200) {
      apiCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      res.set("X-Cache", "MISS");
      res.set("Cache-Control", "public, max-age=300"); // 5 minutes
    }
    return originalJson.call(this, data);
  };
  
  next();
});

// Apply performance optimizations
app.use(optimizeResponse);
app.use(deduplicateRequests);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Start memory monitoring
setInterval(monitorMemory, 60000); // Monitor every minute

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
