/**
 * LangSmith Calendar Tracker
 * Tracks all calendar operations for LangSmith monitoring and learning
 */

import { Client as LangSmithClient } from 'langsmith';
import type { UnifiedCalendarEvent } from '../services/unified-calendar-service';
import type { CalendarConflict } from '../services/calendar-conflict-resolver';

export class LangSmithCalendarTracker {
  private client: LangSmithClient | null = null;
  private projectName: string;

  constructor() {
    if (process.env.LANGSMITH_API_KEY) {
      this.client = new LangSmithClient({
        apiKey: process.env.LANGSMITH_API_KEY,
      });
      this.projectName = process.env.LANGSMITH_PROJECT_CALENDAR || 'calendar-monitoring';
    }
  }

  /**
   * Track event aggregation
   */
  async trackAggregation(
    userId: string,
    eventsCount: number,
    sources: string[],
    duration: number
  ): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.createRun({
        name: 'calendar_aggregation',
        runType: 'chain',
        projectName: this.projectName,
        inputs: {
          userId,
          eventsCount,
          sources: sources.join(','),
        },
        outputs: {
          success: true,
          eventsCount,
          duration,
        },
        metadata: {
          operation: 'aggregate',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error tracking aggregation in LangSmith:', error);
      // Don't throw - tracking is non-critical
    }
  }

  /**
   * Track sync operation
   */
  async trackSync(
    userId: string,
    source: string,
    success: boolean,
    eventsSynced: number,
    errors: string[],
    duration: number
  ): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.createRun({
        name: 'calendar_sync',
        runType: 'chain',
        projectName: this.projectName,
        inputs: {
          userId,
          source,
        },
        outputs: {
          success,
          eventsSynced,
          errors: errors.join('; '),
          duration,
        },
        metadata: {
          operation: 'sync',
          source,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error tracking sync in LangSmith:', error);
    }
  }

  /**
   * Track conflict detection
   */
  async trackConflictDetection(
    conflicts: CalendarConflict[],
    eventsAnalyzed: number,
    duration: number
  ): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.createRun({
        name: 'conflict_detection',
        runType: 'chain',
        projectName: this.projectName,
        inputs: {
          eventsAnalyzed,
        },
        outputs: {
          conflictsDetected: conflicts.length,
          byType: conflicts.reduce((acc, c) => {
            acc[c.type] = (acc[c.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          bySeverity: conflicts.reduce((acc, c) => {
            acc[c.severity] = (acc[c.severity] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        },
        metadata: {
          operation: 'conflict_detection',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error tracking conflict detection in LangSmith:', error);
    }
  }

  /**
   * Track conflict resolution
   */
  async trackConflictResolution(
    conflictId: string,
    resolution: string,
    resolvedBy: string,
    success: boolean
  ): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.createRun({
        name: 'conflict_resolution',
        runType: 'chain',
        projectName: this.projectName,
        inputs: {
          conflictId,
          resolution,
          resolvedBy,
        },
        outputs: {
          success,
        },
        metadata: {
          operation: 'conflict_resolution',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error tracking conflict resolution in LangSmith:', error);
    }
  }

  /**
   * Track agent analysis
   */
  async trackAgentAnalysis(
    agentName: string,
    analysisType: string,
    insights: any,
    duration: number
  ): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.createRun({
        name: `agent_${agentName}`,
        runType: 'chain',
        projectName: this.projectName,
        inputs: {
          agentName,
          analysisType,
        },
        outputs: insights,
        metadata: {
          operation: 'agent_analysis',
          agent: agentName,
          type: analysisType,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error(`Error tracking ${agentName} analysis in LangSmith:`, error);
    }
  }
}

export const langSmithCalendarTracker = new LangSmithCalendarTracker();
