/**
 * Real-time Calendar Monitoring Agent
 * Monitors calendar events in real-time and sends alerts for immediate risks
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { unifiedCalendarService } from '../services/unified-calendar-service';
import { calendarConflictResolver } from '../services/calendar-conflict-resolver';
import { langSmithCalendarTracker } from './langsmith-calendar-tracker';
import type { UnifiedCalendarEvent } from '../services/unified-calendar-service';

export interface RealtimeAlert {
  id: string;
  type: 'double_booking' | 'resource_conflict' | 'missing_attendee' | 'timezone_mismatch' | 'sync_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  eventIds: string[];
  detectedAt: Date;
  resolved: boolean;
}

export class CalendarRealtimeAgent {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.3, // Lower temperature for more consistent analysis
      maxTokens: 500,
    });
  }

  /**
   * Monitor new event creation
   */
  async monitorNewEvent(event: UnifiedCalendarEvent): Promise<RealtimeAlert[]> {
    const alerts: RealtimeAlert[] = [];

    try {
      // Get all events in a window around this event
      const windowStart = new Date(event.startTime);
      windowStart.setHours(windowStart.getHours() - 1);
      const windowEnd = new Date(event.endTime);
      windowEnd.setHours(windowEnd.getHours() + 1);

      const nearbyEvents = await unifiedCalendarService.aggregateEvents({
        startDate: windowStart,
        endDate: windowEnd,
      });

      // Check for double-booking
      const overlappingEvents = nearbyEvents.filter((e) => {
        if (e.id === event.id) return false;
        return (
          e.startTime < event.endTime &&
          event.startTime < e.endTime
        );
      });

      if (overlappingEvents.length > 0) {
        alerts.push({
          id: `alert-${Date.now()}-${Math.random()}`,
          type: 'double_booking',
          severity: this.calculateDoubleBookingSeverity(event, overlappingEvents),
          message: `Potential double-booking detected: ${event.title} overlaps with ${overlappingEvents.length} other event(s)`,
          eventIds: [event.id, ...overlappingEvents.map(e => e.id)],
          detectedAt: new Date(),
          resolved: false,
        });
      }

      // Check for resource conflicts
      if (event.location) {
        const locationConflicts = overlappingEvents.filter(e => 
          e.location && e.location.toLowerCase() === event.location!.toLowerCase()
        );

        if (locationConflicts.length > 0) {
          alerts.push({
            id: `alert-${Date.now()}-${Math.random()}`,
            type: 'resource_conflict',
            severity: 'high',
            message: `Resource conflict: ${event.title} and ${locationConflicts.length} other event(s) scheduled at ${event.location} simultaneously`,
            eventIds: [event.id, ...locationConflicts.map(e => e.id)],
            detectedAt: new Date(),
            resolved: false,
          });
        }
      }

      // Use AI to analyze event for other risks
      const aiAnalysis = await this.analyzeEventWithAI(event, nearbyEvents);
      if (aiAnalysis.alerts.length > 0) {
        alerts.push(...aiAnalysis.alerts);
      }

      // Track in LangSmith
      await langSmithCalendarTracker.trackAgentAnalysis(
        'realtime-agent',
        'event_monitoring',
        {
          eventId: event.id,
          alertsGenerated: alerts.length,
          alertTypes: alerts.map(a => a.type),
        },
        0
      );

    } catch (error) {
      console.error('Error in real-time event monitoring:', error);
    }

    return alerts;
  }

  /**
   * Monitor sync failures
   */
  async monitorSyncFailure(source: string, error: string): Promise<RealtimeAlert> {
    const alert: RealtimeAlert = {
      id: `alert-sync-${Date.now()}`,
      type: 'sync_failure',
      severity: 'high',
      message: `Calendar sync failure for ${source}: ${error}`,
      eventIds: [],
      detectedAt: new Date(),
      resolved: false,
    };

    // Track in LangSmith
    await langSmithCalendarTracker.trackSync(
      'system',
      source,
      false,
      0,
      [error],
      0
    );

    return alert;
  }

  /**
   * Analyze event with AI for potential issues
   */
  private async analyzeEventWithAI(
    event: UnifiedCalendarEvent,
    nearbyEvents: UnifiedCalendarEvent[]
  ): Promise<{ alerts: RealtimeAlert[] }> {
    const alerts: RealtimeAlert[] = [];

    try {
      const prompt = `Analyze this calendar event for potential issues:

Event: ${event.title}
Start: ${event.startTime.toISOString()}
End: ${event.endTime.toISOString()}
Location: ${event.location || 'Not specified'}
Attendees: ${event.attendees?.map(a => a.email).join(', ') || 'None'}
Source: ${event.source}

Nearby events: ${nearbyEvents.length}

Identify any immediate risks such as:
- Missing required attendees
- Timezone mismatches
- Unusual scheduling patterns
- Potential conflicts

Respond with JSON format:
{
  "alerts": [
    {
      "type": "missing_attendee" | "timezone_mismatch" | "other",
      "severity": "low" | "medium" | "high",
      "message": "Description of issue"
    }
  ]
}`;

      const response = await this.llm.invoke([
        new SystemMessage('You are a calendar monitoring AI that identifies potential scheduling issues. Respond only with valid JSON.'),
        new HumanMessage(prompt),
      ]);

      const content = response.content as string;
      const analysis = JSON.parse(content);

      if (analysis.alerts && Array.isArray(analysis.alerts)) {
        for (const alertData of analysis.alerts) {
          alerts.push({
            id: `alert-ai-${Date.now()}-${Math.random()}`,
            type: alertData.type === 'missing_attendee' ? 'missing_attendee' :
                  alertData.type === 'timezone_mismatch' ? 'timezone_mismatch' :
                  'double_booking',
            severity: alertData.severity || 'medium',
            message: alertData.message,
            eventIds: [event.id],
            detectedAt: new Date(),
            resolved: false,
          });
        }
      }
    } catch (error) {
      console.error('Error in AI event analysis:', error);
      // Don't throw - AI analysis is supplementary
    }

    return { alerts };
  }

  /**
   * Calculate severity of double-booking
   */
  private calculateDoubleBookingSeverity(
    event: UnifiedCalendarEvent,
    overlappingEvents: UnifiedCalendarEvent[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical if same attendees
    const eventAttendees = new Set(event.attendees?.map(a => a.email.toLowerCase()) || []);
    const hasSameAttendees = overlappingEvents.some(e => 
      e.attendees?.some(a => eventAttendees.has(a.email.toLowerCase()))
    );

    if (hasSameAttendees) {
      return 'critical';
    }

    // High if same location
    if (event.location && overlappingEvents.some(e => e.location === event.location)) {
      return 'high';
    }

    // Medium if significant overlap
    const maxOverlap = Math.max(...overlappingEvents.map(e => {
      const overlapStart = new Date(Math.max(event.startTime.getTime(), e.startTime.getTime()));
      const overlapEnd = new Date(Math.min(event.endTime.getTime(), e.endTime.getTime()));
      const overlapDuration = overlapEnd.getTime() - overlapStart.getTime();
      const eventDuration = event.endTime.getTime() - event.startTime.getTime();
      return overlapDuration / eventDuration;
    }));

    if (maxOverlap > 0.5) {
      return 'high';
    }

    return 'medium';
  }
}

export const calendarRealtimeAgent = new CalendarRealtimeAgent();
