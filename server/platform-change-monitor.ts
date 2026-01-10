import { db } from "./db";
import { tracks, lessons, quizzes, aiTutors, documentationChanges, documentationSections } from "../shared/schema-sqlite";
import { eq, sql, desc, count } from "drizzle-orm";
import { EventEmitter } from "events";

/**
 * Platform Change Monitor Service
 * Monitors database, routes, and feature changes at regular intervals
 * Emits change events for detected modifications
 */
export class PlatformChangeMonitor extends EventEmitter {
  private static instance: PlatformChangeMonitor;
  private intervalId: NodeJS.Timeout | null = null;
  private monitoringInterval: number;
  private lastCheckTime: Date;
  private baselineState: {
    trackCount: number;
    lessonCount: number;
    quizCount: number;
    tutorCount: number;
    lastTrackId: string | null;
    lastLessonId: string | null;
  };

  private constructor(intervalMinutes: number = 15) {
    super();
    this.monitoringInterval = intervalMinutes * 60 * 1000; // Convert to milliseconds
    this.lastCheckTime = new Date();
    this.baselineState = {
      trackCount: 0,
      lessonCount: 0,
      quizCount: 0,
      tutorCount: 0,
      lastTrackId: null,
      lastLessonId: null,
    };
  }

  public static getInstance(intervalMinutes?: number): PlatformChangeMonitor {
    if (!PlatformChangeMonitor.instance) {
      PlatformChangeMonitor.instance = new PlatformChangeMonitor(intervalMinutes);
    }
    return PlatformChangeMonitor.instance;
  }

  /**
   * Start monitoring platform changes
   */
  public async start(): Promise<void> {
    console.log(`🔍 Starting Platform Change Monitor (interval: ${this.monitoringInterval / 60000} minutes)`);
    
    // Initialize baseline state
    await this.initializeBaseline();
    
    // Perform initial check
    await this.checkForChanges();
    
    // Set up interval
    this.intervalId = setInterval(async () => {
      await this.checkForChanges();
    }, this.monitoringInterval);
  }

  /**
   * Stop monitoring
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Platform Change Monitor stopped');
    }
  }

  /**
   * Initialize baseline state from current database
   */
  private async initializeBaseline(): Promise<void> {
    try {
      const [trackResult] = await db.select({ count: count() }).from(tracks);
      const [lessonResult] = await db.select({ count: count() }).from(lessons);
      const [quizResult] = await db.select({ count: count() }).from(quizzes);
      const [tutorResult] = await db.select({ count: count() }).from(aiTutors);

      // Get latest track and lesson IDs
      const latestTrack = await db.select({ id: tracks.id })
        .from(tracks)
        .orderBy(desc(tracks.createdAt))
        .limit(1);
      
      const latestLesson = await db.select({ id: lessons.id })
        .from(lessons)
        .orderBy(desc(lessons.createdAt))
        .limit(1);

      this.baselineState = {
        trackCount: trackResult?.count || 0,
        lessonCount: lessonResult?.count || 0,
        quizCount: quizResult?.count || 0,
        tutorCount: tutorResult?.count || 0,
        lastTrackId: latestTrack[0]?.id || null,
        lastLessonId: latestLesson[0]?.id || null,
      };

      console.log('📊 Baseline state initialized:', this.baselineState);
    } catch (error) {
      console.error('❌ Error initializing baseline state:', error);
      throw error;
    }
  }

  /**
   * Check for changes and emit events
   */
  private async checkForChanges(): Promise<void> {
    try {
      console.log('🔍 Checking for platform changes...');
      const changes: Array<{ type: string; description: string; metadata: any }> = [];

      // Check for content changes
      const contentChanges = await this.checkContentChanges();
      changes.push(...contentChanges);

      // Check for feature changes (would need to parse routes.ts - simplified for now)
      // Feature changes would require file watching or API route registry comparison

      // Emit change events
      for (const change of changes) {
        console.log(`📢 Detected change: ${change.type} - ${change.description}`);
        this.emit('change', change);

        // Store change in database
        await this.recordChange(change);
      }

      if (changes.length > 0) {
        console.log(`✅ Found ${changes.length} change(s)`);
      } else {
        console.log('✅ No changes detected');
      }

      // Update last check time
      this.lastCheckTime = new Date();

      // Update baseline state for next check
      await this.initializeBaseline();
    } catch (error) {
      console.error('❌ Error checking for changes:', error);
      this.emit('error', error);
    }
  }

