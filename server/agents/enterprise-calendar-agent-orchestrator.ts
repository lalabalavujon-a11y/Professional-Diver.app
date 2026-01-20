/**
 * Enterprise Calendar Agent Orchestrator
 * Per-user AI agent orchestration for Enterprise users
 * Isolated monitoring per user with privacy guarantees
 */

import { calendarRealtimeAgent } from './calendar-realtime-agent';
import { calendarAnalysisAgent } from './calendar-analysis-agent';
import { calendarPatternAgent } from './calendar-pattern-agent';
import { langSmithCalendarTracker } from './langsmith-calendar-tracker';
import { unifiedCalendarService } from '../services/unified-calendar-service';
import type { UnifiedCalendarEvent } from '../services/unified-calendar-service';
import type { RealtimeAlert } from './calendar-realtime-agent';

export interface EnterpriseAgentStatus {
  userId: string;
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

class EnterpriseCalendarAgentOrchestrator {
  private userAgents = new Map<string, {
    realtimeAlerts: RealtimeAlert[];
    lastDailyAnalysis: Date | null;
    lastPatternAnalysis: Date | null;
    dailyAnalysisInterval: NodeJS.Timeout | null;
    patternAnalysisInterval: NodeJS.Timeout | null;
  }>();

  /**
   * Start agents for a specific user
   */
  startUserAgents(userId: string): void {
    if (this.userAgents.has(userId)) {
      console.log(`[Enterprise Agents] Agents already running for user ${userId}`);
      return;
    }

    console.log(`[Enterprise Agents] Starting agents for user ${userId}`);

    const userAgentState = {
      realtimeAlerts: [],
      lastDailyAnalysis: null,
      lastPatternAnalysis: null,
      dailyAnalysisInterval: null,
      patternAnalysisInterval: null,
    };

    this.userAgents.set(userId, userAgentState);

    // Schedule daily analysis (runs at 2 AM daily, per user)
    this.scheduleDailyAnalysis(userId);

    // Schedule pattern analysis (runs every 6 hours, per user)
    this.schedulePatternAnalysis(userId);
  }

  /**
   * Stop agents for a specific user
   */
  stopUserAgents(userId: string): void {
    const userState = this.userAgents.get(userId);
    if (!userState) {
      return;
    }

    if (userState.dailyAnalysisInterval) {
      clearInterval(userState.dailyAnalysisInterval);
    }

    if (userState.patternAnalysisInterval) {
      clearInterval(userState.patternAnalysisInterval);
    }

    this.userAgents.delete(userId);
    console.log(`[Enterprise Agents] Stopped agents for user ${userId}`);
  }

