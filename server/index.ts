import './bootstrap/env';
import { validateEnvironmentOrExit } from './bootstrap/validate-env';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { aiTutorRouter } from "./ai-tutor";
import healthRouter from "./health";
import { initializeGHL, getGHLService } from "./ghl-integration";
import { initializeAffiliateIntegrations } from "./affiliate-integrations";
import { GHLAIBridgeService } from './ghl-ai-bridge';
import { LauraOracleService } from './laura-oracle-service';

const app = express();

// CORS middleware - Allow requests from Vite dev server and production domains
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://professionaldiver.app',
    'https://www.professionaldiver.app',
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

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

app.get('/', (_req, res) => res.type('text/plain').send('OK'));

async function main() {
  // Validate environment variables before starting
  validateEnvironmentOrExit();

  // Test database connection
  try {
    if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
      console.log('🔍 Testing PostgreSQL database connection...');
      const { db } = await import('./db.js');
      // Try a simple query to verify connection
      await db.select().from((await import('@shared/schema')).users).limit(1);
      console.log('✅ Database connection verified');
    } else {
      console.log(`🔧 Using local SQLite database for development`);
    }
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Production requires a working database connection. Exiting.');
      process.exit(1);
    } else {
      console.warn('⚠️ Continuing with mock database for development');
    }
  }
  
  // Initialize GHL integration if API key is provided
  if (process.env.GHL_API_KEY) {
    const ghlService = initializeGHL(process.env.GHL_API_KEY);
    const isConnected = await ghlService.testConnection();
    if (isConnected) {
      console.log('🔗 GoHighLevel integration initialized successfully');
      
      // Initialize GHL AI Bridge with LangChain integration
      const ghlAIBridge = GHLAIBridgeService.getInstance();
      const lauraOracle = LauraOracleService.getInstance();
      
      // Connect AI services to GHL
      ghlAIBridge.setGHLService(ghlService);
      lauraOracle.setGHLService(ghlService);
      
      console.log('🤖 GHL AI Bridge initialized with LangChain integration');
      console.log('🚀 Laura Oracle connected to GHL AI agents');
    } else {
      console.warn('⚠️ GoHighLevel connection failed - running without GHL integration');
    }
  } else {
    console.log('ℹ️ GHL_API_KEY not provided - running without GoHighLevel integration');
  }

  // Initialize Affiliate Integrations
  const affiliateIntegrationsConfig = {
    ghl: {
      enabled: !!(process.env.GHL_API_KEY || process.env.GHL_CLIENT_ID),
      pipelineId: process.env.GHL_AFFILIATE_PIPELINE_ID,
      affiliateStageId: process.env.GHL_AFFILIATE_STAGE_ID,
      conversionStageId: process.env.GHL_CONVERSION_STAGE_ID
    },
    stripe: {
      enabled: !!process.env.STRIPE_SECRET_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    },
    paypal: {
      enabled: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      sandbox: process.env.NODE_ENV !== 'production'
    },
    revolut: {
      enabled: !!process.env.REVOLUT_API_KEY,
      apiKey: process.env.REVOLUT_API_KEY,
      webhookSecret: process.env.REVOLUT_WEBHOOK_SECRET,
      merchantId: process.env.REVOLUT_MERCHANT_ID
    },
    analytics: {
      enabled: !!(process.env.GA4_MEASUREMENT_ID || process.env.FACEBOOK_PIXEL_ID),
      googleAnalyticsId: process.env.GA4_MEASUREMENT_ID,
      facebookPixelId: process.env.FACEBOOK_PIXEL_ID
    }
  };

  const affiliateIntegrations = initializeAffiliateIntegrations(affiliateIntegrationsConfig);
  console.log('🤝 Affiliate integrations initialized:', {
    ghl: affiliateIntegrationsConfig.ghl.enabled,
    stripe: affiliateIntegrationsConfig.stripe.enabled,
    paypal: affiliateIntegrationsConfig.paypal.enabled,
    revolut: affiliateIntegrationsConfig.revolut.enabled,
    analytics: affiliateIntegrationsConfig.analytics.enabled
  });

  // Initialize Revolut Subscription Service (if API key provided)
  if (process.env.REVOLUT_API_KEY) {
    const { initializeRevolutSubscriptions } = await import('./revolut-subscriptions');
    initializeRevolutSubscriptions({
      apiKey: process.env.REVOLUT_API_KEY,
      merchantId: process.env.REVOLUT_MERCHANT_ID,
      webhookSecret: process.env.REVOLUT_WEBHOOK_SECRET
    });
    console.log('✅ Revolut subscription service initialized');
  }
  
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
  const host = process.env.HOST || '127.0.0.1';
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
