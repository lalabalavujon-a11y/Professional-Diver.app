/**
 * Calendar Pattern Detection Agent
 * Continuously analyzes patterns and learns from LangSmith data
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Client as LangSmithClient } from 'langsmith';
import { unifiedCalendarService } from '../services/unified-calendar-service';
import { calendarConflictResolver } from '../services/calendar-conflict-resolver';
import { langSmithCalendarTracker } from './langsmith-calendar-tracker';
import { db } from '../db';
import { calendarConflicts } from '@shared/schema-sqlite';
import { eq, isNotNull } from 'drizzle-orm';

export interface DetectedPattern {
  type: 'recurring_event' | 'booking_pattern' | 'peak_usage' | 'client_behavior' | 'conflict_pattern';
  description: string;
  confidence: number; // 0-1
  data: any;
  detectedAt: Date;
}

export class CalendarPatternAgent {
  private llm: ChatOpenAI;
  private langsmithClient: LangSmithClient | null = null;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.4,
      maxTokens: 1500,
    });

    if (process.env.LANGSMITH_API_KEY) {
      this.langsmithClient = new LangSmithClient({
        apiKey: process.env.LANGSMITH_API_KEY,
      });
    }
  }

  /**
   * Detect patterns in calendar data
   */
  async detectPatterns(userId?: string, dateRange?: { start: Date; end: Date }): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];

    try {
      const startDate = dateRange?.start || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Last 90 days
      const endDate = dateRange?.end || new Date();

      // Fetch events
      const events = await unifiedCalendarService.aggregateEvents({
        startDate,
        endDate,
        userId,
      });

      // Detect recurring events
      const recurringPatterns = this.detectRecurringEvents(events);
      patterns.push(...recurringPatterns);

      // Detect booking patterns
      const bookingPatterns = this.detectBookingPatterns(events);
      patterns.push(...bookingPatterns);

      // Detect peak usage
      const peakPatterns = this.detectPeakUsage(events);
      patterns.push(...peakPatterns);

      // Detect client behavior patterns
      const clientPatterns = await this.detectClientBehaviorPatterns(events);
      patterns.push(...clientPatterns);

      // Learn from LangSmith conflict resolution data
      const conflictPatterns = await this.learnFromConflictResolutions();
      patterns.push(...conflictPatterns);

      // Track in LangSmith
      await langSmithCalendarTracker.trackAgentAnalysis(
        'pattern-agent',
        'pattern_detection',
        {
          patternsDetected: patterns.length,
          patternTypes: [...new Set(patterns.map(p => p.type))],
        },
        0
      );

    } catch (error) {
      console.error('Error detecting calendar patterns:', error);
    }

    return patterns;
  }

  /**
   * Detect recurring events
   */
  private detectRecurringEvents(events: any[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const eventGroups = new Map<string, any[]>();

    // Group events by title similarity
    events.forEach(event => {
      const normalizedTitle = event.title.toLowerCase().trim();
      let found = false;
      
      for (const [key, group] of eventGroups.entries()) {
        if (this.calculateStringSimilarity(key, normalizedTitle) > 0.7) {
          group.push(event);
          found = true;
          break;
        }
      }

      if (!found) {
        eventGroups.set(normalizedTitle, [event]);
      }
    });

    // Check for recurring patterns in groups
    for (const [title, group] of eventGroups.entries()) {
      if (group.length < 3) continue; // Need at least 3 occurrences

      // Check if events occur at regular intervals
      const intervals = this.calculateIntervals(group);
      if (this.isRegularPattern(intervals)) {
        patterns.push({
          type: 'recurring_event',
          description: `Recurring event detected: "${title}" (${group.length} occurrences)`,
          confidence: Math.min(group.length / 10, 0.95), // Higher confidence with more occurrences
          data: {
            title,
            occurrences: group.length,
            averageInterval: intervals.reduce((a, b) => a + b, 0) / intervals.length,
            events: group.map(e => ({ id: e.id, startTime: e.startTime })),
          },
          detectedAt: new Date(),
        });
      }
    }

    return patterns;
  }

  /**
   * Detect booking patterns
   */
  private detectBookingPatterns(events: any[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    // Analyze time-of-day patterns
    const hourDistribution = new Map<number, number>();
    events.forEach(event => {
      const hour = event.startTime.getHours();
      hourDistribution.set(hour, (hourDistribution.get(hour) || 0) + 1);
    });

    // Find peak booking hours
    const sortedHours = Array.from(hourDistribution.entries())
      .sort((a, b) => b[1] - a[1]);

    if (sortedHours.length > 0) {
      const peakHour = sortedHours[0];
      const totalEvents = events.length;
      const peakPercentage = (peakHour[1] / totalEvents) * 100;

      if (peakPercentage > 20) { // More than 20% of events at this hour
        patterns.push({
          type: 'booking_pattern',
          description: `Peak booking hour: ${peakHour[0]}:00 (${peakPercentage.toFixed(1)}% of events)`,
          confidence: Math.min(peakPercentage / 50, 0.9),
          data: {
            peakHour: peakHour[0],
            percentage: peakPercentage,
            eventCount: peakHour[1],
          },
          detectedAt: new Date(),
        });
      }
    }

    // Analyze day-of-week patterns
    const dayDistribution = new Map<number, number>();
    events.forEach(event => {
      const day = event.startTime.getDay();
      dayDistribution.set(day, (dayDistribution.get(day) || 0) + 1);
    });

    return patterns;
  }

  /**
   * Detect peak usage periods
   */
  private detectPeakUsage(events: any[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    // Group events by week
    const weeklyCounts = new Map<string, number>();
    events.forEach(event => {
      const weekKey = this.getWeekKey(event.startTime);
      weeklyCounts.set(weekKey, (weeklyCounts.get(weekKey) || 0) + 1);
    });

    const sortedWeeks = Array.from(weeklyCounts.entries())
      .sort((a, b) => b[1] - a[1]);

    if (sortedWeeks.length > 0) {
      const peakWeek = sortedWeeks[0];
      const average = Array.from(weeklyCounts.values()).reduce((a, b) => a + b, 0) / weeklyCounts.size;

      if (peakWeek[1] > average * 1.5) { // 50% above average
        patterns.push({
          type: 'peak_usage',
          description: `Peak usage week: ${peakWeek[0]} (${peakWeek[1]} events, ${(peakWeek[1] / average).toFixed(1)}x average)`,
          confidence: Math.min((peakWeek[1] / average) / 3, 0.9),
          data: {
            week: peakWeek[0],
            eventCount: peakWeek[1],
            averageCount: average,
          },
          detectedAt: new Date(),
        });
      }
    }

    return patterns;
  }

  /**
   * Detect client behavior patterns using AI
   */
  private async detectClientBehaviorPatterns(events: any[]): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];

    try {
      // Group events by client
      const clientEvents = new Map<string, any[]>();
      events.forEach(event => {
        if (event.metadata.clientId) {
          const clientId = event.metadata.clientId;
          if (!clientEvents.has(clientId)) {
            clientEvents.set(clientId, []);
          }
          clientEvents.get(clientId)!.push(event);
        }
      });

      // Analyze clients with multiple bookings
      for (const [clientId, clientEventList] of clientEvents.entries()) {
        if (clientEventList.length < 3) continue; // Need at least 3 bookings

        const prompt = `Analyze this client's booking behavior:

Client ID: ${clientId}
Total bookings: ${clientEventList.length}
Booking times: ${clientEventList.map(e => e.startTime.toISOString()).join(', ')}
Sources: ${clientEventList.map(e => e.source).join(', ')}

Identify patterns such as:
- Preferred booking times
- Booking frequency
- Source preferences
- Any unusual patterns

Respond with JSON:
{
  "pattern": "description of pattern",
  "confidence": 0.0-1.0,
  "insights": ["insight1", "insight2"]
}`;

        const response = await this.llm.invoke([
          new SystemMessage('You are a calendar pattern analysis AI. Analyze client booking behavior. Respond only with valid JSON.'),
          new HumanMessage(prompt),
        ]);

        const content = response.content as string;
        const analysis = JSON.parse(content);

        if (analysis.pattern) {
          patterns.push({
            type: 'client_behavior',
            description: `Client ${clientId}: ${analysis.pattern}`,
            confidence: analysis.confidence || 0.7,
            data: {
              clientId,
              bookingCount: clientEventList.length,
              insights: analysis.insights || [],
            },
            detectedAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error('Error detecting client behavior patterns:', error);
    }

    return patterns;
  }

  /**
   * Learn from conflict resolutions in LangSmith
   */
  private async learnFromConflictResolutions(): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];

    try {
      if (!this.langsmithClient) {
        return patterns;
      }

      // Get resolved conflicts from database
      const resolvedConflicts = await db
        .select()
        .from(calendarConflicts)
        .where(isNotNull(calendarConflicts.resolvedAt))
        .limit(100);

      if (resolvedConflicts.length === 0) {
        return patterns;
      }

      // Analyze resolution patterns
      const resolutionCounts = resolvedConflicts.reduce((acc, conflict) => {
        const resolution = conflict.resolution || 'unknown';
        acc[resolution] = (acc[resolution] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostCommonResolution = Object.entries(resolutionCounts)
        .sort((a, b) => b[1] - a[1])[0];

      if (mostCommonResolution) {
        patterns.push({
          type: 'conflict_pattern',
          description: `Most common conflict resolution: ${mostCommonResolution[0]} (${mostCommonResolution[1]} times)`,
          confidence: Math.min(mostCommonResolution[1] / resolvedConflicts.length, 0.9),
          data: {
            resolution: mostCommonResolution[0],
            count: mostCommonResolution[1],
            totalResolved: resolvedConflicts.length,
          },
          detectedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error learning from conflict resolutions:', error);
    }

    return patterns;
  }

  /**
   * Helper: Calculate intervals between events
   */
  private calculateIntervals(events: any[]): number[] {
    const sorted = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    const intervals: number[] = [];

    for (let i = 1; i < sorted.length; i++) {
      const interval = sorted[i].startTime.getTime() - sorted[i - 1].startTime.getTime();
      intervals.push(interval);
    }

    return intervals;
  }

  /**
   * Helper: Check if intervals form a regular pattern
   */
  private isRegularPattern(intervals: number[]): boolean {
    if (intervals.length < 2) return false;

    // Check if intervals are similar (within 20% variance)
    const average = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => {
      return sum + Math.abs(interval - average) / average;
    }, 0) / intervals.length;

    return variance < 0.2; // Less than 20% variance
  }

  /**
   * Helper: Calculate string similarity
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Helper: Get week key for grouping
   */
  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week}`;
  }

  /**
   * Helper: Get week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}

export const calendarPatternAgent = new CalendarPatternAgent();
