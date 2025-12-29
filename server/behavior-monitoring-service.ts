/**
 * Behavior Monitoring Service
 * 
 * Background agents monitoring daily signals on user behavior including admins
 * Tracks what's working, what's not, and areas needing improvement
 */

import { db } from "./db";
import { 
  userBehaviorEvents, 
  behaviorInsights, 
  behaviorAnalytics,
  users,
  attempts,
  userProgress,
  type UserBehaviorEvent,
  type BehaviorInsight
} from "@shared/schema";
import { eq, and, gte, desc, count, sql } from "drizzle-orm";
import cron from "node-cron";

interface BehaviorSignal {
  eventType: string;
  eventCategory: string;
  eventName: string;
  pagePath?: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  duration?: number;
  performance?: Record<string, any>;
}

interface DailyAnalytics {
  date: string;
  totalEvents: number;
  uniqueUsers: number;
  uniqueAdmins: number;
  pageViews: number;
  errors: number;
  averagePageLoadTime: number;
  mostVisitedPages: Array<{ path: string; count: number }>;
  errorRate: number;
  engagementScore: number;
}

export class BehaviorMonitoringService {
  private static instance: BehaviorMonitoringService;
  private isMonitoring: boolean = false;
  private cronJob: cron.ScheduledTask | null = null;

  private constructor() {}

  static getInstance(): BehaviorMonitoringService {
    if (!BehaviorMonitoringService.instance) {
      BehaviorMonitoringService.instance = new BehaviorMonitoringService();
    }
    return BehaviorMonitoringService.instance;
  }

