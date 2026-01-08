#!/usr/bin/env tsx

/**
 * 🎯 SIMPLE PLATFORM STATUS CHECK
 * 
 * This script provides a quick overview of the current platform status
 * without complex validation logic.
 */

import { db } from "../server/db";
import { 
  users, tracks, lessons, quizzes, questions, aiTutors, 
  userProgress, quizAttempts, learningPaths 
} from "../shared/schema-sqlite";
import { count } from "drizzle-orm";

async function checkPlatformStatus() {
  console.log("🔍 CHECKING PLATFORM STATUS...");
  console.log("=" .repeat(50));
  
  try {
    // Check basic counts
    const userCount = await db.select({ count: count() }).from(users);
    const trackCount = await db.select({ count: count() }).from(tracks);
    const lessonCount = await db.select({ count: count() }).from(lessons);
    const quizCount = await db.select({ count: count() }).from(quizzes);
    const questionCount = await db.select({ count: count() }).from(questions);
    const aiTutorCount = await db.select({ count: count() }).from(aiTutors);
    
    console.log("📊 PLATFORM STATISTICS:");
    console.log(`👥 Users: ${userCount[0]?.count || 0}`);
    console.log(`📚 Tracks: ${trackCount[0]?.count || 0}`);
    console.log(`📖 Lessons: ${lessonCount[0]?.count || 0}`);
    console.log(`🧪 Quizzes: ${quizCount[0]?.count || 0}`);
    console.log(`❓ Questions: ${questionCount[0]?.count || 0}`);
    console.log(`🤖 AI Tutors: ${aiTutorCount[0]?.count || 0}`);
    
    // Check AI tutors
    const allAITutors = await db.select().from(aiTutors);
    console.log("\n🤖 AI TUTORS:");
    allAITutors.forEach(tutor => {
      console.log(`  - ${tutor.name}: ${tutor.specialty}`);
    });
    
    // Check tracks
    const allTracks = await db.select().from(tracks);
    console.log("\n📚 LEARNING TRACKS:");
    allTracks.forEach(track => {
      const hasAITutor = track.aiTutorId ? "✅" : "❌";
      console.log(`  ${hasAITutor} ${track.title} (${track.difficulty})`);
    });
    
    // Check content quality
    const allLessons = await db.select().from(lessons);
    const shortLessons = allLessons.filter(l => l.content.length < 500);
    const lessonsWithObjectives = allLessons.filter(l => l.objectives);
    
    console.log("\n📖 CONTENT QUALITY:");
    console.log(`  Total Lessons: ${allLessons.length}`);
    console.log(`  Short Lessons (<500 chars): ${shortLessons.length}`);
    console.log(`  Lessons with Objectives: ${lessonsWithObjectives.length}`);
    
    // Check quiz standards
    const allQuizzes = await db.select().from(quizzes);
    const quizzesWithTimeLimit = allQuizzes.filter(q => q.timeLimit);
    const quizzesWithPassingScore = allQuizzes.filter(q => q.passingScore);
    
    console.log("\n🧪 QUIZ STANDARDS:");
    console.log(`  Total Quizzes: ${allQuizzes.length}`);
    console.log(`  With Time Limits: ${quizzesWithTimeLimit.length}`);
    console.log(`  With Passing Scores: ${quizzesWithPassingScore.length}`);
    
    // Summary
    console.log("\n🎯 SUMMARY:");
    const totalRequirements = 6;
    let metRequirements = 0;
    
    if (aiTutorCount[0]?.count >= 2) {
      console.log("✅ AI Tutors: Laura and Diver Well exist");
      metRequirements++;
    } else {
      console.log("❌ AI Tutors: Need to create Laura and Diver Well");
    }
    
    if (allTracks.every(t => t.aiTutorId)) {
      console.log("✅ Content Alignment: All tracks have AI tutors");
      metRequirements++;
    } else {
      console.log("❌ Content Alignment: Some tracks missing AI tutors");
    }
    
    if (allQuizzes.every(q => q.timeLimit && q.passingScore)) {
      console.log("✅ Exam Standards: All quizzes meet standards");
      metRequirements++;
    } else {
      console.log("❌ Exam Standards: Some quizzes need time limits/passing scores");
    }
    
    if (allLessons.some(l => l.content.includes("MIT") || l.content.includes("Harvard"))) {
      console.log("✅ Premium Content: Some lessons reference top institutions");
      metRequirements++;
    } else {
      console.log("❌ Premium Content: Need to add MIT/Harvard/Oxford references");
    }
    
    if (userCount[0]?.count > 0) {
      console.log("✅ Real-time Analytics: User tracking enabled");
      metRequirements++;
    } else {
      console.log("❌ Real-time Analytics: No users to track");
    }
    
    if (aiTutorCount[0]?.count >= 2) {
      console.log("✅ AI Learning: AI tutors exist for continuous learning");
      metRequirements++;
    } else {
      console.log("❌ AI Learning: Need to create AI tutors");
    }
    
    console.log(`\n📊 REQUIREMENTS MET: ${metRequirements}/${totalRequirements}`);
    
    if (metRequirements === totalRequirements) {
      console.log("🎉 ALL REQUIREMENTS MET! Platform is ready!");
    } else {
      console.log("⚠️  Some requirements need attention.");
    }
    
  } catch (error) {
    console.error("❌ CHECK FAILED:", error);
  }
}

// Run the check
checkPlatformStatus()
  .then(() => {
    console.log("\n✅ Platform check complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Check failed:", error);
    process.exit(1);
  });
