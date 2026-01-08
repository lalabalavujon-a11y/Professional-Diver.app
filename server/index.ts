import './bootstrap/env';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { aiTutorRouter } from "./ai-tutor";
import healthRouter from "./health";
import { initializeFeatureManagement } from "./feature-initialization";

const app = express();

// CORS headers - allow requests from Cloudflare Pages and local development
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://professional-diver-app.pages.dev',
    'https://professionaldiver.app',
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3001',
    'http://localhost:3001',
  ];
  
  // Allow requests from allowed origins or any origin in development
  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development')) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-email');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Skip body parsing for multipart/form-data (file uploads) - multer will handle it
app.use((req, res, next) => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    return next(); // Skip body parsing for file uploads
  }
  express.json()(req, res, next);
});
app.use((req, res, next) => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    return next(); // Skip body parsing for file uploads
  }
  express.urlencoded({ extended: false })(req, res, next);
});

// Simple request logging
app.use((req, _res, next) => { 
  console.log(`${req.method} ${req.url}`); 
  next(); 
});

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

      console.log(`${new Date().toLocaleTimeString()} [express] ${logLine}`);
    }
  });

  next();
});

// Mount comprehensive health check router
app.use('/health', healthRouter);
// Alias for Vite proxy sanity checks in CI (expects /api/health)
app.use('/api/health', healthRouter);

app.get('/', (_req, res) => res.type('text/plain').send('OK'));

async function main() {
  console.log(`🔧 Using local SQLite database for development`);
  // await db.connect()   // if this throws, you'll see it
  
  // Initialize feature management system
  try {
    await initializeFeatureManagement();
  } catch (error) {
    console.error('Warning: Feature management initialization failed:', error);
    // Continue startup even if feature init fails
  }
  
  // Mount AI Tutor router
  app.use('/api/ai-tutor', aiTutorRouter);
  console.log('🤖 AI Tutor routes mounted at /api/ai-tutor');
  
  const httpServer = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // VITE COMPLETELY REMOVED - PURE EXPRESS API SERVER ONLY
  // Use the server returned from registerRoutes instead of creating a new one
  const port = Number(process.env.PORT) || 5000;
  const host =
    process.env.HOST ||
    (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
  
  // Start the server that was returned from registerRoutes
  httpServer.listen(port, host, () => {
    console.log(`✅ [express] Server started successfully on http://${host}:${port}`);
    console.log(`✅ PORT environment variable: ${process.env.PORT || 'not set'}`);
    console.log(`✅ NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  });
  
  // Handle server errors
  httpServer.on('error', (error: any) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use`);
    }
  });
}

main().catch((e) => {
  console.error('FATAL BOOT ERROR', e);
  process.exit(1);
});

process.on('unhandledRejection', (e) => { console.error('UNHANDLED REJECTION', e); process.exit(1); });
process.on('uncaughtException',  (e) => { console.error('UNCAUGHT EXCEPTION',  e); process.exit(1); });
