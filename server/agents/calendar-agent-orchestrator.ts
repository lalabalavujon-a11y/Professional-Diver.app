/**
 * Calendar Agent Orchestrator
 * Coordinates all calendar monitoring agents
 */

import { calendarRealtimeAgent } from './calendar-realtime-agent';
import { calendarAnalysisAgent } from './calendar-analysis-agent';
import { calendarPatternAgent } from './calendar-pattern-agent';
import { langSmithCalendarTracker } from './langsmith-calendar-tracker';
import { unifiedCalendarService } from '../services/unified-calendar-service';
import type { UnifiedCalendarEvent } from '../services/unified-calendar-service';
import type { RealtimeAlert } from './calendar-realtime-agent';

export interface AgentStatus {
  realtimeAgent: {
    status: 'running' | 'stopped' | 'error';
    lastActivity?: Date;
    alertsGenerated: number;
  };
  analysisAgent: {
    status: 'running' | 'stopped' | 'error';
    lastRun?: Date;
    nextRun?: Date;
    insightsGenerated: number;
  };
  patternAgent: {
    status: 'running' | 'stopped' | 'error';
    lastRun?: Date;
    patternsDetected: number;
  };
}

export class CalendarAgentOrchestrator {
  private realtimeAlerts: RealtimeAlert[] = [];
  private isRunning = false;
  private dailyAnalysisInterval: NodeJS.Timeout | null = null;
  private patternAnalysisInterval: NodeJS.Timeout | null = null;
  private lastDailyAnalysis: Date | null = null;
  private lastPatternAnalysis: Date | null = null;

  /**
   * Start all agents
   */
  start(): void {
    if (this.isRunning) {
      console.log('[Calendar Agents] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[Calendar Agents] Starting orchestrator...');

    // Schedule daily analysis (runs at 2 AM daily)
    this.scheduleDailyAnalysis();

    // Schedule pattern analysis (runs every 6 hours)
    this.schedulePatternAnalysis();

    console.log('[Calendar Agents] Orchestrator started');
  }

  /**
   * Stop all agents
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.dailyAnalysisInterval) {
      clearInterval(this.dailyAnalysisInterval);
      this.dailyAnalysisInterval = null;
    }

    if (this.patternAnalysisInterval) {
      clearInterval(this.patternAnalysisInterval);
      this.patternAnalysisInterval = null;
    }

    console.log('[Calendar Agents] Orchestrator stopped');
  }

  /**
   * Handle new event (real-time monitoring)
   */
  async handleNewEvent(event: UnifiedCalendarEvent): Promise<RealtimeAlert[]> {
    try {
      const alerts = await calendarRealtimeAgent.monitorNewEvent(event);
      
      // Store alerts
      this.realtimeAlerts.push(...alerts);
      
      // Keep only last 100 alerts
      if (this.realtimeAlerts.length > 100) {
        this.realtimeAlerts = this.realtimeAlerts.slice(-100);
      }

      // Log critical alerts
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        console.warn(`[Calendar Agents] Critical alerts detected:`, criticalAlerts);
        // In production, would send notifications here
      }

      return alerts;
    } catch (error) {
      console.error('[Calendar Agents] Error handling new event:', error);
      return [];
    }
  }

  /**
   * Handle sync failure
   */
  async handleSyncFailure(source: string, error: string): Promise<RealtimeAlert> {
    try {
      const alert = await calendarRealtimeAgent.monitorSyncFailure(source, error);
      this.realtimeAlerts.push(alert);
      return alert;
    } catch (error) {
      console.error('[Calendar Agents] Error handling sync failure:', error);
      throw error;
    }
  }

