/**
 * Behavior Analytics Dashboard Component
 * 
 * Displays behavior monitoring insights, analytics, and recommendations
 * Visible to Super Admin and Partner Admin (with toggle access)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Zap,
  BarChart3,
  Eye,
  Target,
  Lightbulb,
  XCircle,
} from "lucide-react";

interface BehaviorInsight {
  id: string;
  insightType: string;
  category: string;
  title: string;
  description: string;
  severity: string;
  affectedUsers: number;
  impact: string;
  recommendations: string[];
  metrics: Record<string, any>;
  status: string;
  createdAt: string;
  resolvedAt?: string;
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

interface BehaviorAnalyticsData {
  insights: BehaviorInsight[];
  analytics: DailyAnalytics[];
}

export default function BehaviorAnalyticsDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user email
  const userEmail = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';

  // Fetch behavior insights
  const { data: insightsData, isLoading: isLoadingInsights } = useQuery<{ insights: BehaviorInsight[] }>({
    queryKey: ["/api/admin/behavior-analytics/insights"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/behavior-analytics/insights?email=${encodeURIComponent(userEmail)}`);
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Analytics access not granted");
        }
        throw new Error('Failed to fetch behavior insights');
      }
      return response.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Fetch daily analytics
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery<{ analytics: DailyAnalytics[] }>({
    queryKey: ["/api/admin/behavior-analytics/daily"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/behavior-analytics/daily?email=${encodeURIComponent(userEmail)}&days=7`);
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Analytics access not granted");
        }
        throw new Error('Failed to fetch daily analytics');
      }
      return response.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Resolve insight mutation
  const resolveInsightMutation = useMutation({
    mutationFn: async (insightId: string) => {
      const response = await fetch(
        `/api/admin/behavior-analytics/insights/${insightId}/resolve?email=${encodeURIComponent(userEmail)}`,
        { method: 'PUT' }
      );
      if (!response.ok) throw new Error('Failed to resolve insight');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/behavior-analytics/insights"] });
      toast({
        title: "Success",
        description: "Insight resolved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resolve insight",
        variant: "destructive",
      });
    },
  });

  const insights = insightsData?.insights || [];
  const analytics = analyticsData?.analytics || [];

  // Categorize insights
  const whatsWorking = insights.filter(i => i.category === 'whats_working' && i.status === 'active');
  const needsImprovement = insights.filter(i => i.category === 'needs_improvement' && i.status === 'active');
  const criticalIssues = insights.filter(i => i.category === 'critical_issue' && i.status === 'active');
  const opportunities = insights.filter(i => i.category === 'opportunity' && i.status === 'active');

  // Calculate summary stats
  const totalInsights = insights.length;
  const activeInsights = insights.filter(i => i.status === 'active').length;
  const resolvedInsights = insights.filter(i => i.status === 'resolved').length;
  const criticalCount = criticalIssues.length;

  // Latest analytics summary
  const latestAnalytics = analytics.length > 0 ? analytics[0] : null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'whats_working':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'needs_improvement':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical_issue':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'opportunity':
        return <Lightbulb className="w-5 h-5 text-blue-600" />;
      default:
        return <BarChart3 className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isLoadingInsights || isLoadingAnalytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading behavior analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalInsights}</div>
            <p className="text-xs text-slate-500 mt-1">
              {activeInsights} active, {resolvedInsights} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            <p className="text-xs text-slate-500 mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>

        {latestAnalytics && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Daily Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{latestAnalytics.uniqueUsers}</div>
                <p className="text-xs text-slate-500 mt-1">
                  {latestAnalytics.uniqueAdmins} admins
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Engagement Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{latestAnalytics.engagementScore}</div>
                <p className="text-xs text-slate-500 mt-1">Out of 100</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Insights Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Insights ({insights.length})</TabsTrigger>
          <TabsTrigger value="critical">Critical ({criticalIssues.length})</TabsTrigger>
          <TabsTrigger value="improvements">Needs Improvement ({needsImprovement.length})</TabsTrigger>
          <TabsTrigger value="working">What's Working ({whatsWorking.length})</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities ({opportunities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600">No insights available yet. Monitoring agents are collecting data...</p>
              </CardContent>
            </Card>
          ) : (
            insights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onResolve={() => resolveInsightMutation.mutate(insight.id)}
                getSeverityColor={getSeverityColor}
                getCategoryIcon={getCategoryIcon}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="critical" className="space-y-4">
          {criticalIssues.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <p className="text-slate-600">No critical issues detected. Great job!</p>
              </CardContent>
            </Card>
          ) : (
            criticalIssues.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onResolve={() => resolveInsightMutation.mutate(insight.id)}
                getSeverityColor={getSeverityColor}
                getCategoryIcon={getCategoryIcon}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="improvements" className="space-y-4">
          {needsImprovement.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-600">No improvement areas identified.</p>
              </CardContent>
            </Card>
          ) : (
            needsImprovement.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onResolve={() => resolveInsightMutation.mutate(insight.id)}
                getSeverityColor={getSeverityColor}
                getCategoryIcon={getCategoryIcon}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="working" className="space-y-4">
          {whatsWorking.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-600">No success patterns identified yet.</p>
              </CardContent>
            </Card>
          ) : (
            whatsWorking.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onResolve={() => resolveInsightMutation.mutate(insight.id)}
                getSeverityColor={getSeverityColor}
                getCategoryIcon={getCategoryIcon}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          {opportunities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-600">No opportunities identified yet.</p>
              </CardContent>
            </Card>
          ) : (
            opportunities.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onResolve={() => resolveInsightMutation.mutate(insight.id)}
                getSeverityColor={getSeverityColor}
                getCategoryIcon={getCategoryIcon}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Daily Analytics Chart */}
      {analytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Analytics (Last 7 Days)</CardTitle>
            <CardDescription>Platform usage and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.map((day, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900">
                      {new Date(day.date).toLocaleDateString()}
                    </span>
                    <Badge variant="outline">{day.engagementScore} Engagement</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Users:</span>
                      <span className="ml-2 font-medium">{day.uniqueUsers}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Page Views:</span>
                      <span className="ml-2 font-medium">{day.pageViews}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Errors:</span>
                      <span className={`ml-2 font-medium ${day.errors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {day.errors}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Avg Load:</span>
                      <span className="ml-2 font-medium">{Math.round(day.averagePageLoadTime)}ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface InsightCardProps {
  insight: BehaviorInsight;
  onResolve: () => void;
  getSeverityColor: (severity: string) => string;
  getCategoryIcon: (category: string) => React.ReactNode;
}

function InsightCard({ insight, onResolve, getSeverityColor, getCategoryIcon }: InsightCardProps) {
  return (
    <Card className={`border-l-4 ${getSeverityColor(insight.severity).split(' ')[2]}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {getCategoryIcon(insight.category)}
            <div className="flex-1">
              <CardTitle className="text-lg">{insight.title}</CardTitle>
              <CardDescription className="mt-1">{insight.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getSeverityColor(insight.severity)}>
              {insight.severity}
            </Badge>
            {insight.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onResolve}
              >
                Resolve
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insight.impact && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Impact:</p>
              <p className="text-sm text-slate-600">{insight.impact}</p>
            </div>
          )}

          {insight.recommendations && insight.recommendations.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Recommendations:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                {insight.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center space-x-4 text-xs text-slate-500">
            <span className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {insight.affectedUsers} users affected
            </span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(insight.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}






