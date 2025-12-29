# Professional Diver Training Platform

[![CI](https://github.com/lalabalavujon-a11y/Professional-Diver.app/workflows/CI/badge.svg)](https://github.com/lalabalavujon-a11y/Professional-Diver.app/actions)

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

- **NDT (Non-Destructive Testing)**: Dr. Sarah Chen
- **LST (Life Support Technician)**: Mike Rodriguez  
- **ALST (Advanced Life Support Technician)**: Captain Elena Vasquez
- **DMT (Dive Medical Technician)**: Dr. James Mitchell
- **Commercial Dive Supervisor**: Commander David Thompson

All AI tutors maintain complete brand neutrality and focus on industry standards (IMCA, ADCI, OSHA, ASTM).

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
```

## Scripts

- `npm run dev:all` - Start both API and frontend servers
- `npm run dev:api` - Start API server only
- `npm run dev:web` - Start frontend server only
- `npm run dev:reset` - Kill existing servers and restart
- `npm run typecheck` - Run TypeScript type checking
- `npm run build` - Build for production

## CI/CD

The project includes comprehensive CI checks:

- Port availability validation (3000, 5000)
- Vite proxy configuration validation
- TypeScript type checking
- API and proxy smoke tests
- Environment file security checks

## License

MIT
