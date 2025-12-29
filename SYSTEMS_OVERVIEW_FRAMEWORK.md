# 🏗️ Professional Diver Training App - Systems Overview Framework

## 📋 Executive Summary

This document provides a comprehensive overview of all systems, services, and integrations that power the Professional Diver Training Platform (`professionaldiver.app`). The platform is built on Cloudflare's edge computing infrastructure with multiple third-party integrations for payments, CRM, AI, and more.

---

## 🌐 **1. CLOUDFLARE INFRASTRUCTURE**

### **1.1 Cloudflare Workers**
**Purpose**: Edge computing platform for serving the application

**Configuration**:
- **Main Worker**: `professionaldiver-app-production`
  - Serves static assets and handles routing
  - Location: `worker/index.ts`
  - Routes: `professionaldiver.app/*`, `www.professionaldiver.app/*`
  
- **API Worker**: `professionaldiver-api-production`
  - Handles API requests and database operations
  - Location: `worker-api/index.ts`
  - Accessed via service binding from main worker

**Key Features**:
- ✅ Static asset serving with caching
- ✅ SPA routing support
- ✅ API request proxying
- ✅ CORS handling
- ✅ SEO meta tag injection

**Files**:
- `wrangler.toml` - Main worker configuration
- `wrangler-api.toml` - API worker configuration

---

### **1.2 Cloudflare D1 Database**
**Purpose**: Primary database for data persistence (SQLite-based)

**Configuration**:
- **Database Name**: `professionaldiver-db`
- **Binding**: `DB` (accessible in workers)
- **Type**: SQLite (D1-compatible)
- **ORM**: Drizzle ORM with SQLite adapter

**Schema**:
- Users, Tracks, Lessons, Questions
- Progress tracking, Exam results
- Affiliates, Referrals, Payouts
- Email campaigns, Testimonials

**Migration Status**:
- ⚠️ Database ID needs to be configured: `"your-d1-database-id"`
- Migration files in `migrations/` directory

**Files**:
- `worker-api/db.ts` - D1 database connection
- `shared/schema-sqlite.ts` - SQLite-compatible schema
- `drizzle.config.ts` - Drizzle ORM configuration

---

### **1.3 Cloudflare KV (Key-Value Storage)**
**Purpose**: Fast, edge-distributed key-value storage for caching and temporary data

**Namespaces**:
1. **CACHE** (`id: 57528e506bd44c3a8967a69ae3743786`)
   - Caching frequently accessed data
   - Session storage
   - API response caching

2. **DATA** (`id: 603a0c567ea54fc08925b7bd99839d18`)
   - User data caching
   - Temporary storage
   - Cross-worker data sharing

**Bindings**: `CACHE`, `DATA`

---

### **1.4 Cloudflare Assets**
**Purpose**: Static asset hosting and CDN

**Configuration**:
- **Directory**: `./dist/client` (built Vite output)
- **Binding**: `ASSETS`
- **Features**:
  - Automatic CDN distribution
  - Cache headers for static files
  - Image optimization

---

### **1.5 Cloudflare DNS & Routing**
**Purpose**: Domain management and request routing

**Domain**: `professionaldiver.app`
- Production routes configured
- SSL/TLS: Full (strict)
- Always Use HTTPS: Enabled

---

## 💳 **2. PAYMENT SYSTEMS**

### **2.1 Stripe Integration**
**Purpose**: Payment processing and affiliate payouts

**Status**: ⚠️ Account recovery needed (email access lost)

**Features**:
- Customer subscription payments
- Payment links for subscriptions
- Stripe Connect for affiliate payouts
- Webhook handling for payment events

**Configuration**:
- **Secret Key**: `STRIPE_SECRET_KEY`
- **Webhook Secret**: `STRIPE_WEBHOOK_SECRET`
- **API Version**: `2024-12-18.acacia`

**Files**:
- `server/affiliate-integrations.ts` - Stripe integration
- `PAYMENT_MIGRATION_GUIDE.md` - Migration documentation

**Payment Links** (Legacy):
- Monthly: `https://buy.stripe.com/8x24gzg9S2gG7WX4XugMw03`
- Annual: `https://buy.stripe.com/eVq8wP1eY2gG4KLblSgMw04`

---

