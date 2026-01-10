# Exam Questions Location & Database Import Guide

## 📍 Current Location of Exam Questions

### Local File Location
**File:** `content/exam-questions.js`

**Total Questions:** 465 questions across 7 exam types

**Question Breakdown:**
- **NDT Inspection**: 75 questions
- **Diver Medic Technician (DMT)**: 65 questions
- **Commercial Supervisor**: 80 questions
- **Assistant Life Support Technician (ALST)**: 70 questions
- **Life Support Technician (LST)**: 60 questions
- **Hyperbaric Operations**: 55 questions
- **Underwater Welding**: 60 questions

### Question Format
Each question includes:
- `id`: Unique identifier
- `type`: MULTIPLE_CHOICE, TRUE_FALSE, or WRITTEN
- `prompt`: Question text
- `options`: Array of answer options (for multiple choice/true-false)
- `correctAnswer`: Correct answer
- `explanation`: Detailed explanation (optional)
- `points`: Point value
- `order`: Question order

## 🗄️ Database Storage Options

### Option 1: Supabase (PostgreSQL) - Production
**Connection:** Via `DATABASE_URL` environment variable

**Schema:**
- `tracks` table: Contains exam tracks
- `lessons` table: Contains exam lessons
- `quizzes` table: Contains exam quizzes
- `questions` table: Contains all exam questions

**Location:** Supabase cloud database (PostgreSQL)

### Option 2: Cloudflare D1 (SQLite) - Development/Backup
**Connection:** Local SQLite file (default: `./.data/dev.sqlite`)

**Schema:** Same structure as PostgreSQL but using SQLite types

**Location:** Local file system or Cloudflare D1 database

## 📥 Importing Questions to Database

### Prerequisites
1. Database connection configured (either Supabase or Cloudflare D1)
2. Database migrations run (tables created)
3. Node.js and npm installed

### Import Script
**File:** `scripts/import-exam-questions.ts`

**What it does:**
1. Creates a "Professional Exams" track (if it doesn't exist)
2. Creates a lesson for each exam type
3. Creates a quiz for each exam
4. Imports all 465 questions into the database

### Running the Import

#### Method 1: Using npm script (if added to package.json)
```bash
npm run import-exam-questions
```

#### Method 2: Direct execution with tsx
```bash
npx tsx scripts/import-exam-questions.ts
```

#### Method 3: Using Node.js with ES modules
```bash
node --loader tsx scripts/import-exam-questions.ts
```

### Environment Setup

#### For Supabase (PostgreSQL)
```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
export NODE_ENV="production"
```

#### For Cloudflare D1 (SQLite)
```bash
# No DATABASE_URL needed, or set to empty
export NODE_ENV="development"
# Optional: Specify SQLite file location
export SQLITE_FILE="./.data/dev.sqlite"
```

## 🔍 Verifying Import

### Check Questions in Database

#### Supabase (PostgreSQL)
```sql
-- Count total questions
SELECT COUNT(*) FROM questions;

-- Count questions by exam type
SELECT 
  qz.title as quiz_title,
  COUNT(q.id) as question_count
FROM quizzes qz
LEFT JOIN questions q ON q.quiz_id = qz.id
WHERE qz.title LIKE '%Professional Exam%'
GROUP BY qz.title
ORDER BY question_count DESC;
```

#### Cloudflare D1 (SQLite)
```sql
-- Count total questions
SELECT COUNT(*) FROM questions;

-- Count questions by exam type
SELECT 
  qz.title as quiz_title,
  COUNT(q.id) as question_count
FROM quizzes qz
LEFT JOIN questions q ON q.quiz_id = qz.id
WHERE qz.title LIKE '%Professional Exam%'
GROUP BY qz.title
ORDER BY question_count DESC;
```

## 📊 Current Status

### Questions in Local File
✅ **465 questions** available in `content/exam-questions.js`

### Questions in Database
⚠️ **Status unknown** - Run import script to populate database

### Usage in Application
The exam interface (`client/src/pages/exam-interface.tsx`) currently loads questions from:
- **Primary source:** `content/exam-questions.js` (local file)
- **Database source:** Not currently used (can be added)

## 🔄 Migration Path

### Current State
- Questions are loaded from local JavaScript file
- No database dependency for question loading
- Fast startup, but questions are bundled with code

### Future State (After Import)
- Questions stored in database (Supabase or Cloudflare D1)
- Questions can be updated without code deployment
- Questions can be managed via admin interface
- Questions can be versioned and tracked
- Questions can be filtered/searchable

## 🛠️ Troubleshooting

### Import Fails
1. **Check database connection:**
   ```bash
   # Test Supabase connection
   echo $DATABASE_URL
   
   # Test SQLite file exists
   ls -la ./.data/dev.sqlite
   ```

2. **Check migrations:**
   ```bash
   # Ensure tables exist
   npm run db:migrate
   ```

3. **Check file access:**
   ```bash
   # Verify exam questions file exists
   ls -la content/exam-questions.js
   ```

### Questions Not Appearing
1. **Check import logs** for errors
2. **Verify database connection** is correct
3. **Check table structure** matches schema
4. **Verify question format** matches expected structure

## 📝 Notes

- The import script is **idempotent** - it can be run multiple times safely
- Existing questions for a quiz will be **deleted and re-imported** if the quiz exists
- The script creates a **"Professional Exams" track** if it doesn't exist
- Each exam type gets its own **lesson and quiz** in the database
- Questions maintain their **original order and structure** from the source file

## 🚀 Next Steps

1. **Run the import script** to populate your database
2. **Verify questions** are imported correctly
3. **Update application** to load questions from database (optional)
4. **Set up admin interface** to manage questions (optional)
5. **Add more questions** to reach 500-600 total (currently 465)





