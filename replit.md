# Overview

This is a professional diving exam preparation platform built with React, Express, and Drizzle ORM. The application provides comprehensive practice tests and study materials to help divers prepare for certification exams at certified diving schools. The platform features professional-grade mock exams, AI-powered explanations, voice dictation technology, and performance analytics to help users ace their commercial diving certification exams.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Modern React application using functional components and hooks
- **Wouter**: Lightweight client-side routing library for navigation
- **TanStack Query**: Data fetching and caching with optimistic updates
- **Shadcn/ui Components**: Comprehensive UI component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens and CSS variables
- **Vite**: Fast build tool and development server with HMR support

## Backend Architecture
- **Express.js**: RESTful API server with middleware for request logging and error handling
- **TypeScript**: Full type safety across the entire stack
- **Drizzle ORM**: Type-safe SQL query builder and schema management
- **PostgreSQL**: Primary database for persistent data storage

## Database Design
The database schema supports a comprehensive learning management system:
- **Users**: Authentication and role-based access (USER/ADMIN)
- **Tracks**: Learning courses with lessons in sequential order
- **Lessons**: Individual learning units with rich content
- **Quizzes**: Assessments with multiple-choice questions
- **Progress Tracking**: User completion status and quiz attempts
- **Invites**: Token-based user invitation system
- **AI Tutors**: Specialized AI tutors for each diving track (DMT, ALST, LST, NDT, Commercial Dive Supervisor, SSED, SAT)
- **Learning Paths**: AI-powered personalized learning recommendations based on user profiles and goals

## Authentication Strategy
- **NextAuth.js Ready**: Infrastructure prepared for session-based authentication
- **Magic Link Support**: Email-based passwordless authentication
- **Role-Based Access**: Admin and user roles with appropriate permissions
- **Session Management**: Secure session handling with database storage

## Development Environment
- **Replit Optimized**: Configured for seamless deployment on Replit platform
- **Environment Variables**: Secure configuration management through Replit Secrets
- **Hot Reload**: Fast development cycle with Vite's HMR
- **TypeScript Configuration**: Shared types between client and server

## API Design
RESTful endpoints following conventional patterns:
- `/api/auth/*` - Authentication and session management
- `/api/tracks/*` - Learning track operations
- `/api/lessons/*` - Lesson content and management
- `/api/quizzes/*` - Quiz functionality and submissions
- `/api/admin/*` - Administrative operations

## Content Management
- **Rich Text Content**: Markdown-supported lesson content
- **Sequential Learning**: Ordered lessons within tracks
- **Progress Tracking**: Automatic completion status updates
- **Quiz Integration**: Embedded assessments with instant feedback

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Alternative**: Supabase PostgreSQL as backup database option

## UI Libraries
- **Radix UI**: Accessible component primitives for complex UI patterns
- **Lucide React**: Comprehensive icon library for consistent iconography
- **Tailwind CSS**: Utility-first styling with custom color schemes

## Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **Vite Plugins**: Replit integration and runtime error handling
- **TypeScript**: Static type checking across the entire codebase

## Authentication (Planned)
- **NextAuth.js**: Complete authentication solution with multiple providers
- **Email Services**: Magic link delivery for passwordless authentication

## Styling System
- **Google Fonts**: Inter, DM Sans, and other professional typefaces
- **CSS Variables**: Dynamic theming support with consistent design tokens
- **Responsive Design**: Mobile-first approach with breakpoint-based layouts