### **2.2 Revolut Business**
**Purpose**: Alternative payment provider for customer subscriptions

**Status**: ✅ Configured, ready for use

**Features**:
- Subscription products
- Payment links
- Lower fees than Stripe
- Bank transfer capabilities

**Configuration**:
- **API Key**: `REVOLUT_API_KEY`
- **Webhook Secret**: `REVOLUT_WEBHOOK_SECRET`
- **Merchant ID**: `REVOLUT_MERCHANT_ID`

**Files**:
- `server/revolut-subscriptions.ts` - Revolut integration
- `REVOLUT_API_SETUP_COMPLETE.md` - Setup documentation

**Recommended Strategy**: Use Revolut for customer payments, Stripe/PayPal for affiliate payouts

---

### **2.3 PayPal Integration**
**Purpose**: Affiliate payout processing

**Status**: ✅ Implemented, ready for configuration

**Features**:
- Automated affiliate payouts
- PayPal Business API
- Payout scheduling

**Configuration**:
- **Client ID**: `PAYPAL_CLIENT_ID`
- **Client Secret**: `PAYPAL_CLIENT_SECRET`
- **Sandbox Mode**: `PAYPAL_SANDBOX` (true/false)

**Files**:
- `server/affiliate-integrations.ts` - PayPal integration

---

## 🗄️ **3. DATABASE SYSTEMS**

### **3.1 Development Database (SQLite)**
**Purpose**: Local development database

**Location**: `local-dev.db`
- **ORM**: Drizzle ORM with better-sqlite3
- **Schema**: `shared/schema-sqlite.ts`
- **Features**: WAL mode enabled

**Files**:
- `server/db.ts` - Database connection logic
- `local-dev.db` - SQLite database file

---

### **3.2 Production Database Options**

**Option A: Cloudflare D1** (Primary)
- SQLite-based, edge-distributed
- Native Cloudflare integration
- Automatic backups to R2

**Option B: PostgreSQL** (Fallback)
- Neon serverless PostgreSQL
- Used if `DATABASE_URL` is set
- Connection via `@neondatabase/serverless`

**Configuration**:
- Environment-based selection in `server/db.ts`
- Production uses D1, development uses SQLite

---

## 📧 **4. EMAIL SERVICES**

### **4.1 SendGrid**
**Purpose**: Transactional email delivery

**Status**: ✅ Configured

**Features**:
- Welcome emails
- Password reset emails
- Support ticket confirmations
- Email campaign delivery

**Configuration**:
- **API Key**: `SENDGRID_API_KEY`
- **From Email**: Configured in email templates

**Files**:
- `server/email-marketing.ts` - Email service implementation
- `SENDGRID_SETUP_GUIDE.md` - Setup documentation

---

### **4.2 Nodemailer (SMTP)**
**Purpose**: Alternative email delivery via SMTP

**Status**: ✅ Available as fallback

**Features**:
- SMTP server connection
- Custom email server support
- Google Workspace integration

