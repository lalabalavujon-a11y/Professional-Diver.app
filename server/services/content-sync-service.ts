#!/usr/bin/env tsx

/**
 * 📊 CONTENT SYNC SERVICE
 * 
 * Monitors content changes in the platform and triggers updates
 * for AI assistants (Laura and Diver Well) to keep them current.
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @date 2025
 */

import { db } from '../db';
import { tracks, lessons, quizzes, questions } from '../../shared/schema-sqlite';
import { eq, desc } from 'drizzle-orm';

export interface ContentChange {
  type: 'track' | 'lesson' | 'quiz' | 'question' | 'feature' | 'api';
  action: 'created' | 'updated' | 'deleted';
  entityId: string;
  entityType: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export class ContentSyncService {
  private static instance: ContentSyncService;
  private changeListeners: Array<(change: ContentChange) => void> = [];
  private lastSyncTime: Date = new Date();

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): ContentSyncService {
    if (!ContentSyncService.instance) {
      ContentSyncService.instance = new ContentSyncService();
    }
    return ContentSyncService.instance;
  }

  /**
   * Register a listener for content changes
   */
  onContentChange(listener: (change: ContentChange) => void): () => void {
    this.changeListeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.changeListeners = this.changeListeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of a content change
   */
  private notifyChange(change: ContentChange): void {
    this.changeListeners.forEach(listener => {
      try {
        listener(change);
      } catch (error) {
        console.error('Error in content change listener:', error);
      }
    });
  }

  /**
   * Record a track change
   */
  async recordTrackChange(
    action: 'created' | 'updated' | 'deleted',
    trackId: string,
    details?: Record<string, any>
  ): Promise<void> {
    const change: ContentChange = {
      type: 'track',
      action,
      entityId: trackId,
      entityType: 'Track',
      timestamp: new Date(),
      details
    };

    this.notifyChange(change);
    this.lastSyncTime = new Date();
  }

  /**
   * Record a lesson change
   */
  async recordLessonChange(
    action: 'created' | 'updated' | 'deleted',
    lessonId: string,
    details?: Record<string, any>
  ): Promise<void> {
    const change: ContentChange = {
      type: 'lesson',
      action,
      entityId: lessonId,
      entityType: 'Lesson',
      timestamp: new Date(),
      details
    };

    this.notifyChange(change);
    this.lastSyncTime = new Date();
  }

  /**
   * Record a quiz change
   */
  async recordQuizChange(
    action: 'created' | 'updated' | 'deleted',
    quizId: string,
    details?: Record<string, any>
  ): Promise<void> {
    const change: ContentChange = {
      type: 'quiz',
      action,
      entityId: quizId,
      entityType: 'Quiz',
      timestamp: new Date(),
      details
    };

    this.notifyChange(change);
    this.lastSyncTime = new Date();
  }

  /**
   * Record a feature change
   */
  async recordFeatureChange(
    action: 'created' | 'updated' | 'deleted',
    featureName: string,
    details?: Record<string, any>
  ): Promise<void> {
    const change: ContentChange = {
      type: 'feature',
      action,
      entityId: featureName,
      entityType: 'Feature',
      timestamp: new Date(),
      details
    };

    this.notifyChange(change);
    this.lastSyncTime = new Date();
  }

  /**
   * Record an API endpoint change
   */
  async recordApiChange(
    action: 'created' | 'updated' | 'deleted',
    endpoint: string,
    details?: Record<string, any>
  ): Promise<void> {
    const change: ContentChange = {
      type: 'api',
      action,
      entityId: endpoint,
      entityType: 'API Endpoint',
      timestamp: new Date(),
      details
    };

    this.notifyChange(change);
    this.lastSyncTime = new Date();
  }

  /**
   * Get recent content changes since last sync
   */
  async getRecentChanges(since?: Date): Promise<ContentChange[]> {
    const sinceDate = since || this.lastSyncTime;
    // In a real implementation, this would query a changes log table
    // For now, return empty array as changes are notified in real-time
    return [];
  }

  /**
   * Get summary of all content for AI knowledge base
   */
  async getContentSummary(): Promise<{
    tracks: Array<{ id: string; title: string; slug: string; summary: string | null }>;
    lessons: Array<{ id: string; title: string; trackId: string }>;
    quizzes: Array<{ id: string; title: string; lessonId: string }>;
    lastUpdated: Date;
  }> {
    try {
      const allTracks = await db.select({
        id: tracks.id,
        title: tracks.title,
        slug: tracks.slug,
        summary: tracks.summary
      }).from(tracks).orderBy(desc(tracks.createdAt));

      const allLessons = await db.select({
        id: lessons.id,
        title: lessons.title,
        trackId: lessons.trackId
      }).from(lessons).orderBy(desc(lessons.createdAt));

      const allQuizzes = await db.select({
        id: quizzes.id,
        title: quizzes.title,
        lessonId: quizzes.lessonId
      }).from(quizzes).orderBy(desc(quizzes.createdAt));

      return {
        tracks: allTracks,
        lessons: allLessons,
        quizzes: allQuizzes,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting content summary:', error);
      return {
        tracks: [],
        lessons: [],
        quizzes: [],
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date {
    return this.lastSyncTime;
  }
}

// Export singleton instance as default
// The class is already exported via "export class ContentSyncService"
export default ContentSyncService.getInstance();
