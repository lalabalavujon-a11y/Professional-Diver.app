# Exam Question Expansion - Current Situation & Solution

## Current Issue
- **Advertised Question Counts**: Exams show 75, 65, 80, etc. questions
- **Actual Question Counts**: Only 5 questions per exam in the exam-questions.js file
- **Timer Settings**: Correctly set for full exams (2 hours, 1.5 hours, etc.)
- **Problem**: Timer doesn't match actual question count, doesn't simulate real test conditions

## Why It's Currently Set Up This Way
The exams were likely set up with 5 questions each for:
1. **Development/Demo purposes** - Quick testing and UI development
2. **Content creation** - Placeholder structure before full content expansion
3. **SRS (Spaced Repetition System)** - The code mentions SRS which may have been intended to select subsets of questions

## Solution
Expanding all exam questions to match advertised counts:
- NDT Inspection: 5 → 75 questions
- Diver Medic Technician: 5 → 65 questions  
- Commercial Supervisor: 5 → 80 questions
- Saturation Diving: 5 → 70 questions
- Underwater Welding: 5 → 60 questions
- Hyperbaric Operations: 5 → 55 questions
- ALST: 5 → 70 questions
- LST: 5 → 60 questions

## Implementation
Creating comprehensive professional questions covering all major topics for each certification to simulate real exam conditions.






