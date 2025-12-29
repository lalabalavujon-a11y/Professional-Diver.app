# DIVER-WELL-TRAINING
# Diver Well - Professional Training Platform

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

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Deployment**: Vercel-ready

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd apps/web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/diver_well"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed database with initial data

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   └── tracks/            # Track detail pages
├── components/            # React components
│   ├── LessonViewer.tsx   # Lesson display component
│   └── QuizSystem.tsx     # Quiz and exam system
├── lib/                   # Utility libraries
└── content/               # Lesson content files
│   ├── ndt-lessons.ts     # NDT training content
│   ├── alst-lessons.ts    # ALST training content
│   └── lst-lessons.ts     # LST training content
prisma/
├── schema.prisma         # Database schema
└── seed.ts              # Database seeder
```

## Database Schema

The platform uses the following main entities:

- **Users**: Authentication and role management
- **Tracks**: Learning paths and courses
- **Lessons**: Individual learning modules
- **Questions**: Quiz and assessment items
- **Progress**: User progress tracking
- **Exam Results**: Assessment results and scores

## API Endpoints

- `GET /api/tracks` - Fetch all learning tracks
- `GET /api/tracks/[id]` - Fetch specific track with lessons
- `POST /api/auth/signup` - User registration
- `GET /api/progress` - Fetch user progress
- `POST /api/progress` - Update user progress

## Training Tracks

The platform includes comprehensive training tracks for:

### 1. Inspection & NDT
**AI Tutor for Non-Destructive Testing and Inspection**
- Visual inspection fundamentals
- Corrosion assessment techniques
- CP surveying procedures
- Thickness gauging methods
- Magnetic particle inspection
- Photo/video documentation
- Marine growth identification

### 2. Diver Medic Technician
**AI Tutor for Diver Medic Technician**
- Scene assessment and safety
- ABCDE emergency protocols
- Airway management techniques
- Breathing support procedures
- Circulation assessment
- Disability evaluation
- Exposure management

### 3. Commercial Dive Supervisor
**AI Tutor for Commercial Dive Supervisor**
- Dive planning fundamentals
- Risk assessment methodologies
- Hazard identification
- Communication protocols
- Emergency response procedures
- Quality assurance systems

### 4. Air Diver
**AI Tutor for Air Diving**
- Diving physics review
- Gas management concepts
- Ascent best practices
- Problem-solving drills
- Tool handling safety
- Basic communications

### 5. Saturation Diver
**AI Tutor for Saturation Diving**
- Saturation diving overview
- System components and operation
- Human factors in confined environments
- High-level risk themes
- Life support systems

### 6. Assistant Life Support Technician (ALST)
**AI Tutor for Assistant Life Support Technician**
- Life support system operation
- Gas management principles
- Environmental control systems
- Emergency procedures
- Equipment maintenance
- Safety protocols

### 7. Life Support Technician (LST)
**AI Tutor for Life Support Technician**
- Advanced life support systems
- System design principles
- Troubleshooting methodologies
- Emergency management
- Team leadership
- Quality assurance

## AI Tutor Features

Each track features specialized AI tutors that provide:

### Personalized Learning
- **Adaptive Content**: Content adjusts based on user progress
- **Learning Paths**: Structured progression through topics
- **Practice Scenarios**: Real-world simulation exercises
- **Interactive Guidance**: Step-by-step problem-solving assistance

### Assessment and Testing
- **Multiple Choice Questions**: Standard assessment format
- **True/False Questions**: Quick knowledge checks
- **Short Answer Questions**: Detailed response assessment
- **Timed Exams**: Professional examination environment
- **Detailed Feedback**: Explanations for all answers
- **Progress Tracking**: Real-time performance monitoring

### Practice Scenarios
Each lesson includes realistic scenarios such as:
- **Pipeline Inspection**: Corrosion assessment procedures
- **Emergency Response**: Medical emergency protocols
- **System Failures**: Troubleshooting procedures
- **Equipment Malfunctions**: Maintenance and repair

## Quiz and Exam System

### Features
- **Timed Assessments**: 30-minute exam windows
- **Multiple Question Types**: MC, True/False, Short Answer
- **Real-time Progress**: Live progress tracking
- **Detailed Results**: Comprehensive feedback and explanations
- **Score Tracking**: Performance history and analytics
- **Certificate Generation**: Professional certification tracking

### Question Types
1. **Multiple Choice**: Standard 4-option questions
2. **True/False**: Quick knowledge verification
3. **Short Answer**: Detailed response assessment

### Assessment Process
1. **Pre-Assessment**: Review lesson content
2. **Quiz Launch**: Start timed assessment
3. **Question Navigation**: Move between questions
4. **Auto-Submit**: Automatic submission when time expires
5. **Results Review**: Detailed feedback and explanations
6. **Progress Update**: Automatic progress tracking

## Content Standards

### Brand-Neutral Approach
- **Industry Standards**: Based on recognized diving standards
- **Professional Language**: Clear, technical terminology
- **Safety Focus**: Emphasis on safety procedures
- **Best Practices**: Current industry best practices

### Quality Assurance
- **Expert Review**: Content reviewed by industry professionals
- **Regular Updates**: Continuous content improvement
- **Accuracy Verification**: Technical accuracy validation
- **Compliance Check**: Regulatory compliance verification

## User Experience

### Learning Interface
- **Clean Design**: Modern, professional interface
- **Responsive Layout**: Works on all device sizes
- **Progress Indicators**: Clear progress visualization
- **Navigation**: Intuitive lesson navigation

### Assessment Interface
- **Professional Exams**: Timed, secure assessment environment
- **Question Review**: Ability to review and change answers
- **Time Management**: Clear time remaining indicators
- **Results Display**: Comprehensive results with explanations

## Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application: `npm run build`
2. Start the production server: `npm run start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For technical support or questions about the platform, please contact the development team.

---

**Note**: This platform is for training use only. For operational work, follow your employer's procedures, current project specifications, and medical direction.
#   D i v e r - W e l l 
 
 
