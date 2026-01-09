import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { PageHeader, StatCard, PageSection } from "@/components/ui/page-header";
import { LoadingSpinner, SkeletonCard } from "@/components/ui/loading-states";
import { ErrorState } from "@/components/ui/empty-states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, BookOpen, Award, Clock, Target, Download, Activity, RefreshCw, CalendarIcon, Filter } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface QuizAnalytics {
  quizStats: Array<{
    id: string;
    title: string;
    lesson_title: string;
    track_title: string;
    total_attempts: number;
    avg_score: number;
    max_score: number;
    min_score: number;
  }>;
  trackStats: Array<{
    id: string;
    title: string;
    total_lessons: number;
    total_quizzes: number;
    total_attempts: number;
    avg_score: number;
  }>;
  recentAttempts: Array<{
    id: string;
    score: number;
    total_questions: number;
    created_at: string | number;
    quiz_title: string;
    lesson_title: string;
    track_title: string;
  }>;
  examStats?: Array<{
    slug: string;
    total_attempts: number;
    avg_score: number;
    max_score: number;
    min_score: number;
  }>;
  recentExamAttempts?: Array<{
    id: string;
    slug: string;
    score: number;
    total_questions: number;
    created_at: string | number;
  }>;
}

interface SrsAnalytics {
  now: number;
  deckStats: Array<{
    id: string;
    title: string;
    total_cards: number;
    suspended_cards: number;
    due_now: number;
  }>;
  reviewStats7d: Array<{
    deck_id: string;
    reviews_7d: number;
    passes_7d: number;
  }>;
  recentReviews: Array<{
    id: string;
    deck_id: string;
    deck_title: string;
    card_id: string;
    grade: number;
    reviewed_at: number;
  }>;
}