  /**
   * Handle new event for a specific user
   */
  async handleNewEvent(userId: string, event: UnifiedCalendarEvent): Promise<RealtimeAlert[]> {
    try {
      const alerts = await calendarRealtimeAgent.monitorNewEvent(event);
      
      const userState = this.userAgents.get(userId);
      if (userState) {
        userState.realtimeAlerts.push(...alerts);
        
        // Keep only last 100 alerts per user
        if (userState.realtimeAlerts.length > 100) {
          userState.realtimeAlerts = userState.realtimeAlerts.slice(-100);
        }
      }

      // Track in LangSmith with user context
      await langSmithCalendarTracker.trackAgentAnalysis(
        'enterprise-realtime-agent',
        'event_monitoring',
        {
          userId,
          eventId: event.id,
          alertsGenerated: alerts.length,
          alertTypes: alerts.map(a => a.type),
        },
        0
      );

      return alerts;
    } catch (error) {
      console.error(`[Enterprise Agents] Error handling new event for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Schedule daily analysis for a user
   */
  private scheduleDailyAnalysis(userId: string): void {
    const runDailyAnalysis = async () => {
      try {
        console.log(`[Enterprise Agents] Running daily analysis for user ${userId}...`);
        const insights = await calendarAnalysisAgent.runDailyAnalysis(userId);
        
        const userState = this.userAgents.get(userId);
        if (userState) {
          userState.lastDailyAnalysis = new Date();
        }
        
        console.log(`[Enterprise Agents] Daily analysis complete for user ${userId}:`, {
          recommendations: insights.recommendations.length,
          strategies: insights.conflictPreventionStrategies.length,
        });
      } catch (error) {
        console.error(`[Enterprise Agents] Error in daily analysis for user ${userId}:`, error);
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

    const userState = this.userAgents.get(userId);
    if (!userState) return;

    // Run immediately if it's close to 2 AM, otherwise schedule
    if (msUntilNextRun < 60 * 60 * 1000) {
      setTimeout(() => {
        runDailyAnalysis();
        userState.dailyAnalysisInterval = setInterval(runDailyAnalysis, 24 * 60 * 60 * 1000);
      }, msUntilNextRun);
    } else {
      userState.dailyAnalysisInterval = setInterval(runDailyAnalysis, 24 * 60 * 60 * 1000);
    }

    // Run first analysis if it hasn't run today
    if (!userState.lastDailyAnalysis || userState.lastDailyAnalysis < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      setTimeout(runDailyAnalysis, 5000);
    }
  }

  /**
   * Schedule pattern analysis for a user
   */
  private schedulePatternAnalysis(userId: string): void {
    const runPatternAnalysis = async () => {
      try {
        console.log(`[Enterprise Agents] Running pattern analysis for user ${userId}...`);
        const patterns = await calendarPatternAgent.detectPatterns(userId);
        
        const userState = this.userAgents.get(userId);
        if (userState) {
          userState.lastPatternAnalysis = new Date();
        }
        
        console.log(`[Enterprise Agents] Pattern analysis complete for user ${userId}:`, {
          patternsDetected: patterns.length,
          types: [...new Set(patterns.map(p => p.type))],
        });
      } catch (error) {
        console.error(`[Enterprise Agents] Error in pattern analysis for user ${userId}:`, error);
      }
    };

    const userState = this.userAgents.get(userId);
    if (!userState) return;

    // Run every 6 hours
    userState.patternAnalysisInterval = setInterval(runPatternAnalysis, 6 * 60 * 60 * 1000);

    // Run first analysis after 1 minute
    setTimeout(runPatternAnalysis, 60 * 1000);
  }

  /**
   * Get status of agents for a user
   */
  async getStatus(userId: string): Promise<EnterpriseAgentStatus | null> {
    const userState = this.userAgents.get(userId);
    if (!userState) {
      return null;
    }

    const nextDailyRun = userState.lastDailyAnalysis
      ? new Date(userState.lastDailyAnalysis.getTime() + 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 60 * 60 * 1000);

    const nextPatternRun = userState.lastPatternAnalysis
      ? new Date(userState.lastPatternAnalysis.getTime() + 6 * 60 * 60 * 1000)
      : new Date(Date.now() + 60 * 60 * 1000);

    return {
      userId,
      realtimeAgent: {
        status: 'running',
        lastActivity: userState.realtimeAlerts.length > 0 
          ? userState.realtimeAlerts[userState.realtimeAlerts.length - 1].detectedAt
          : undefined,
        alertsGenerated: userState.realtimeAlerts.length,
      },
      analysisAgent: {
        status: userState.dailyAnalysisInterval ? 'running' : 'stopped',
        lastRun: userState.lastDailyAnalysis || undefined,
        nextRun: nextDailyRun,
        insightsGenerated: 0, // Would track from stored insights
      },
      patternAgent: {
        status: userState.patternAnalysisInterval ? 'running' : 'stopped',
        lastRun: userState.lastPatternAnalysis || undefined,
        patternsDetected: 0, // Would track from stored patterns
      },
    };
  }

  /**
   * Get recent alerts for a user
   */
  getRecentAlerts(userId: string, limit: number = 10): RealtimeAlert[] {
    const userState = this.userAgents.get(userId);
    if (!userState) {
      return [];
    }

    return userState.realtimeAlerts
      .filter(a => !a.resolved)
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Mark alert as resolved for a user
   */
  resolveAlert(userId: string, alertId: string): void {
    const userState = this.userAgents.get(userId);
    if (!userState) {
      return;
    }

    const alert = userState.realtimeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Initialize agents for all Enterprise users (called on server startup)
   */
  async initializeAllEnterpriseUsers(): Promise<void> {
    try {
      const { db } = await import('../db');
      const { users } = await import('@shared/schema-sqlite');
      const { eq } = await import('drizzle-orm');

      // Get all Enterprise users
      const enterpriseUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, 'ENTERPRISE'));

      for (const user of enterpriseUsers) {
        this.startUserAgents(user.id);
      }

      console.log(`[Enterprise Agents] Initialized agents for ${enterpriseUsers.length} Enterprise users`);
    } catch (error) {
      console.error('[Enterprise Agents] Error initializing Enterprise users:', error);
    }
  }
}

export const enterpriseCalendarAgentOrchestrator = new EnterpriseCalendarAgentOrchestrator();
