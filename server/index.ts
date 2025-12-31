import './bootstrap/env';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { aiTutorRouter } from "./ai-tutor";
import healthRouter from "./health";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  
  // Mount AI Tutor router
  app.use('/api/ai-tutor', aiTutorRouter);
  console.log('🤖 AI Tutor routes mounted at /api/ai-tutor');
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // VITE COMPLETELY REMOVED - PURE EXPRESS API SERVER ONLY
  const port = Number(process.env.PORT) || 5000;
  const host =
    process.env.HOST ||
    (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
  const serverInstance = app.listen(port, host, () => {
    console.log(`[express] serving on http://${host}:${port}`);
  });
}

main().catch((e) => {
  console.error('FATAL BOOT ERROR', e);
  process.exit(1);
});

process.on('unhandledRejection', (e) => { console.error('UNHANDLED REJECTION', e); process.exit(1); });
process.on('uncaughtException',  (e) => { console.error('UNCAUGHT EXCEPTION',  e); process.exit(1); });