type DateRange = {
  from: Date;
  to: Date;
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [comparisonPeriod, setComparisonPeriod] = useState<"none" | "previous" | "year">("none");
  const [selectedMetric, setSelectedMetric] = useState<"attempts" | "scores">("attempts");
  
  const { data: analytics, isLoading, refetch, isRefetching } = useQuery<QuizAnalytics>({
    queryKey: ["/api/analytics/quiz"],
    staleTime: 0,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const { data: srsAnalytics } = useQuery<SrsAnalytics>({
    queryKey: ["/api/analytics/srs", "?userId=current-user"],
    staleTime: 0,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    // Export analytics data
    if (format === "csv" && analytics) {
      const csvContent = [
        ['Track', 'Total Attempts', 'Average Score', 'Total Quizzes'],
        ...analytics.trackStats.map(track => [
          track.title,
          track.total_attempts,
          track.avg_score.toFixed(2),
          track.total_quizzes,
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  if (isLoading) {
    return (
      <>
        <RoleBasedNavigation />
        <div className="min-h-screen bg-background" data-sidebar-content="true">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
              <SkeletonCard lines={2} />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonCard key={i} lines={2} />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkeletonCard lines={5} />
                <SkeletonCard lines={5} />
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  if (!analytics) {
    return (
      <>
        <RoleBasedNavigation />
        <div className="min-h-screen bg-background" data-sidebar-content="true">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ErrorState
              title="Unable to load analytics"
              description="Failed to load analytics data. Please try again."
              onRetry={() => refetch()}
            />
          </main>
        </div>
      </>
    );
  }

  // Calculate overview metrics
  const totalAttempts = analytics.trackStats.reduce((sum, track) => sum + (track.total_attempts || 0), 0);
  const totalQuizzes = analytics.trackStats.reduce((sum, track) => sum + (track.total_quizzes || 0), 0);
  const totalTracks = analytics.trackStats.length;
  const overallAvgScore = analytics.trackStats.length > 0 
    ? analytics.trackStats.reduce((sum, track) => sum + (track.avg_score || 0), 0) / analytics.trackStats.length 
    : 0;

  // Prepare chart data
  const trackChartData = analytics.trackStats.map(track => ({
    name: track.title?.substring(0, 20) + (track.title?.length > 20 ? '...' : ''),
    attempts: track.total_attempts || 0,
    avgScore: Math.round((track.avg_score || 0) * 10) / 10,
    quizzes: track.total_quizzes || 0
  }));

  const pieChartData = analytics.trackStats.map((track, index) => ({
    name: track.title?.substring(0, 15) + (track.title?.length > 15 ? '...' : ''),
    value: track.total_attempts || 0,
    color: `hsl(${(index * 60) % 360}, 70%, 50%)`
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  const formatTime = (dateInput: string | number) => {
    const date = new Date(dateInput);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-success-600';
    if (percentage >= 60) return 'text-warning-600';
    return 'text-error-600';
  };

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-background pt-20" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <PageHeader
            title="Analytics Dashboard"
            description="Track your learning progress and performance metrics"
            icon={TrendingUp}
            actions={
              <>
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isRefetching}
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", isRefetching && "animate-spin")} />
                  {isRefetching ? "Refreshing..." : "Refresh"}
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setDateRange({ from: range.from, to: range.to });
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                <Select value={comparisonPeriod} onValueChange={(value: any) => setComparisonPeriod(value)}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Compare" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Comparison</SelectItem>
                    <SelectItem value="previous">Previous Period</SelectItem>
                    <SelectItem value="year">Year Over Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => handleExport("csv")}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </>
            }
          />

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <StatCard
              title="Total Attempts"
              value={totalAttempts}
              icon={Activity}
              variant="primary"
            />
            <StatCard
              title="Average Score"
              value={`${Math.round(overallAvgScore * 10) / 10}%`}
              icon={Target}
              variant="success"
            />
            <StatCard
              title="Total Quizzes"
              value={totalQuizzes}
              icon={BookOpen}
              variant="info"
            />
            <StatCard
              title="Learning Tracks"
              value={totalTracks}
              icon={Award}
              variant="warning"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
            <PageSection title="Quiz Attempts by Track" icon={TrendingUp}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trackChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="attempts" fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
            </PageSection>

            <PageSection title="Average Scores by Track" icon={Activity}>
              <div className="space-y-4">
                <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attempts">Show Attempts</SelectItem>
                    <SelectItem value="scores">Show Scores</SelectItem>
                  </SelectContent>
                </Select>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trackChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgScore" stroke="var(--success-600)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </PageSection>
          </div>

          {/* Distribution and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
            <PageSection title="Attempt Distribution">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </PageSection>

            <PageSection title="Recent Quiz Attempts" icon={Clock} className="lg:col-span-2">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {analytics.recentAttempts.length > 0 ? (
                  analytics.recentAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      data-testid={`recent-attempt-${attempt.id}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          {attempt.quiz_title || 'Unknown Quiz'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {attempt.track_title} • {attempt.lesson_title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(attempt.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${getScoreColor(attempt.score, attempt.total_questions)}`}>
                          {attempt.score}/{attempt.total_questions}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round((attempt.score / attempt.total_questions) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent quiz attempts found
                  </div>
                )}
              </div>
            </PageSection>
          </div>

          {/* Recent Exam Attempts */}
          {analytics.recentExamAttempts && analytics.recentExamAttempts.length > 0 && (
            <PageSection title="Recent Full Exam Attempts" icon={Award} className="mb-6 sm:mb-8">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {analytics.recentExamAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    data-testid={`recent-exam-attempt-${attempt.id}`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{attempt.slug}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(attempt.created_at)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${getScoreColor(attempt.score, attempt.total_questions)}`}>
                        {attempt.score}/{attempt.total_questions}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {attempt.total_questions > 0 ? Math.round((attempt.score / attempt.total_questions) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>
          )}

          {/* Detailed Track Statistics */}
          <PageSection title="Track Performance Details">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-foreground">Track</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Lessons</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Quizzes</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Attempts</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Avg Score</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.trackStats.map((track) => (
                    <tr key={track.id} className="border-b hover:bg-muted/50" data-testid={`track-row-${track.id}`}>
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">{track.title}</div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{track.total_lessons || 0}</td>
                      <td className="py-3 px-4 text-muted-foreground">{track.total_quizzes || 0}</td>
                      <td className="py-3 px-4 text-muted-foreground">{track.total_attempts || 0}</td>
                      <td className="py-3 px-4">
                        <span className={track.avg_score >= 80 ? 'text-success-600' : track.avg_score >= 60 ? 'text-warning-600' : 'text-error-600'}>
                          {track.avg_score ? track.avg_score.toFixed(1) : '0.0'}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={track.total_attempts > 0 ? "default" : "secondary"}
                          className={track.total_attempts > 0 ? "bg-success-100 text-success-800" : ""}
                        >
                          {track.total_attempts > 0 ? "Active" : "No Attempts"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PageSection>

          {/* SRS Analytics */}
          {srsAnalytics && (
            <div className="mt-6 sm:mt-8 space-y-6">
              <PageHeader
                title="SRS Analytics"
                description="Spaced repetition system performance metrics"
                badge={<Badge variant="secondary">Near real-time</Badge>}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PageSection title="Deck Status">
                  {srsAnalytics.deckStats.length > 0 ? (
                    <div className="space-y-3">
                      {srsAnalytics.deckStats.map((d) => (
                        <div key={d.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <div className="font-medium text-foreground">{d.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {d.total_cards} cards • {d.suspended_cards} leeches
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-foreground">{d.due_now} due</div>
                            <div className="text-xs text-muted-foreground">now</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground py-8 text-center">
                      No SRS data yet (create a deck and review a few cards).
                    </div>
                  )}
                </PageSection>

                <PageSection title="Recent SRS Reviews">
                  {srsAnalytics.recentReviews.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {srsAnalytics.recentReviews.map((r) => (
                        <div key={r.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <div className="font-medium text-foreground">{r.deck_title || r.deck_id}</div>
                            <div className="text-xs text-muted-foreground">{formatTime(r.reviewed_at)}</div>
                          </div>
                          <Badge variant={r.grade >= 2 ? "default" : "secondary"}>
                            {r.grade === 0 ? "Again" : r.grade === 1 ? "Hard" : r.grade === 2 ? "Good" : "Easy"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground py-8 text-center">No reviews yet.</div>
                  )}
                </PageSection>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}