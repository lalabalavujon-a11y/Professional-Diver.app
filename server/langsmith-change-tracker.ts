import { Client as LangSmithClient } from 'langsmith';
import { documentationChanges } from '../shared/schema-sqlite';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { EventEmitter } from 'events';

/**
 * LangSmith Change Tracker
 * Monitors LangSmith changes and syncs with platform monitor
 */
export class LangSmithChangeTracker extends EventEmitter {
  private static instance: LangSmithChangeTracker;
  private langsmithClient: LangSmithClient | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private monitoringInterval: number;
  private lastCheckTime: Date;
  private baselinePrompts: Map<string, string> = new Map(); // promptId -> promptHash

  private constructor(intervalMinutes: number = 30) {
    super();
    this.monitoringInterval = intervalMinutes * 60 * 1000;
    this.lastCheckTime = new Date();

    // Initialize LangSmith client if API key is available
    if (process.env.LANGSMITH_API_KEY) {
      try {
        this.langsmithClient = new LangSmithClient({
          apiKey: process.env.LANGSMITH_API_KEY,
        });
        console.log('✅ LangSmith client initialized');
      } catch (error) {
        console.error('❌ Error initializing LangSmith client:', error);
      }
    } else {
      console.warn('⚠️ LANGSMITH_API_KEY not set - LangSmith tracking disabled');
    }
  }

  public static getInstance(intervalMinutes?: number): LangSmithChangeTracker {
    if (!LangSmithChangeTracker.instance) {
      LangSmithChangeTracker.instance = new LangSmithChangeTracker(intervalMinutes);
    }
    return LangSmithChangeTracker.instance;
  }

  /**
   * Start monitoring LangSmith changes
   */
  public async start(): Promise<void> {
    if (!this.langsmithClient) {
      console.warn('⚠️ LangSmith client not available - tracker not started');
      return;
    }

    console.log(`🔍 Starting LangSmith Change Tracker (interval: ${this.monitoringInterval / 60000} minutes)`);
    
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
      console.log('🛑 LangSmith Change Tracker stopped');
    }
  }

  /**
   * Initialize baseline state
   */
  private async initializeBaseline(): Promise<void> {
    try {
      // For now, we'll track changes based on known system prompts
      // In a full implementation, we'd query LangSmith API for prompts and experiments
      
      // Track known Laura system prompt locations
      // This is a simplified approach - in production, we'd query LangSmith projects
      this.baselinePrompts.set('laura-oracle', this.hashPrompt('laura'));
      this.baselinePrompts.set('ai-tutors', this.hashPrompt('ai-tutors'));
      this.baselinePrompts.set('diver-well', this.hashPrompt('diver-well'));

      console.log('📊 LangSmith baseline state initialized');
    } catch (error) {
      console.error('❌ Error initializing LangSmith baseline:', error);
    }
  }

  /**
   * Check for LangSmith-related changes
   */
  private async checkForChanges(): Promise<void> {
    if (!this.langsmithClient) {
      return;
    }

    try {
      console.log('🔍 Checking for LangSmith changes...');
      const changes: Array<{ type: string; description: string; metadata: any }> = [];

      // Check for system prompt changes
      // In a full implementation, we'd:
      // 1. Query LangSmith API for recent experiments/projects
      // 2. Compare system prompts with baseline
      // 3. Track objective changes
      // 4. Monitor learning pattern updates

      // For now, we'll detect changes through file monitoring or manual triggers
      // This would be enhanced with actual LangSmith API queries

      // Example: Check if Laura's system prompt file was modified
      // This would require file watching or comparing prompt hashes

      // Emit changes
      for (const change of changes) {
        console.log(`📢 Detected LangSmith change: ${change.type} - ${change.description}`);
        this.emit('change', change);

        // Store change in database
        await this.recordChange(change);
      }

      if (changes.length > 0) {
        console.log(`✅ Found ${changes.length} LangSmith change(s)`);
      } else {
        console.log('✅ No LangSmith changes detected');
      }

      this.lastCheckTime = new Date();
    } catch (error) {
      console.error('❌ Error checking LangSmith changes:', error);
      this.emit('error', error);
    }
  }

  /**
   * Record LangSmith objective or prompt change
   */
  public async recordPromptChange(promptId: string, newPrompt: string, description: string): Promise<void> {
    const newHash = this.hashPrompt(newPrompt);
    const oldHash = this.baselinePrompts.get(promptId);

    if (oldHash && oldHash !== newHash) {
      const change = {
        type: 'ai',
        description: description || `System prompt updated: ${promptId}`,
        metadata: {
          promptId,
          oldHash,
          newHash,
          changeType: 'prompt_update',
        }
      };

      console.log(`📢 LangSmith prompt change detected: ${promptId}`);
      this.emit('change', change);
      await this.recordChange(change);
      
      // Update baseline
      this.baselinePrompts.set(promptId, newHash);
    }
  }

  /**
   * Record LangSmith objective change
   */
  public async recordObjectiveChange(objectiveId: string, description: string, metadata: any): Promise<void> {
    const change = {
      type: 'ai',
      description: description || `LangSmith objective changed: ${objectiveId}`,
      metadata: {
        objectiveId,
        changeType: 'objective_update',
        ...metadata,
      }
    };

    console.log(`📢 LangSmith objective change detected: ${objectiveId}`);
    this.emit('change', change);
    await this.recordChange(change);
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
      console.error('❌ Error recording LangSmith change:', error);
    }
  }

  /**
   * Simple hash function for prompt comparison
   */
  private hashPrompt(prompt: string): string {
    // Simple hash - in production, use a proper hashing algorithm
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Force immediate check (for manual sync)
   */
  public async forceCheck(): Promise<void> {
    console.log('🔄 Force checking LangSmith changes...');
    await this.checkForChanges();
  }

  /**
   * Check if LangSmith is available
   */
  public isAvailable(): boolean {
    return this.langsmithClient !== null;
  }
}

export default LangSmithChangeTracker;