  /**
   * Start background monitoring agents
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log("⚠️  Behavior monitoring is already running");
      return;
    }

    console.log("🚀 Starting behavior monitoring agents...");

    // Run daily analytics aggregation at 2 AM every day
    this.cronJob = cron.schedule("0 2 * * *", async () => {
      console.log("📊 Running daily behavior analytics aggregation...");
      await this.aggregateDailyAnalytics();
      await this.generateInsights();
    });

    // Run insight generation every 6 hours
    cron.schedule("0 */6 * * *", async () => {
      console.log("🔍 Generating behavior insights...");
      await this.generateInsights();
    });

    // Run performance monitoring every hour
    cron.schedule("0 * * * *", async () => {
      console.log("⚡ Monitoring performance metrics...");
      await this.monitorPerformance();
    });

    this.isMonitoring = true;
    console.log("✅ Behavior monitoring agents started successfully");
  }

  /**
   * Stop monitoring agents
   */
  stopMonitoring(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isMonitoring = false;
    console.log("🛑 Behavior monitoring agents stopped");
  }

  /**
   * Track a user behavior event
   */
  async trackEvent(signal: BehaviorSignal): Promise<void> {
    try {
      await db.insert(userBehaviorEvents).values({
        userId: signal.userId,
        eventType: signal.eventType,
        eventCategory: signal.eventCategory,
        eventName: signal.eventName,
        pagePath: signal.pagePath,
        metadata: signal.metadata || {},
        sessionId: signal.sessionId,
        userAgent: signal.userAgent,
        ipAddress: signal.ipAddress ? this.hashIpAddress(signal.ipAddress) : undefined,
        duration: signal.duration,
        performance: signal.performance || {},
      });

      // Log critical events immediately
      if (signal.eventType === 'error' || signal.eventCategory === 'critical') {
        console.warn(`⚠️  Critical behavior event tracked: ${signal.eventName}`, signal.metadata);
      }
    } catch (error) {
      console.error("❌ Error tracking behavior event:", error);
    }
  }

  /**
   * Aggregate daily analytics
   */
  async aggregateDailyAnalytics(): Promise<DailyAnalytics> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all events from yesterday
      const events = await db
        .select()
        .from(userBehaviorEvents)
        .where(
          and(
            gte(userBehaviorEvents.createdAt, yesterday),
            sql`${userBehaviorEvents.createdAt} < ${today}`
          )
        );

      // Get admin users
      const adminUsers = await db
        .select()
        .from(users)
        .where(
          sql`${users.role} IN ('ADMIN', 'SUPER_ADMIN', 'PARTNER_ADMIN')`
        );

      const adminUserIds = new Set(adminUsers.map(u => u.id));

      // Calculate metrics
      const uniqueUserIds = new Set(events.filter(e => e.userId).map(e => e.userId!));
      const adminEvents = events.filter(e => e.userId && adminUserIds.has(e.userId));
      const uniqueAdminIds = new Set(adminEvents.map(e => e.userId!));

      const pageViews = events.filter(e => e.eventType === 'page_view').length;
      const errors = events.filter(e => e.eventType === 'error').length;
      
      const performanceEvents = events.filter(e => e.performance && Object.keys(e.performance).length > 0);
      const averagePageLoadTime = performanceEvents.length > 0
        ? performanceEvents.reduce((sum, e) => {
            const loadTime = (e.performance as any)?.loadTime || 0;
            return sum + loadTime;
          }, 0) / performanceEvents.length
        : 0;

      // Most visited pages
      const pageCounts: Record<string, number> = {};
      events.forEach(e => {
        if (e.pagePath) {
          pageCounts[e.pagePath] = (pageCounts[e.pagePath] || 0) + 1;
        }
      });
      const mostVisitedPages = Object.entries(pageCounts)
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const errorRate = events.length > 0 ? (errors / events.length) * 100 : 0;

      // Calculate engagement score (based on various factors)
      const engagementScore = this.calculateEngagementScore(events);

      const analytics: DailyAnalytics = {
        date: yesterday.toISOString(),
        totalEvents: events.length,
        uniqueUsers: uniqueUserIds.size,
        uniqueAdmins: uniqueAdminIds.size,
        pageViews,
        errors,
        averagePageLoadTime,
        mostVisitedPages,
        errorRate,
        engagementScore,
      };

      // Store aggregated analytics
      await db.insert(behaviorAnalytics).values({
        date: yesterday,
        metricType: 'daily_summary',
        metricData: analytics,
      });

      console.log("✅ Daily analytics aggregated:", analytics);
      return analytics;
    } catch (error) {
      console.error("❌ Error aggregating daily analytics:", error);
      throw error;
    }
  }

  /**
   * Generate insights from behavior data
   */
  async generateInsights(): Promise<void> {
    try {
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);

      // Get recent events
      const recentEvents = await db
        .select()
        .from(userBehaviorEvents)
        .where(gte(userBehaviorEvents.createdAt, last7Days))
        .orderBy(desc(userBehaviorEvents.createdAt));

      // Get existing active insights
      const existingInsights = await db
        .select()
        .from(behaviorInsights)
        .where(eq(behaviorInsights.status, 'active'));

      const existingInsightTitles = new Set(existingInsights.map(i => i.title));

      const newInsights: Array<Partial<BehaviorInsight>> = [];

      // Analyze error patterns
      const errors = recentEvents.filter(e => e.eventType === 'error');
      if (errors.length > 0) {
        const errorCounts: Record<string, number> = {};
        errors.forEach(e => {
          const errorName = e.eventName || 'unknown';
          errorCounts[errorName] = (errorCounts[errorName] || 0) + 1;
        });

        const topError = Object.entries(errorCounts)
          .sort((a, b) => b[1] - a[1])[0];

        if (topError && topError[1] >= 5) {
          const title = `High Error Rate: ${topError[0]}`;
          if (!existingInsightTitles.has(title)) {
            newInsights.push({
              insightType: 'error',
              category: 'critical_issue',
              title,
              description: `${topError[1]} occurrences of "${topError[0]}" error detected in the last 7 days. This may indicate a usability or technical issue.`,
              severity: topError[1] >= 20 ? 'critical' : 'high',
              affectedUsers: new Set(errors.filter(e => e.eventName === topError[0]).map(e => e.userId)).size,
              impact: 'Users experiencing errors may abandon the platform or report issues.',
              recommendations: [
                'Investigate the root cause of this error',
                'Add better error handling and user feedback',
                'Consider adding user guidance or tooltips',
                'Monitor error trends to prevent escalation'
              ],
              metrics: {
                errorCount: topError[1],
                errorName: topError[0],
                timePeriod: '7 days'
              },
            });
          }
        }
      }

      // Analyze performance issues
      const performanceEvents = recentEvents.filter(e => e.performance && Object.keys(e.performance).length > 0);
      if (performanceEvents.length > 0) {
        const slowPages: Record<string, number[]> = {};
        performanceEvents.forEach(e => {
          if (e.pagePath && e.performance) {
            const loadTime = (e.performance as any)?.loadTime || 0;
            if (!slowPages[e.pagePath]) {
              slowPages[e.pagePath] = [];
            }
            slowPages[e.pagePath].push(loadTime);
          }
        });

        Object.entries(slowPages).forEach(([path, loadTimes]) => {
          const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
          if (avgLoadTime > 3000) { // 3 seconds
            const title = `Slow Page Load: ${path}`;
            if (!existingInsightTitles.has(title)) {
              newInsights.push({
                insightType: 'performance',
                category: 'needs_improvement',
                title,
                description: `Average load time of ${Math.round(avgLoadTime)}ms detected for "${path}". This exceeds the recommended 3-second threshold.`,
                severity: avgLoadTime > 5000 ? 'high' : 'medium',
                affectedUsers: new Set(performanceEvents.filter(e => e.pagePath === path).map(e => e.userId)).size,
                impact: 'Slow page loads negatively impact user experience and may increase bounce rates.',
                recommendations: [
                  'Optimize page resources and assets',
                  'Implement lazy loading for images and content',
                  'Consider code splitting and bundle optimization',
                  'Add loading states to improve perceived performance'
                ],
                metrics: {
                  averageLoadTime: Math.round(avgLoadTime),
                  pagePath: path,
                  sampleSize: loadTimes.length
                },
              });
            }
          }
        });
      }

      // Analyze engagement patterns
      const pageViews = recentEvents.filter(e => e.eventType === 'page_view');
      const uniquePages = new Set(pageViews.map(e => e.pagePath).filter(Boolean));
      const uniqueUsers = new Set(pageViews.map(e => e.userId).filter(Boolean));

      if (pageViews.length > 0) {
        const avgPagesPerUser = pageViews.length / uniqueUsers.size;
        if (avgPagesPerUser < 2) {
          const title = 'Low User Engagement Detected';
          if (!existingInsightTitles.has(title)) {
            newInsights.push({
              insightType: 'engagement',
              category: 'needs_improvement',
              title,
              description: `Users are viewing an average of ${avgPagesPerUser.toFixed(1)} pages per session. This suggests low engagement.`,
              severity: 'medium',
              affectedUsers: uniqueUsers.size,
              impact: 'Low engagement may indicate users are not finding value or are confused by navigation.',
              recommendations: [
                'Improve onboarding and user guidance',
                'Add personalized content recommendations',
                'Enhance navigation and search functionality',
                'Consider adding gamification or progress tracking'
              ],
              metrics: {
                averagePagesPerUser: avgPagesPerUser,
                totalPageViews: pageViews.length,
                uniqueUsers: uniqueUsers.size
              },
            });
          }
        }
      }

      // Analyze what's working well
      const popularPages = this.getPopularPages(recentEvents);
      if (popularPages.length > 0) {
        const topPage = popularPages[0];
        if (topPage.count >= 50) {
          const title = `High Engagement: ${topPage.path}`;
          if (!existingInsightTitles.has(title)) {
            newInsights.push({
              insightType: 'engagement',
              category: 'whats_working',
              title,
              description: `"${topPage.path}" has ${topPage.count} views in the last 7 days, indicating high user interest.`,
              severity: 'low',
              affectedUsers: topPage.uniqueUsers,
              impact: 'This page is performing well and should be used as a model for other pages.',
              recommendations: [
                'Analyze what makes this page successful',
                'Apply similar patterns to other pages',
                'Consider featuring this content more prominently',
                'Use this as a reference for content strategy'
              ],
              metrics: {
                viewCount: topPage.count,
                pagePath: topPage.path,
                uniqueUsers: topPage.uniqueUsers
              },
            });
          }
        }
      }

      // Insert new insights
      if (newInsights.length > 0) {
        await db.insert(behaviorInsights).values(newInsights);
        console.log(`✅ Generated ${newInsights.length} new behavior insights`);
      } else {
        console.log("ℹ️  No new insights generated");
      }
    } catch (error) {
      console.error("❌ Error generating insights:", error);
    }
  }

  /**
   * Monitor performance metrics
   */
  async monitorPerformance(): Promise<void> {
    try {
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      const performanceEvents = await db
        .select()
        .from(userBehaviorEvents)
        .where(
          and(
            gte(userBehaviorEvents.createdAt, last24Hours),
            sql`${userBehaviorEvents.performance} IS NOT NULL`
          )
        );

      if (performanceEvents.length === 0) return;

      const metrics = {
        totalEvents: performanceEvents.length,
        averageLoadTime: 0,
        p95LoadTime: 0,
        slowestPages: [] as Array<{ path: string; loadTime: number }>,
      };

      const loadTimes: number[] = [];
      const pageLoadTimes: Record<string, number[]> = {};

      performanceEvents.forEach(e => {
        if (e.performance && e.pagePath) {
          const loadTime = (e.performance as any)?.loadTime || 0;
          if (loadTime > 0) {
            loadTimes.push(loadTime);
            if (!pageLoadTimes[e.pagePath]) {
              pageLoadTimes[e.pagePath] = [];
            }
            pageLoadTimes[e.pagePath].push(loadTime);
          }
        }
      });

      if (loadTimes.length > 0) {
        loadTimes.sort((a, b) => a - b);
        metrics.averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
        metrics.p95LoadTime = loadTimes[Math.floor(loadTimes.length * 0.95)];

        // Find slowest pages
        Object.entries(pageLoadTimes).forEach(([path, times]) => {
          const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
          metrics.slowestPages.push({ path, loadTime: avgTime });
        });
        metrics.slowestPages.sort((a, b) => b.loadTime - a.loadTime);
        metrics.slowestPages = metrics.slowestPages.slice(0, 5);
      }

      // Store performance metrics
      await db.insert(behaviorAnalytics).values({
        date: new Date(),
        metricType: 'performance',
        metricData: metrics,
      });

      console.log("✅ Performance metrics monitored:", metrics);
    } catch (error) {
      console.error("❌ Error monitoring performance:", error);
    }
  }

  /**
   * Get behavior insights
   */
  async getInsights(limit: number = 50): Promise<BehaviorInsight[]> {
    try {
      return await db
        .select()
        .from(behaviorInsights)
        .orderBy(desc(behaviorInsights.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("❌ Error fetching insights:", error);
      return [];
    }
  }

  /**
   * Get daily analytics summary
   */
  async getDailyAnalytics(days: number = 7): Promise<DailyAnalytics[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const analytics = await db
        .select()
        .from(behaviorAnalytics)
        .where(
          and(
            gte(behaviorAnalytics.date, startDate),
            eq(behaviorAnalytics.metricType, 'daily_summary')
          )
        )
        .orderBy(desc(behaviorAnalytics.date));

      return analytics.map(a => a.metricData as DailyAnalytics);
    } catch (error) {
      console.error("❌ Error fetching daily analytics:", error);
      return [];
    }
  }

  /**
   * Helper: Calculate engagement score
   */
  private calculateEngagementScore(events: UserBehaviorEvent[]): number {
    if (events.length === 0) return 0;

    const pageViews = events.filter(e => e.eventType === 'page_view').length;
    const clicks = events.filter(e => e.eventType === 'click').length;
    const actions = events.filter(e => e.eventType === 'action').length;
    const uniqueUsers = new Set(events.filter(e => e.userId).map(e => e.userId!)).size;
    const avgDuration = events
      .filter(e => e.duration)
      .reduce((sum, e) => sum + (e.duration || 0), 0) / events.filter(e => e.duration).length || 0;

    // Weighted scoring
    const score = (
      (pageViews * 1) +
      (clicks * 2) +
      (actions * 5) +
      (uniqueUsers * 10) +
      (avgDuration / 1000) // Convert to seconds
    ) / 100;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Helper: Get popular pages
   */
  private getPopularPages(events: UserBehaviorEvent[]): Array<{ path: string; count: number; uniqueUsers: number }> {
    const pageCounts: Record<string, { count: number; users: Set<string> }> = {};

    events.forEach(e => {
      if (e.pagePath && e.eventType === 'page_view') {
        if (!pageCounts[e.pagePath]) {
          pageCounts[e.pagePath] = { count: 0, users: new Set() };
        }
        pageCounts[e.pagePath].count++;
        if (e.userId) {
          pageCounts[e.pagePath].users.add(e.userId);
        }
      }
    });

    return Object.entries(pageCounts)
      .map(([path, data]) => ({
        path,
        count: data.count,
        uniqueUsers: data.users.size,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Helper: Hash IP address for privacy
   */
  private hashIpAddress(ip: string): string {
    // Simple hash function for privacy (in production, use crypto)
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      const char = ip.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hashed_${Math.abs(hash)}`;
  }
}

export const behaviorMonitoringService = BehaviorMonitoringService.getInstance();






