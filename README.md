# Professional Diver Training Platform

[![CI](https://github.com/JonLalabalavu/professional-diver-training/workflows/CI/badge.svg)](https://github.com/JonLalabalavu/professional-diver-training/actions)

A comprehensive, brand-neutral training and revision platform for commercial divers, featuring AI-powered tutoring, interactive lessons, and progress tracking.

## Features

- **AI-Powered Learning**: Specialized AI tutors for each diving discipline
- **Interactive Lessons**: Rich markdown content with practice scenarios
- **Progress Tracking**: Real-time progress monitoring and assessment
- **Quiz System**: Comprehensive testing with multiple question types
- **User Authentication**: Secure login and role-based access
- **Responsive Design**: Modern, mobile-friendly interface
- **Written Exams**: Timed assessments with detailed feedback
- **Brand-Neutral Content**: Professional, industry-standard training materials

## Tech Stack

- **Frontend**: Vite, React 19, TypeScript
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **AI Integration**: LangChain, LangSmith, OpenAI
- **Styling**: Tailwind CSS
- **Mobile**: Capacitor (iOS & Android native apps)
- **Deployment**: Vercel-ready

## Quick Start

```bash
# Install dependencies
npm install

# Start development servers
npm run dev:all

# Or start individually
npm run dev:api  # API server on port 5000
npm run dev:web  # Frontend on port 3000
```

## Development

- **Frontend**: http://127.0.0.1:3000
- **API**: http://127.0.0.1:5000
- **AI Tutor Endpoints**: http://127.0.0.1:5000/api/ai-tutor/*

## AI Tutor System

The platform includes specialized AI tutors for each diving discipline:

- **NDT (Non-Destructive Testing)**: Diver Well
- **LST (Life Support Technician)**: Diver Well  
- **ALST (Advanced Life Support Technician)**: Diver Well
- **DMT (Dive Medical Technician)**: Diver Well
- **Commercial Dive Supervisor**: Diver Well

All AI tutors maintain complete brand neutrality and focus on industry standards (IMCA, ADCI, OSHA, ASTM).

## Affiliate Program & Stripe Connect

The platform includes a comprehensive affiliate program with multiple payout options:

- **50% Commission**: Earn 50% on all referrals (Monthly: $12.50, Annual: $125.00)
- **Stripe Connect**: Direct bank account/debit card payouts (automatic, fastest)
- **PayPal**: Traditional PayPal payouts
- **Bank Transfer**: Manual bank transfer processing

### Stripe Connect Setup

1. **Get Stripe API Keys**:
   - Sign up at https://stripe.com
   - Get your API keys from https://dashboard.stripe.com/apikeys
   - Enable Stripe Connect in your dashboard

2. **Configure Webhooks**:
   - Set up webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Subscribe to events: `account.updated`, `transfer.created`, `transfer.paid`, `transfer.failed`
   - Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

3. **Affiliate Onboarding**:
   - Affiliates can set up Stripe Connect from their dashboard
   - Onboarding flow redirects to Stripe's hosted page
   - Account status updates automatically via webhooks

### Payout Schedule

- **Frequency**: Monthly (1st of each month)
- **Minimum Threshold**: $50
- **Processing**: Automatic for Stripe Connect, manual for PayPal/Bank Transfer

## Environment Setup

Create a `.env.local` file with:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# LangSmith Configuration
LANGSMITH_API_KEY=your_langsmith_api_key
LANGSMITH_PROJECT=professional-diver-training-app

# Database Configuration
NODE_ENV=development

# Weather API Configuration (optional - for weather widget)
OPENWEATHER_API_KEY=your_openweather_api_key_here
# Get your free API key at: https://openweathermap.org/api

# Tides API Configuration (optional - for tides widget)
STORMGLASS_API_KEY=your_stormglass_api_key_here
# Get your free API key at: https://stormglass.io/
# Alternative: NOAA_TIDES_API_KEY for NOAA Tides API

# Stripe Configuration (required for affiliate payouts)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
# Get your Stripe keys from: https://dashboard.stripe.com/apikeys
# Webhook secret from: https://dashboard.stripe.com/webhooks

# Calendly Webhook Configuration (optional - for CRM integration)
CALENDLY_WEBHOOK_SIGNING_KEY=your_calendly_webhook_signing_key
# Get your webhook signing key from: https://calendly.com/integrations/webhooks
# Set up webhook endpoint: https://your-domain.com/api/webhooks/calendly
# Subscribe to events: invitee.created, invitee.canceled
```

## Scripts

- `npm run dev:all` - Start both API and frontend servers
- `npm run dev:api` - Start API server only
- `npm run dev:web` - Start frontend server only
- `npm run dev:reset` - Kill existing servers and restart
- `npm run typecheck` - Run TypeScript type checking
- `npm run build` - Build for production
- `npm run mobile:build` - Build web app and sync to native mobile projects
- `npm run mobile:ios` - Build, sync, and open iOS project in Xcode
- `npm run mobile:android` - Build, sync, and open Android project in Android Studio
- `npm run cap:sync` - Sync web build to native projects

## Mobile Apps

This platform supports native iOS and Android apps built with **Capacitor**. The web app is fully mobile-responsive, and Capacitor wraps it as native apps for distribution via App Store and Google Play Store.

**Android**: ✅ Fully configured and ready for development
**iOS**: ✅ Fully configured and ready for development

For detailed mobile setup instructions, see [MOBILE_SETUP.md](./MOBILE_SETUP.md).

## CI/CD

The project includes comprehensive CI checks:

- Port availability validation (3000, 5000)
- Vite proxy configuration validation
- TypeScript type checking
- API and proxy smoke tests
- Environment file security checks

## License

MIT