  /**
   * Check for content changes (tracks, lessons, quizzes, tutors)
   */
  private async checkContentChanges(): Promise<Array<{ type: string; description: string; metadata: any }>> {
    const changes: Array<{ type: string; description: string; metadata: any }> = [];

    try {
      // Check tracks
      const [currentTrackCount] = await db.select({ count: count() }).from(tracks);
      if (currentTrackCount.count !== this.baselineState.trackCount) {
        const newTracks = await db.select()
          .from(tracks)
          .orderBy(desc(tracks.createdAt))
          .limit(currentTrackCount.count - this.baselineState.trackCount);

        for (const track of newTracks) {
          if (track.id !== this.baselineState.lastTrackId) {
            changes.push({
              type: 'content',
              description: `New track added: ${track.title}`,
              metadata: {
                trackId: track.id,
                trackSlug: track.slug,
                trackTitle: track.title,
                isPublished: track.isPublished,
              }
            });
          }
        }
      }

      // Check lessons
      const [currentLessonCount] = await db.select({ count: count() }).from(lessons);
      if (currentLessonCount.count !== this.baselineState.lessonCount) {
        const newLessons = await db.select()
          .from(lessons)
          .orderBy(desc(lessons.createdAt))
          .limit(currentLessonCount.count - this.baselineState.lessonCount);

        for (const lesson of newLessons) {
          if (lesson.id !== this.baselineState.lastLessonId) {
            const track = await db.select({ title: tracks.title, slug: tracks.slug })
              .from(tracks)
              .where(eq(tracks.id, lesson.trackId))
              .limit(1);

            changes.push({
              type: 'content',
              description: `New lesson added: ${lesson.title} in track ${track[0]?.title || 'Unknown'}`,
              metadata: {
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                trackId: lesson.trackId,
                trackSlug: track[0]?.slug,
                trackTitle: track[0]?.title,
              }
            });
          }
        }
      }

      // Check quizzes
      const [currentQuizCount] = await db.select({ count: count() }).from(quizzes);
      if (currentQuizCount.count !== this.baselineState.quizCount) {
        changes.push({
          type: 'content',
          description: `Quiz count changed: ${this.baselineState.quizCount} → ${currentQuizCount.count}`,
          metadata: {
            oldCount: this.baselineState.quizCount,
            newCount: currentQuizCount.count,
          }
        });
      }

      // Check AI tutors
      const [currentTutorCount] = await db.select({ count: count() }).from(aiTutors);
      if (currentTutorCount.count !== this.baselineState.tutorCount) {
        const newTutors = await db.select()
          .from(aiTutors)
          .orderBy(desc(aiTutors.createdAt))
          .limit(currentTutorCount.count - this.baselineState.tutorCount);

        for (const tutor of newTutors) {
          changes.push({
            type: 'ai',
            description: `New AI tutor added: ${tutor.name} (${tutor.specialty || 'General'})`,
            metadata: {
              tutorId: tutor.id,
              tutorName: tutor.name,
              tutorSpecialty: tutor.specialty,
            }
          });
        }
      }

      // Check for published/unpublished tracks
      const publishedTracks = await db.select()
        .from(tracks)
        .where(eq(tracks.isPublished, true));

      // This is simplified - in a real implementation, we'd track publish/unpublish events
      // by storing previous publish states

    } catch (error) {
      console.error('❌ Error checking content changes:', error);
    }

    return changes;
  }

  /**
   * Record change in database
   */
  private async recordChange(change: { type: string; description: string; metadata: any }): Promise<void> {
    try {
      await db.insert(documentationChanges).values({
        changeType: change.type,
        description: change.description,
        metadata: JSON.stringify(change.metadata),
        status: 'pending',
        detectedAt: new Date(),
      });
    } catch (error) {
      console.error('❌ Error recording change:', error);
    }
  }

  /**
   * Force immediate check (for manual sync)
   */
  public async forceCheck(): Promise<void> {
    console.log('🔄 Force checking for changes...');
    await this.checkForChanges();
  }

  /**
   * Get pending changes
   */
  public async getPendingChanges(): Promise<any[]> {
    try {
      return await db.select()
        .from(documentationChanges)
        .where(eq(documentationChanges.status, 'pending'))
        .orderBy(desc(documentationChanges.detectedAt));
    } catch (error) {
      console.error('❌ Error fetching pending changes:', error);
      return [];
    }
  }
}

export default PlatformChangeMonitor;

