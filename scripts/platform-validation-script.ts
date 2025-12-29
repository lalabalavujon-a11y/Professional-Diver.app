#!/usr/bin/env tsx

/**
 * 🎯 PLATFORM VALIDATION SCRIPT
 * 
 * This script validates that the Professional Diver platform meets all
 * specified requirements for the ultimate educational experience.
 */

import { db } from "../server/db";
import { 
  users, tracks, lessons, quizzes, questions, aiTutors, 
  userProgress, quizAttempts, learningPaths 
} from "../shared/schema-sqlite";
import { eq, and, desc, sql, count } from "drizzle-orm";

const VALIDATION_CONFIG = {
  MIN_LESSON_LENGTH: 500,
  MIN_QUIZ_QUESTIONS: 10,
  REQUIRED_AI_TUTORS: ["Laura", "Diver Well"],
  PASSING_PERCENTAGE: 70,
  MAX_CONTENT_AGE_DAYS: 30
};

class PlatformValidator {
  async validateAllRequirements() {
    console.log("🎯 PLATFORM VALIDATION STARTING");
    
    const results = {
      contentAlignment: await this.validateContentAlignment(),
      liveUpdates: await this.validateLiveUpdates(),
      examStandards: await this.validateExamStandards(),
      premiumContent: await this.validatePremiumContent(),
      realTimeAnalytics: await this.validateRealTimeAnalytics(),
      aiLearning: await this.validateAILearning()
    };
    
    const overallSuccess = Object.values(results).every(result => result.valid);
    
    return { overallSuccess, results };
  }
  
  async validateContentAlignment() {
    const allTracks = await db.select().from(tracks);
    const tracksWithTutors = allTracks.filter(t => t.aiTutorId);
    
    return {
      valid: tracksWithTutors.length === allTracks.length,
      message: `${tracksWithTutors.length}/${allTracks.length} tracks have AI tutors`
    };
  }
  
  async validateLiveUpdates() {
    const recentLessons = await db
      .select()
      .from(lessons)
      .where(sql`updated_at > datetime('now', '-${VALIDATION_CONFIG.MAX_CONTENT_AGE_DAYS} days')`);
    
    return {
      valid: recentLessons.length > 0,
      message: `${recentLessons.length} lessons updated recently`
    };
  }
  
  async validateExamStandards() {
    const allQuizzes = await db.select().from(quizzes);
    const quizzesWithStandards = allQuizzes.filter(q => 
      q.timeLimit && q.passingScore && q.maxAttempts
    );
    
    return {
      valid: quizzesWithStandards.length === allQuizzes.length,
      message: `${quizzesWithStandards.length}/${allQuizzes.length} quizzes meet exam standards`
    };
  }
  
  async validatePremiumContent() {
    const allLessons = await db.select().from(lessons);
    const premiumLessons = allLessons.filter(l => 
      l.content.includes("MIT") || l.content.includes("Harvard") || 
      l.content.includes("Oxford") || l.content.includes("SpaceX")
    );
    
    return {
      valid: premiumLessons.length > 0,
      message: `${premiumLessons.length}/${allLessons.length} lessons have premium content`
    };
  }
  
  async validateRealTimeAnalytics() {
    const userProgress = await db.select().from(userProgress);
    
    return {
      valid: userProgress.length > 0,
      message: `Analytics tracking ${userProgress.length} progress records`
    };
  }
  
  async validateAILearning() {
    const allAITutors = await db.select().from(aiTutors);
    const requiredTutors = allAITutors.filter(tutor => 
      VALIDATION_CONFIG.REQUIRED_AI_TUTORS.includes(tutor.name)
    );
    
    return {
      valid: requiredTutors.length === VALIDATION_CONFIG.REQUIRED_AI_TUTORS.length,
      message: `${requiredTutors.length}/${VALIDATION_CONFIG.REQUIRED_AI_TUTORS.length} required AI tutors exist`
    };
  }
}

async function runValidation() {
  try {
    const validator = new PlatformValidator();
    const results = await validator.validateAllRequirements();
    
    console.log("\n📊 VALIDATION RESULTS:");
    console.log(JSON.stringify(results, null, 2));
    
    if (results.overallSuccess) {
      console.log("\n🎉 ALL REQUIREMENTS MET!");
    } else {
      console.log("\n⚠️  Some requirements need attention.");
    }
    
    return results;
  } catch (error) {
    console.error("❌ VALIDATION FAILED:", error);
    throw error;
  }
}

if (import.meta.url.endsWith(process.argv[1])) {
  runValidation()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { PlatformValidator, runValidation };
