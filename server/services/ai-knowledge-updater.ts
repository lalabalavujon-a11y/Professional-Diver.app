#!/usr/bin/env tsx

/**
 * 🧠 AI KNOWLEDGE UPDATER SERVICE
 * 
 * Automatically updates AI assistant system prompts (Laura and Diver Well)
 * when content, features, or API endpoints change.
 * 
 * @author AI Assistant
 * @version 1.0.0
 * @date 2025
 */

import { ContentSyncService, type ContentChange } from './content-sync-service';
import { LauraOracleService } from '../laura-oracle-service';
import { DiverWellService } from '../diver-well-service';

export interface KnowledgeUpdate {
  assistant: 'laura' | 'diver-well' | 'both';
  updateType: 'content' | 'feature' | 'api' | 'full';
  timestamp: Date;
  changes: ContentChange[];
  summary: string;
}

export class AIKnowledgeUpdater {
  private static instance: AIKnowledgeUpdater;
  private contentSync: ContentSyncService;
  private updateHistory: KnowledgeUpdate[] = [];
  private isUpdating = false;

  private constructor() {
    this.contentSync = ContentSyncService.getInstance();
    this.setupChangeListener();
  }

  static getInstance(): AIKnowledgeUpdater {
    if (!AIKnowledgeUpdater.instance) {
      AIKnowledgeUpdater.instance = new AIKnowledgeUpdater();
    }
    return AIKnowledgeUpdater.instance;
  }

  /**
   * Setup listener for content changes
   */
  private setupChangeListener(): void {
    this.contentSync.onContentChange(async (change: ContentChange) => {
      // Debounce updates - wait 5 seconds after last change before updating
      setTimeout(async () => {
        if (!this.isUpdating) {
          await this.processContentChange(change);
        }
      }, 5000);
    });
  }

