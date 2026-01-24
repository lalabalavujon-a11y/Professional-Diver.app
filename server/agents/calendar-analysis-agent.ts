/**
 * Daily Calendar Analysis Agent
 * Performs deep analysis of calendar patterns and generates insights
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { unifiedCalendarService } from '../services/unified-calendar-service';
import { calendarConflictResolver } from '../services/calendar-conflict-resolver';
import { langSmithCalendarTracker } from './langsmith-calendar-tracker';
import { db } from '../db';
import { calendarSyncLogs, calendarConflicts } from '@shared/schema-sqlite';
import { and, gte, lte } from 'drizzle-orm';

export interface DailyAnalysisInsights {
  date: Date;
  patterns: {
    frequentConflictSources: Array<{ source: string; count: number }>;
    syncReliability: { source: string; successRate: number; totalSyncs: number }[];
    calendarUsageTrends: {
      eventsBySource: Record<string, number>;
      busiestTimeSlots: Array<{ hour: number; count: number }>;
      averageEventDuration: number;
    };
    clientBookingPatterns: {
      mostFrequentClients: Array<{ clientId: string; bookingCount: number }>;
      preferredTimeSlots: Array<{ hour: number; count: number }>;
    };
  };
  recommendations: string[];
  conflictPreventionStrategies: string[];
}

export class CalendarAnalysisAgent {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.5,
      maxTokens: 2000,
    });
  }

  /**
   * Run daily analysis
   */
  async runDailyAnalysis(userId?: string): Promise<DailyAnalysisInsights> {
    const startTime = Date.now();
    const analysisDate = new Date();
    
    // Analyze past 24 hours
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date();

    try {
      // Fetch events from past 24 hours
      const events = await unifiedCalendarService.aggregateEvents({
        startDate,
        endDate,
        userId,
      });

      // Detect conflicts
      const conflicts = await calendarConflictResolver.detectConflicts(events);

      // Get sync logs
      const syncLogs = await db
        .select()
        .from(calendarSyncLogs)
        .where(
          and(
            gte(calendarSyncLogs.createdAt, startDate),
            lte(calendarSyncLogs.createdAt, endDate)
          )
        );

      // Get conflict history
      const conflictHistory = await db
        .select()
        .from(calendarConflicts)
        .where(
          and(
            gte(calendarConflicts.detectedAt, startDate),
            lte(calendarConflicts.detectedAt, endDate)
          )
        );

      // Analyze patterns
      const patterns = this.analyzePatterns(events, conflicts, syncLogs, conflictHistory);

      // Generate AI-powered insights
      const aiInsights = await this.generateAIInsights(events, conflicts, patterns);

      const insights: DailyAnalysisInsights = {
        date: analysisDate,
        patterns,
        recommendations: aiInsights.recommendations,
        conflictPreventionStrategies: aiInsights.strategies,
      };

      // Track in LangSmith
      await langSmithCalendarTracker.trackAgentAnalysis(
        'analysis-agent',
        'daily_analysis',
        {
          eventsAnalyzed: events.length,
          conflictsDetected: conflicts.length,
          insightsGenerated: insights.recommendations.length,
        },
        Date.now() - startTime
      );

      return insights;
    } catch (error) {
      console.error('Error in daily calendar analysis:', error);
      throw error;
    }
  }

  /**
   * Analyze patterns from data
   */
  private analyzePatterns(
    events: any[],
    conflicts: any[],
    syncLogs: any[],
    conflictHistory: any[]
  ) {
    // Frequent conflict sources
    const conflictSources = conflictHistory.reduce((acc, conflict) => {
      // Extract source from event IDs (simplified - would need to fetch actual events)
      const source = 'unknown'; // Would need to query events
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sync reliability
    const syncBySource = syncLogs.reduce((acc, log) => {
      if (!acc[log.source]) {
        acc[log.source] = { success: 0, total: 0 };
      }
      acc[log.source].total++;
      if (log.status === 'success') {
        acc[log.source].success++;
      }
      return acc;
    }, {} as Record<string, { success: number; total: number }>);

    const syncReliability = Object.entries(syncBySource).map(([source, stats]) => ({
      source,
      successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
      totalSyncs: stats.total,
    }));

    // Calendar usage trends
    const eventsBySource = events.reduce((acc, event) => {
      acc[event.source] = (acc[event.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Busiest time slots
    const hourCounts = new Map<number, number>();
    events.forEach(event => {
      const hour = event.startTime.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const busiestTimeSlots = Array.from(hourCounts.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Average event duration
    const totalDuration = events.reduce((sum, event) => {
      return sum + (event.endTime.getTime() - event.startTime.getTime());
    }, 0);
    const averageEventDuration = events.length > 0 ? totalDuration / events.length : 0;

    // Client booking patterns
    const clientBookings = events
      .filter(e => e.metadata.clientId)
      .reduce((acc, event) => {
        const clientId = event.metadata.clientId!;
        acc[clientId] = (acc[clientId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const mostFrequentClients = Object.entries(clientBookings)
      .map(([clientId, bookingCount]) => ({ clientId, bookingCount }))
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 10);

    const clientTimeSlots = events
      .filter(e => e.metadata.clientId)
      .reduce((acc, event) => {
        const hour = event.startTime.getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

    const preferredTimeSlots = Object.entries(clientTimeSlots)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      frequentConflictSources: Object.entries(conflictSources)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count),
      syncReliability,
      calendarUsageTrends: {
        eventsBySource,
        busiestTimeSlots,
        averageEventDuration,
      },
      clientBookingPatterns: {
        mostFrequentClients,
        preferredTimeSlots,
      },
    };
  }

  /**
   * Generate AI-powered insights and recommendations
   */
  private async generateAIInsights(
    events: any[],
    conflicts: any[],
    patterns: any
  ): Promise<{ recommendations: string[]; strategies: string[] }> {
    try {
      const prompt = `Analyze this calendar data and provide insights:

Events analyzed: ${events.length}
Conflicts detected: ${conflicts.length}
Sync reliability: ${JSON.stringify(patterns.syncReliability)}
Busiest time slots: ${JSON.stringify(patterns.calendarUsageTrends.busiestTimeSlots)}

Provide:
1. Optimization recommendations (3-5 specific, actionable items)
2. Conflict prevention strategies (3-5 strategies)

Respond in JSON format:
{
  "recommendations": ["recommendation1", "recommendation2", ...],
  "strategies": ["strategy1", "strategy2", ...]
}`;

      const response = await this.llm.invoke([
        new SystemMessage('You are a calendar optimization AI. Analyze patterns and provide actionable recommendations. Respond only with valid JSON.'),
        new HumanMessage(prompt),
      ]);

      const content = response.content as string;
      const analysis = JSON.parse(content);

      return {
        recommendations: analysis.recommendations || [],
        strategies: analysis.strategies || [],
      };
    } catch (error) {
      console.error('Error generating AI insights:', error);
      // Return default recommendations
      return {
        recommendations: [
          'Monitor sync reliability and address failing sources',
          'Review conflict patterns to identify root causes',
          'Optimize scheduling based on busiest time slots',
        ],
        strategies: [
          'Implement automatic conflict detection before event creation',
          'Set up alerts for high-severity conflicts',
          'Regular sync health checks',
        ],
      };
    }
  }
}

export const calendarAnalysisAgent = new CalendarAnalysisAgent();