**Configuration**:
- **SMTP URL**: `EMAIL_SERVER` (smtp://user:pass@host:port)
- **From Address**: `EMAIL_FROM`

**Files**:
- `server/email-marketing.ts` - SMTP support

---

### **4.3 Email Campaigns**
**Purpose**: Automated email marketing campaigns

**Features**:
- Welcome email sequences
- Follow-up campaigns
- Testimonial requests
- Review requests

**Automation**:
- Cron jobs for scheduled campaigns
- Triggered by user actions
- GHL integration for campaign tracking

**Files**:
- `server/email-marketing.ts` - Campaign logic
- `scripts/send-email-campaigns.ts` - Campaign scripts
- `cron-setup.sh` - Cron job setup

---

## 🤖 **5. AI & MACHINE LEARNING**

### **5.1 OpenAI Integration**
**Purpose**: AI-powered learning assistance and tutoring

**Features**:
- AI tutors for each diving discipline
- Learning path generation
- Personalized recommendations
- Chat support

**Configuration**:
- **API Key**: `OPENAI_API_KEY`
- **Model**: GPT-4 (configurable)

**Files**:
- `server/ai-tutor.ts` - AI tutor service
- `server/ai-tutors.ts` - Multiple tutor instances
- `server/ai-learning-path-service.ts` - Learning path generation
- `server/api/langchain-tutor.ts` - LangChain integration

---

### **5.2 LangChain Integration**
**Purpose**: Advanced AI orchestration and chain management

**Features**:
- Multi-step AI reasoning
- Context management
- Memory systems
- Tool integration

**Configuration**:
- **LangSmith**: Tracing and monitoring (integrated with LangChain)
  - **Purpose**: Observability platform for LangChain operations
  - **Features**: Run tracking, interaction logging, performance monitoring
  - **Project**: `professional-diver-training-app`
  - **API Key**: `LANGSMITH_API_KEY`
  - **Status**: Optional but recommended for production
- **Chains**: Custom learning path chains

**LangSmith Integration**:
- All LangChain interactions are logged to LangSmith
- Domain learning from user interactions
- Performance analytics and debugging
- Historical interaction tracking

**Files**:
- `server/langchain-config.ts` - LangChain & LangSmith configuration
- `server/api/langchain-tutor.ts` - LangChain tutor API
- `server/laura-oracle-service.ts` - Uses LangSmith for domain learning
- `server/diver-well-service.ts` - Uses LangSmith for interaction tracking

---

### **5.3 Laura Oracle Service**
**Purpose**: AI-powered business intelligence and analytics

**Features**:
- Platform analytics
- User behavior insights
- Revenue forecasting
- Performance metrics

**Files**:
- `server/laura-oracle-service.ts` - Oracle service
- `server/api/laura-oracle.ts` - Oracle API endpoints

---

## 📊 **6. CRM INTEGRATION**

### **6.1 GoHighLevel (GHL)**
**Purpose**: Customer relationship management and automation

**Status**: ✅ Integrated

**Features**:
- Contact synchronization
- Pipeline management
- Opportunity tracking
- Affiliate tracking
- Automated workflows

**Configuration**:
- **Client ID**: `GHL_CLIENT_ID`
- **Client Secret**: `GHL_CLIENT_SECRET`
- **API Key**: `GHL_API_KEY` (alternative)
- **Pipeline ID**: `GHL_AFFILIATE_PIPELINE_ID`
- **Stage IDs**: `GHL_AFFILIATE_STAGE_ID`, `GHL_CONVERSION_STAGE_ID`

**Integration Points**:
- User registration sync
- Affiliate creation
- Conversion tracking
- Email campaign tracking

**Files**:
- `server/ghl-integration.ts` - GHL service
- `server/ghl-oauth.ts` - OAuth authentication
- `server/ghl-ai-bridge.ts` - AI bridge service
- `server/api/ghl-ai-bridge.ts` - AI bridge API

**Documentation**:
- `GHL_INTEGRATION_GUIDE.md`
- `GHL_OAUTH_SETUP_GUIDE.md`
- `GHL_LANGCHAIN_AI_INTEGRATION_GUIDE.md`

---

## 🔗 **7. AFFILIATE SYSTEM**

### **7.1 Affiliate Management**
**Purpose**: Multi-tier affiliate program with automated tracking

**Features**:
- Affiliate code generation
- Referral tracking
- Commission calculation
- Multi-tier commissions
- Sub-affiliate management
- Automated payouts

**Payout Methods**:
1. **Stripe Connect** - Automated transfers
2. **PayPal** - Automated payouts
3. **Bank Transfer** - Via Revolut API (planned)

**Files**:
- `server/affiliate-service.ts` - Core affiliate logic
- `server/affiliate-integrations.ts` - Payment integrations
- `AFFILIATE_INTEGRATIONS_GUIDE.md` - Integration docs

**Dashboard Features**:
- Real-time analytics
- Commission tracking
- Referral links
- Leaderboard
- Payout history

---

## 🔐 **8. AUTHENTICATION & SECURITY**

### **8.1 Authentication System**
**Purpose**: User authentication and authorization

**Methods**:
- Email/password authentication
- Session-based auth
- JWT tokens (optional)
- Role-based access control (RBAC)

**Roles**:
- **Super Admin**: Full system access
- **Admin**: Content management
- **Partner Admin**: Affiliate management
- **User**: Standard access

**Files**:
- `server/utils/auth.ts` - Authentication utilities
- `server/routes.ts` - Auth endpoints
- `worker-api/index.ts` - Worker auth handling

---

### **8.2 Access Control**
**Purpose**: Fine-grained permission management

**Features**:
- Role-based permissions
- Resource-level access control
- Special user management
- Partner admin sub-affiliate access

**Files**:
- `server/access-control-service.ts` - Access control logic
- `server/user-management.ts` - User management

---

## 📦 **9. STORAGE SYSTEMS**

### **9.1 Google Cloud Storage**
**Purpose**: File storage for user uploads and content

**Features**:
- Image uploads
- Document storage
- Content delivery

**Configuration**:
- **Bucket**: Configured via `@google-cloud/storage`
- **Credentials**: Google Cloud service account

**Files**:
- `server/objectStorage.ts` - GCS integration

---

### **9.2 Uppy File Upload**
**Purpose**: Client-side file upload interface

**Features**:
- Drag-and-drop uploads
- Progress tracking
- Multiple file support
- AWS S3 integration (via Uppy)

**Files**:
- Client components using `@uppy/react`

---

## 📱 **10. MOBILE APP**

### **10.1 Capacitor**
**Purpose**: Native mobile app wrapper

**Status**: ✅ Configured

**Platforms**:
- iOS (via `@capacitor/ios`)
- Android (via `@capacitor/android`)

**Configuration**:
- `capacitor.config.ts` - Capacitor configuration
- iOS project in `ios/` directory
- Android project in `android/` directory

**Build Commands**:
- `pnpm run cap:sync` - Sync web assets
- `pnpm run cap:ios` - Open iOS project
- `pnpm run cap:android` - Open Android project

**Files**:
- `capacitor.config.ts`
- `MOBILE_APP_SETUP.md` - Setup guide
- `APP_STORE_DEPLOYMENT_GUIDE.md` - Deployment guide

---

## 🔄 **11. VERSION CONTROL & CI/CD**

### **11.1 GitHub**
**Purpose**: Source code management and CI/CD

**Repository**: Professional Diver Training Platform

**Features**:
- Git version control
- Pull request workflow
- Issue tracking
- Release management

**CI/CD Pipeline**:
- **Workflow**: `.github/workflows/ci.yml`
- **Triggers**: Push to `main`, Pull requests
- **Tests**: TypeScript type checking, linting
- **Node Versions**: 20.9.0, 22.x

**Files**:
- `.github/workflows/ci.yml` - CI pipeline

---

### **11.2 Deployment**
**Purpose**: Automated deployment to Cloudflare

**Commands**:
- `pnpm run deploy:prod` - Deploy main worker
- `pnpm run deploy:api` - Deploy API worker
- `pnpm run deploy:all` - Deploy both workers

**Process**:
1. Build frontend: `vite build`
2. Build worker: `tsx scripts/build-worker.ts`
3. Deploy via Wrangler CLI

**Files**:
- `scripts/build-worker.ts` - Worker build script
- `DEPLOYMENT_CHECKLIST.md` - Deployment guide

---

## 🛠️ **12. DEVELOPMENT TOOLS**

### **12.1 Build System**
**Purpose**: Frontend and backend compilation

**Frontend**:
- **Framework**: Vite + React
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Build Output**: `dist/client/`

**Backend**:
- **Runtime**: Node.js 22.12.0+
- **Framework**: Express.js (legacy), Hono (workers)
- **Language**: TypeScript
- **Build**: TypeScript compilation

**Files**:
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind configuration

---

### **12.2 Package Management**
**Purpose**: Dependency management

**Manager**: pnpm (preferred)
- Faster installs
- Better disk space usage
- Workspace support

**Files**:
- `package.json` - Dependencies
- `pnpm-lock.yaml` - Lock file

---

### **12.3 Code Quality**
**Purpose**: Code standards and quality assurance

**Tools**:
- **ESLint**: Code linting
- **TypeScript**: Type checking
- **Super Debug Agent**: Real-time code monitoring

**Commands**:
- `pnpm run typecheck` - Type checking
- `pnpm run debug:fix` - Auto-fix linting issues
- `pnpm run debug:monitor` - Start debug agent

**Files**:
- `super-debug-agent/` - Debug agent directory
- `.eslintrc` - ESLint configuration

---

## 📈 **13. ANALYTICS & MONITORING**

### **13.1 Platform Analytics**
**Purpose**: Business intelligence and metrics

**Features**:
- User engagement metrics
- Revenue tracking
- Affiliate performance
- Learning path effectiveness

**Files**:
- `server/laura-oracle-service.ts` - Analytics service

---

### **13.2 Behavior Monitoring**
**Purpose**: User behavior tracking and insights

**Features**:
- Learning pattern analysis
- Engagement scoring
- Performance predictions

**Files**:
- `server/behavior-monitoring-service.ts` - Behavior tracking

---

## 🔧 **14. ENVIRONMENT CONFIGURATION**

### **14.1 Environment Variables**

**Required Variables**:
```bash
# Database
DATABASE_URL=postgresql://...  # Optional (uses D1 if not set)

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
REVOLUT_API_KEY=...
REVOLUT_MERCHANT_ID=...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Email
SENDGRID_API_KEY=...
EMAIL_SERVER=smtp://...
EMAIL_FROM=...

# CRM
GHL_CLIENT_ID=...
GHL_CLIENT_SECRET=...
GHL_API_KEY=...
GHL_AFFILIATE_PIPELINE_ID=...

# AI
OPENAI_API_KEY=...
LANGSMITH_API_KEY=...  # Optional

# Storage
GOOGLE_CLOUD_STORAGE_BUCKET=...
GOOGLE_CLOUD_CREDENTIALS=...

# Security
SESSION_SECRET=...
JWT_SECRET=...
```

**Files**:
- `server/bootstrap/env.ts` - Environment loading
- `server/bootstrap/validate-env.ts` - Validation

---

## 🗺️ **15. SYSTEM ARCHITECTURE DIAGRAMS**

### **15.1 High-Level Architecture**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER DEVICES                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ Web Browser  │  │   iOS App    │  │ Android App  │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
└─────────┼─────────────────┼─────────────────┼────────────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE NETWORK                         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Main Worker: professionaldiver-app-production               │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │ • Static Asset Serving (CDN)                            │ │ │
│  │  │ • SPA Routing                                            │ │ │
│  │  │ • Request Routing                                        │ │ │
│  │  │ • SEO Meta Tag Injection                                 │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────┬──────────────────────────────────────┘ │
│                          │ Service Binding                        │
│  ┌───────────────────────▼──────────────────────────────────────┐ │
│  │  API Worker: professionaldiver-api-production                │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │ • Authentication & Authorization                       │ │ │
│  │  │ • API Endpoints (REST)                                 │ │ │
│  │  │ • Database Operations                                   │ │ │
│  │  │ • Business Logic                                        │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────┬──────────────────────────────────────┘ │
└──────────────────────────┼────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  D1 Database │  │  KV Storage  │  │   Assets CDN │
│  (SQLite)    │  │  (CACHE/DATA)│  │   (Static)   │
│              │  │              │  │              │
│ • Users      │  │ • Sessions   │  │ • JS/CSS     │
│ • Content    │  │ • Cache      │  │ • Images     │
│ • Progress   │  │ • Temp Data  │  │ • Fonts      │
│ • Affiliates │  │              │  │              │
└──────┬───────┘  └──────────────┘  └──────────────┘
       │
       │ (Fallback)
       ▼
┌──────────────┐
│  PostgreSQL  │
│  (Neon DB)   │
└──────────────┘
```

### **15.2 External Services Integration**

```
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES LAYER                       │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    PAYMENT SERVICES                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │  │
│  │  │   Stripe     │  │   Revolut    │  │   PayPal     │      │  │
│  │  │ • Payments   │  │ • Payments   │  │ • Payouts    │      │  │
│  │  │ • Connect    │  │ • Business   │  │ • Affiliates │      │  │
│  │  │ • Webhooks   │  │ • API        │  │ • API        │      │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    AI & MACHINE LEARNING                      │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │              LangChain Framework                        │  │  │
│  │  │  ┌──────────────────────────────────────────────────┐ │  │  │
│  │  │  │ • AI Orchestration                                │ │  │  │
│  │  │  │ • Chain Management                                 │ │  │  │
│  │  │  │ • Context Management                               │ │  │  │
│  │  │  │ • Memory Systems                                   │ │  │  │
│  │  │  └──────────────────────────────────────────────────┘ │  │  │
│  │  │                    │                                    │  │  │
│  │  │                    ▼                                    │  │  │
│  │  │  ┌──────────────────────────────────────────────────┐ │  │  │
│  │  │  │         LangSmith (Observability)                 │ │  │  │
│  │  │  │  • Run Tracking & Tracing                         │ │  │  │
│  │  │  │  • Interaction Logging                            │ │  │  │
│  │  │  │  • Performance Analytics                          │ │  │  │
│  │  │  │  • Domain Learning                                │ │  │  │
│  │  │  │  • Debugging & Monitoring                        │ │  │  │
│  │  │  └──────────────────────────────────────────────────┘ │  │  │
│  │  └────────────────────────────────────────────────────┘ │  │  │
│  │                    │                                       │  │  │
│  │                    ▼                                       │  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │  │
│  │  │   OpenAI     │  │  Laura       │  │  Diver Well  │    │  │  │
│  │  │   GPT-4     │  │  Oracle      │  │  AI Tutor    │    │  │  │
│  │  │   Models    │  │  Service     │  │  Service     │    │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    CRM & MARKETING                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │  │
│  │  │ GoHighLevel  │  │  SendGrid    │  │  Email       │      │  │
│  │  │ • CRM        │  │ • Email      │  │  Campaigns   │      │  │
│  │  │ • Automation │  │ • Delivery   │  │ • Automation │      │  │
│  │  │ • Pipelines  │  │ • Templates  │  │ • Templates  │      │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    STORAGE & INFRASTRUCTURE                  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │  │
│  │  │ Google Cloud │  │   GitHub     │  │  Capacitor   │      │  │
│  │  │   Storage    │  │   CI/CD      │  │   Mobile     │      │  │
│  │  │ • Files      │  │ • Version    │  │ • iOS        │      │  │
│  │  │ • Images     │  │ • Control    │  │ • Android    │      │  │
│  │  │ • Documents   │  │ • Automation │  │ • Native     │      │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### **15.3 AI System Architecture (LangChain + LangSmith Relationship)**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AI SYSTEM ARCHITECTURE                           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    LangChain Framework                       │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  Core Components:                                       │ │ │
│  │  │  • ChatOpenAI (GPT-4 models)                           │ │ │
│  │  │  • OpenAIEmbeddings (vector embeddings)                │ │ │
│  │  │  • Chains (multi-step reasoning)                       │ │ │
│  │  │  • Memory (conversation context)                       │ │ │
│  │  │  • Tools (function calling)                            │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │                    │                                         │ │
│  │                    │ All operations traced                  │ │
│  │                    ▼                                         │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │              LangSmith Observability                   │ │ │
│  │  │  ┌──────────────────────────────────────────────────┐ │ │ │
│  │  │  │ • Run Tracking (every AI call logged)            │ │ │ │
│  │  │  │ • Interaction Logging (user conversations)        │ │ │ │
│  │  │  │ • Performance Metrics (latency, token usage)       │ │ │ │
│  │  │  │ • Domain Learning (continuous improvement)         │ │ │ │
│  │  │  │ • Debugging Tools (trace analysis)                │ │ │ │
│  │  │  │ • Analytics Dashboard (usage patterns)            │ │ │ │
│  │  │  └──────────────────────────────────────────────────┘ │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              AI Services Using LangChain + LangSmith        │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │ │
│  │  │ Laura Oracle │  │ Diver Well  │  │ AI Learning  │      │ │
│  │  │ Service      │  │ AI Tutor    │  │ Path Service │      │ │
│  │  │              │  │             │  │              │      │ │
│  │  │ • Platform   │  │ • Tutoring  │  │ • Path Gen   │      │ │
│  │  │   Admin      │  │ • Q&A       │  │ • Personalize │      │ │
│  │  │ • Analytics  │  │ • Guidance  │  │ • Recommend  │      │ │
│  │  │ • Monitoring │  │ • Support   │  │ • Optimize   │      │ │
│  │  │              │  │             │  │              │      │ │
│  │  │ All logged   │  │ All logged  │  │ All logged   │      │ │
│  │  │ to LangSmith │  │ to LangSmith│  │ to LangSmith │      │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

Key Relationship:
LangChain ──(uses)──> LangSmith (for observability & monitoring)
     │                      │
     │                      │
     └──────────────────────┘
     All LangChain operations
     are automatically traced
     and logged to LangSmith
```

### **15.4 Data Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER REQUEST FLOW                           │
└─────────────────────────────────────────────────────────────────────┘

User Request
     │
     ▼
┌─────────────────┐
│  Main Worker    │  ← Serves static assets, handles routing
└────────┬────────┘
         │
         │ API Request
         ▼
┌─────────────────┐
│   API Worker    │  ← Processes business logic
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┬─────────────────┐
         │                 │                 │                 │
         ▼                 ▼                 ▼                 ▼
    ┌────────┐       ┌────────┐       ┌────────┐       ┌────────┐
    │   D1   │       │   KV   │       │ OpenAI │       │   GHL  │
    │  DB    │       │ Storage│       │   AI   │       │   CRM  │
    └───┬────┘       └───┬────┘       └───┬────┘       └───┬────┘
        │                 │                 │                 │
        │                 │                 │                 │
        └─────────────────┴─────────────────┴─────────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │ LangSmith   │  ← Tracks all AI interactions
                    │ Monitoring  │     Logs runs & performance
                    └─────────────┘
```

---

## 📝 **16. KEY FILES REFERENCE**

### **Configuration Files**:
- `wrangler.toml` - Main Cloudflare Worker config
- `wrangler-api.toml` - API Worker config
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Frontend build config
- `tsconfig.json` - TypeScript config
- `drizzle.config.ts` - Database ORM config
- `capacitor.config.ts` - Mobile app config

### **Core Application Files**:
- `worker/index.ts` - Main worker entry point
- `worker-api/index.ts` - API worker entry point
- `server/index.ts` - Express server (legacy/fallback)
- `server/routes.ts` - API route definitions
- `client/` - Frontend React application

### **Service Files**:
- `server/affiliate-service.ts` - Affiliate system
- `server/email-marketing.ts` - Email campaigns
- `server/ghl-integration.ts` - CRM integration
- `server/ai-tutor.ts` - AI tutoring
- `server/db.ts` - Database connection

---

## 🚀 **17. DEPLOYMENT WORKFLOW**

1. **Development**:
   - Local SQLite database
   - Express server on port 5000
   - Vite dev server on port 3000

2. **Build**:
   - `pnpm run build` - Build frontend
   - `pnpm run build:worker` - Build worker

3. **Deploy**:
   - `pnpm run deploy:api` - Deploy API worker
   - `pnpm run deploy:prod` - Deploy main worker

4. **Verification**:
   - Check Cloudflare dashboard
   - Test endpoints
   - Verify database connections

---

## ⚠️ **18. KNOWN ISSUES & TODO**

### **Critical**:
- [ ] D1 Database ID needs to be configured in `wrangler.toml`
- [ ] Stripe account recovery needed for affiliate payouts
- [ ] Complete D1 migration from PostgreSQL

### **Enhancements**:
- [ ] Implement Revolut bank transfer API for affiliate payouts
- [ ] Set up automated D1 backups
- [ ] Configure monitoring and alerting
- [ ] Complete mobile app store submissions

---

## 📚 **19. DOCUMENTATION REFERENCES**

- `D1_MIGRATION_GUIDE.md` - Database migration guide
- `PAYMENT_MIGRATION_GUIDE.md` - Payment system migration
- `DEPLOYMENT_CHECKLIST.md` - Deployment procedures
- `GHL_INTEGRATION_GUIDE.md` - CRM integration guide
- `MOBILE_APP_SETUP.md` - Mobile app setup
- `PUBLIC_LAUNCH_READINESS_REPORT.md` - Launch status

---

## 🎯 **20. SYSTEM HEALTH CHECKLIST**

### **Infrastructure**:
- [x] Cloudflare Workers deployed
- [x] D1 Database configured (needs ID)
- [x] KV Namespaces created
- [x] Assets CDN configured
- [x] DNS configured

### **Integrations**:
- [x] Stripe configured (needs account recovery)
- [x] Revolut configured
- [x] PayPal configured
- [x] GHL integrated
- [x] SendGrid configured
- [x] OpenAI integrated

### **Features**:
- [x] Authentication working
- [x] Affiliate system operational
- [x] Email campaigns active
- [x] AI tutoring functional
- [x] Mobile app configured

---

**Last Updated**: 2024
**Maintained By**: Development Team
**Version**: 1.0