  /**
   * Process a content change and update AI assistants
   */
  private async processContentChange(change: ContentChange): Promise<void> {
    if (this.isUpdating) return;

    this.isUpdating = true;
    try {
      const update: KnowledgeUpdate = {
        assistant: this.determineAssistant(change),
        updateType: this.determineUpdateType(change),
        timestamp: new Date(),
        changes: [change],
        summary: this.generateUpdateSummary(change)
      };

      await this.applyUpdate(update);
      this.updateHistory.push(update);

      // Keep only last 100 updates
      if (this.updateHistory.length > 100) {
        this.updateHistory = this.updateHistory.slice(-100);
      }
    } catch (error) {
      console.error('Error processing content change:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Determine which assistant(s) need updating based on change type
   */
  private determineAssistant(change: ContentChange): 'laura' | 'diver-well' | 'both' {
    // Laura needs updates for platform features, API changes, content structure
    // Diver Well needs updates for diving-related content
    if (change.type === 'feature' || change.type === 'api') {
      return 'laura';
    }
    if (change.type === 'track' || change.type === 'lesson') {
      return 'both'; // Both need to know about content
    }
    return 'both';
  }

  /**
   * Determine update type
   */
  private determineUpdateType(change: ContentChange): 'content' | 'feature' | 'api' | 'full' {
    if (change.type === 'feature') return 'feature';
    if (change.type === 'api') return 'api';
    if (change.type === 'track' || change.type === 'lesson') return 'content';
    return 'full';
  }

  /**
   * Generate summary of update
   */
  private generateUpdateSummary(change: ContentChange): string {
    return `${change.action} ${change.entityType.toLowerCase()} ${change.entityId}`;
  }

  /**
   * Apply knowledge update to assistants
   */
  private async applyUpdate(update: KnowledgeUpdate): Promise<void> {
    const contentSummary = await this.contentSync.getContentSummary();

    if (update.assistant === 'laura' || update.assistant === 'both') {
      try {
        // LauraOracleService is exported as default class, use static getInstance
        const lauraService = LauraOracleService.getInstance();
        await this.updateLauraKnowledge(lauraService, contentSummary, update);
      } catch (error) {
        console.error('Error updating Laura knowledge:', error);
      }
    }

    if (update.assistant === 'diver-well' || update.assistant === 'both') {
      try {
        // DiverWellService is exported as default class, use static getInstance
        const diverWellService = DiverWellService.getInstance();
        await this.updateDiverWellKnowledge(diverWellService, contentSummary, update);
      } catch (error) {
        console.error('Error updating Diver Well knowledge:', error);
      }
    }
  }

  /**
   * Update Laura's knowledge base
   */
  private async updateLauraKnowledge(
    lauraService: LauraOracleService,
    contentSummary: {
      tracks: Array<{ id: string; title: string; slug: string; summary: string | null }>;
      lessons: Array<{ id: string; title: string; trackId: string }>;
      quizzes: Array<{ id: string; title: string; lessonId: string }>;
      lastUpdated: Date;
    },
    update: KnowledgeUpdate
  ): Promise<void> {
    // Extract features and API endpoints from update details
    const features = update.changes
      .filter(c => c.type === 'feature')
      .map(c => c.entityId);
    
    const apiEndpoints = update.changes
      .filter(c => c.type === 'api')
      .map(c => c.entityId);
    
    // Update Laura's knowledge
    if (lauraService && typeof lauraService.updateKnowledge === 'function') {
      await lauraService.updateKnowledge(contentSummary, features, apiEndpoints);
    }
    
    console.log(`[AIKnowledgeUpdater] Updated Laura knowledge: ${update.summary}`);
  }

  /**
   * Update Diver Well's knowledge base
   */
  private async updateDiverWellKnowledge(
    diverWellService: DiverWellService,
    contentSummary: {
      tracks: Array<{ id: string; title: string; slug: string; summary: string | null }>;
      lessons: Array<{ id: string; title: string; trackId: string }>;
      quizzes: Array<{ id: string; title: string; lessonId: string }>;
      lastUpdated: Date;
    },
    update: KnowledgeUpdate
  ): Promise<void> {
    // Update Diver Well's knowledge
    if (diverWellService && typeof diverWellService.updateKnowledge === 'function') {
      await diverWellService.updateKnowledge(contentSummary);
    }
    
    console.log(`[AIKnowledgeUpdater] Updated Diver Well knowledge: ${update.summary}`);
  }

  /**
   * Generate content section for Laura's system prompt
   */
  private generateLauraContentSection(contentSummary: any): string {
    let section = '\n\nCURRENT PLATFORM CONTENT:\n\n';
    
    section += `TRACKS (${contentSummary.tracks.length} total):\n`;
    contentSummary.tracks.forEach((track: any) => {
      section += `- ${track.title} (${track.slug}): ${track.summary || 'No summary'}\n`;
    });
    
    section += `\nLESSONS (${contentSummary.lessons.length} total):\n`;
    contentSummary.lessons.forEach((lesson: any) => {
      section += `- ${lesson.title} (Track: ${lesson.trackId})\n`;
    });
    
    section += `\nQUIZZES (${contentSummary.quizzes.length} total):\n`;
    contentSummary.quizzes.forEach((quiz: any) => {
      section += `- ${quiz.title} (Lesson: ${quiz.lessonId})\n`;
    });
    
    section += `\nLast Updated: ${contentSummary.lastUpdated.toISOString()}\n`;
    
    return section;
  }

  /**
   * Generate content section for Diver Well's system prompt
   */
  private generateDiverWellContentSection(contentSummary: any): string {
    let section = '\n\nCURRENT TRAINING CONTENT AVAILABLE:\n\n';
    
    section += `TRAINING TRACKS (${contentSummary.tracks.length} total):\n`;
    contentSummary.tracks.forEach((track: any) => {
      section += `- ${track.title} (${track.slug}): ${track.summary || 'Professional diving training'}\n`;
    });
    
    section += `\nLESSONS (${contentSummary.lessons.length} total across all tracks)\n`;
    section += `QUIZZES (${contentSummary.quizzes.length} total for assessment)\n`;
    
    section += `\nContent Last Updated: ${contentSummary.lastUpdated.toISOString()}\n`;
    section += 'When users ask about specific tracks or lessons, reference the current content available.\n';
    
    return section;
  }

  /**
   * Manually trigger a full knowledge update
   */
  async triggerFullUpdate(): Promise<void> {
    if (this.isUpdating) {
      console.log('Update already in progress, skipping...');
      return;
    }

    this.isUpdating = true;
    try {
      const contentSummary = await this.contentSync.getContentSummary();
      
      const update: KnowledgeUpdate = {
        assistant: 'both',
        updateType: 'full',
        timestamp: new Date(),
        changes: [],
        summary: 'Full knowledge base update'
      };

      await this.applyUpdate(update);
      this.updateHistory.push(update);
    } catch (error) {
      console.error('Error in full update:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Get update history
   */
  getUpdateHistory(): KnowledgeUpdate[] {
    return [...this.updateHistory];
  }

  /**
   * Get last update time
   */
  getLastUpdateTime(): Date | null {
    if (this.updateHistory.length === 0) return null;
    return this.updateHistory[this.updateHistory.length - 1].timestamp;
  }
}

export default AIKnowledgeUpdater.getInstance();
