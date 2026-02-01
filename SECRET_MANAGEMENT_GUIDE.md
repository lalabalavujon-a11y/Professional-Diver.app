# Secret Management Guide - Where Secrets Should Live

## 🎯 Core Principle

**Store secrets in the platform that runs the code, not in git.**

- **Railway** = Server-only secrets (Express API)
- **Cloudflare Pages** = Public client vars only (Vite frontend)
- **Supabase** = Database + auth configuration
- **1Password/Bitwarden** = Human source of truth

---

## 📋 Secret Mapping

### ✅ Cloudflare Pages (Client-Side - PUBLIC)

**Location:** Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables

**These are bundled into the browser - treat as PUBLIC:**

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_URL` | API base URL | `https://api.professionaldiver.app` |
| `VITE_WS_URL` | WebSocket URL | `wss://api.professionaldiver.app` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (public, RLS protects data) | `eyJhbGc...` |

**Why these are safe:**
- Supabase anon key is **designed** for client use
- Row Level Security (RLS) policies protect data
- API URLs are public endpoints anyway

---

### 🔒 Railway (Server-Side - PRIVATE)

**Location:** Railway Dashboard → Service → Variables

**These are server-only and NEVER exposed to client:**

#### Database & Supabase
| Variable | Purpose | Where to Get |
|----------|---------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | Supabase Dashboard → Settings → Database |
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin key | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | (Optional - can match client) | Supabase Dashboard → Settings → API |

#### AI Services
| Variable | Purpose | Where to Get |
|----------|---------|--------------|
| `OPENAI_API_KEY` | OpenAI API access | https://platform.openai.com/api-keys |
| `AI_TUTOR_MODEL` | AI model name | Default: `gpt-4o` |
| `AI_TUTOR_TEMPERATURE` | AI temperature | Default: `0.7` |
| `AI_TUTOR_MAX_TOKENS` | Max tokens | Default: `2000` |
| `CONTENT_GENERATION_MODEL` | Content gen model | Default: `gpt-4o` |
| `CONTENT_GENERATION_TEMPERATURE` | Content gen temp | Default: `0.7` |
| `LANGSMITH_API_KEY` | LangSmith observability | https://smith.langchain.com/settings |
| `LANGSMITH_PROJECT` | LangSmith project name | Default: `professional-diver-training-app` |

#### Payment Processing
| Variable | Purpose | Where to Get |
|----------|---------|--------------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Stripe Dashboard → Developers → Webhooks |

#### Email Services
| Variable | Purpose | Where to Get |
|----------|---------|--------------|
| `SENDGRID_API_KEY` | SendGrid API key | SendGrid Dashboard → Settings → API Keys |

#### External APIs
| Variable | Purpose | Where to Get |
|----------|---------|--------------|
| `OPENWEATHER_API_KEY` | OpenWeather API key | https://openweathermap.org/api |
| `STORMGLASS_API_KEY` | Stormglass API key | https://stormglass.io/ |

#### Other
| Variable | Purpose | Where to Get |
|----------|---------|--------------|
| `WHATSAPP_APP_SECRET` | WhatsApp app secret | WhatsApp Business API |
| `NODE_ENV` | Environment | Set to `production` |

---

## 🚨 Security Rules

### ❌ NEVER Put in Git
- Any secret keys
- Database passwords
- Service role keys
- API keys
- Webhook secrets

### ✅ Safe to Put in Git
- `.env.example` (with placeholders)
- Public URLs (without credentials)
- Configuration templates
- Documentation

### 🔐 Rotation Priority

**If exposed, rotate immediately:**
1. Database passwords (highest priority)
2. Service role keys
3. Stripe secret keys
4. OAuth client secrets
5. API keys (OpenAI, SendGrid, etc.)

---

## 📝 Setup Instructions

### For Local Development

1. **Copy template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in values:**
   - Get keys from respective services
   - Use test/development keys where possible
   - Never commit `.env.local`

### For Railway (Staging + Prod)

1. **Go to Railway Dashboard**
2. **Select Service** (staging or prod)
3. **Variables tab**
4. **Add each variable:**
   - Copy from `.env.example` as reference
   - Use **production keys** for prod service
   - Use **test keys** for staging service

### For Cloudflare Pages

1. **Go to Cloudflare Dashboard**
2. **Pages → Your Project → Settings**
3. **Environment Variables**
4. **Add `VITE_*` variables only**
5. **Set for Production** (and Preview if different)

---

## 🔄 Current Status

### ⚠️ Action Required

**Database password was exposed in commit `152454e`:**

1. **Rotate Supabase database password:**
   - Supabase Dashboard → Settings → Database
   - Reset password
   - Update Railway environment variables

2. **Update all services:**
   - Railway staging service
   - Railway prod service
   - Local `.env.local`

3. **Remove from git history** (after rotation):
   ```bash
   brew install git-filter-repo
   git filter-repo --path .env.local --invert-paths
   git push --force --all
   ```

---

## ✅ Best Practices

1. **Use 1Password/Bitwarden** as human source of truth
2. **Copy secrets into Railway/Cloudflare** as needed
3. **Never commit `.env.local`** (it's in `.gitignore`)
4. **Use `.env.example`** for onboarding
5. **Rotate secrets** if exposed
6. **Separate staging/prod keys** where possible
7. **Use test keys** for staging environment

---

## 📊 Secret Inventory Checklist

Use this to track where each secret lives:

- [ ] `DATABASE_URL` → Railway (staging + prod)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` → Railway (staging + prod)
- [ ] `OPENAI_API_KEY` → Railway (staging + prod)
- [ ] `LANGSMITH_API_KEY` → Railway (staging + prod)
- [ ] `STRIPE_SECRET_KEY` → Railway (staging: test, prod: live)
- [ ] `STRIPE_WEBHOOK_SECRET` → Railway (staging + prod)
- [ ] `SENDGRID_API_KEY` → Railway (staging + prod)
- [ ] `VITE_SUPABASE_URL` → Cloudflare Pages
- [ ] `VITE_SUPABASE_ANON_KEY` → Cloudflare Pages
- [ ] `VITE_API_URL` → Cloudflare Pages

---

**Last Updated:** After fireproofing implementation  
**Status:** Template created | Database password rotation required