  /**
   * Schedule daily analysis
   */
  private scheduleDailyAnalysis(): void {
    // Run daily at 2 AM
    const runDailyAnalysis = async () => {
      try {
        console.log('[Calendar Agents] Running daily analysis...');
        const insights = await calendarAnalysisAgent.runDailyAnalysis();
        this.lastDailyAnalysis = new Date();
        
        console.log('[Calendar Agents] Daily analysis complete:', {
          recommendations: insights.recommendations.length,
          strategies: insights.conflictPreventionStrategies.length,
        });

        // Store insights (would be stored in database in full implementation)
      } catch (error) {
        console.error('[Calendar Agents] Error in daily analysis:', error);
      }
    };

    // Calculate time until next 2 AM
    const now = new Date();
    const nextRun = new Date();
    nextRun.setHours(2, 0, 0, 0);
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const msUntilNextRun = nextRun.getTime() - now.getTime();

    // Run immediately if it's close to 2 AM, otherwise schedule
    if (msUntilNextRun < 60 * 60 * 1000) { // Less than 1 hour
      setTimeout(() => {
        runDailyAnalysis();
        // Then schedule for daily
        this.dailyAnalysisInterval = setInterval(runDailyAnalysis, 24 * 60 * 60 * 1000);
      }, msUntilNextRun);
    } else {
      // Schedule for daily at 2 AM
      this.dailyAnalysisInterval = setInterval(runDailyAnalysis, 24 * 60 * 60 * 1000);
    }

    // Run first analysis if it hasn't run today
    if (!this.lastDailyAnalysis || this.lastDailyAnalysis < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      setTimeout(runDailyAnalysis, 5000); // Run after 5 seconds (server startup delay)
    }
  }

  /**
   * Schedule pattern analysis
   */
  private schedulePatternAnalysis(): void {
    const runPatternAnalysis = async () => {
      try {
        console.log('[Calendar Agents] Running pattern analysis...');
        const patterns = await calendarPatternAgent.detectPatterns();
        this.lastPatternAnalysis = new Date();
        
        console.log('[Calendar Agents] Pattern analysis complete:', {
          patternsDetected: patterns.length,
          types: [...new Set(patterns.map(p => p.type))],
        });
      } catch (error) {
        console.error('[Calendar Agents] Error in pattern analysis:', error);
      }
    };

    // Run every 6 hours
    this.patternAnalysisInterval = setInterval(runPatternAnalysis, 6 * 60 * 60 * 1000);

    // Run first analysis after 1 minute
    setTimeout(runPatternAnalysis, 60 * 1000);
  }

  /**
   * Get status of all agents
   */
  async getStatus(): Promise<AgentStatus> {
    const nextDailyRun = this.lastDailyAnalysis
      ? new Date(this.lastDailyAnalysis.getTime() + 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 60 * 60 * 1000); // Default: 1 hour from now

    const nextPatternRun = this.lastPatternAnalysis
      ? new Date(this.lastPatternAnalysis.getTime() + 6 * 60 * 60 * 1000)
      : new Date(Date.now() + 60 * 60 * 1000);

    return {
      realtimeAgent: {
        status: this.isRunning ? 'running' : 'stopped',
        lastActivity: this.realtimeAlerts.length > 0 
          ? this.realtimeAlerts[this.realtimeAlerts.length - 1].detectedAt
          : undefined,
        alertsGenerated: this.realtimeAlerts.length,
      },
      analysisAgent: {
        status: this.isRunning && this.dailyAnalysisInterval ? 'running' : 'stopped',
        lastRun: this.lastDailyAnalysis || undefined,
        nextRun: nextDailyRun,
        insightsGenerated: 0, // Would track from stored insights
      },
      patternAgent: {
        status: this.isRunning && this.patternAnalysisInterval ? 'running' : 'stopped',
        lastRun: this.lastPatternAnalysis || undefined,
        patternsDetected: 0, // Would track from stored patterns
      },
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 10): RealtimeAlert[] {
    return this.realtimeAlerts
      .filter(a => !a.resolved)
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Mark alert as resolved
   */
  resolveAlert(alertId: string): void {
    const alert = this.realtimeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }
}

export const calendarAgentOrchestrator = new CalendarAgentOrchestrator();
