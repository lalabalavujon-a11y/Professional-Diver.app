import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentAnalyticsData {
  success: boolean;
  data: {
    overview: {
      totalUsers: number;
      activeUsers: number;
      totalTracks: number;
      totalLessons: number;
      totalQuizzes: number;
      totalExams: number;
      averageQuizScore: number;
      averageExamScore: number;
      lessonsCompletedToday: number;
      quizzesCompletedToday: number;
      examsCompletedToday: number;
      lastUpdated: string;
    };
    trackProgress: Array<{
      trackId: string;
      trackTitle: string;
      trackSlug: string;
      totalLessons: number;
      totalCompletions: number;
      averageCompletion: number;
      studentsEnrolled: number;
      quizAttempts: number;
      averageQuizScore: number;
    }>;
    topStudents: Array<{
      userId: string;
      userName: string;
      email: string;
      lessonsCompleted: number;
      quizzesCompleted: number;
      averageScore: number;
      lastActivity: string | null;
    }>;
    strugglingStudents: Array<{
      userId: string;
      userName: string;
      email: string;
      lessonsCompleted: number;
      quizzesCompleted: number;
      averageScore: number;
      lastActivity: string | null;
    }>;
    recentActivity: Array<{
      id: string;
      type: "lesson" | "quiz" | "exam" | "srs";
      userId: string;
      userName: string;
      description: string;
      score?: number;
      timestamp: string;
      trackTitle?: string;
    }>;
    srsOverview: {
      activeUsers: number;
      totalDecks: number;
      totalReviews: number;
      passedReviews: number;
      passRate: number;
      period: string;
    };
    examAnalytics: Array<{
      examSlug: string;
      totalAttempts: number;
      passed: number;
      failed: number;
      passRate: number;
      averageScore: number;
    }>;
  };
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return date.toLocaleDateString();
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-100 dark:bg-emerald-900/30";
  if (score >= 60) return "bg-amber-100 dark:bg-amber-900/30";
  return "bg-red-100 dark:bg-red-900/30";
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case "lesson": return <BookOpen className="w-4 h-4 text-blue-600" />;
    case "quiz": return <Target className="w-4 h-4 text-purple-600" />;
    case "exam": return <Award className="w-4 h-4 text-amber-600" />;
    case "srs": return <Brain className="w-4 h-4 text-emerald-600" />;
    default: return <Activity className="w-4 h-4 text-gray-600" />;
  }
}

export default function StudentAnalyticsContainer() {
  const { data: analyticsData, isLoading, error, refetch, isRefetching } = useQuery<StudentAnalyticsData>({
    queryKey: ["/api/admin/student-analytics"],
    queryFn: async () => {
      const response = await fetch("/api/admin/student-analytics");
      if (!response.ok) throw new Error("Failed to fetch student analytics");
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !analyticsData?.success) {
    return (
      <Card className="border-red-200">
        <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <p className="text-sm text-red-600">Failed to load student analytics</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { overview, trackProgress, topStudents, strugglingStudents, recentActivity, srsOverview, examAnalytics } = analyticsData.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
            <GraduationCap className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Student Progress Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Real-time learning progress monitoring
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
            <Activity className="w-3 h-3 mr-1 animate-pulse" />
            Live Data
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="col-span-1">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Total Users</span>
            </div>
            <p className="text-2xl font-bold">{overview.totalUsers}</p>
            <p className="text-xs text-muted-foreground">{overview.activeUsers} active</p>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-muted-foreground">Tracks</span>
            </div>
            <p className="text-2xl font-bold">{overview.totalTracks}</p>
            <p className="text-xs text-muted-foreground">{overview.totalLessons} lessons</p>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Quiz Avg</span>
            </div>
            <p className={cn("text-2xl font-bold", getScoreColor(overview.averageQuizScore))}>
              {overview.averageQuizScore}%
            </p>
            <p className="text-xs text-muted-foreground">{overview.totalQuizzes} quizzes</p>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Exam Avg</span>
            </div>
            <p className={cn("text-2xl font-bold", getScoreColor(overview.averageExamScore))}>
              {overview.averageExamScore}%
            </p>
            <p className="text-xs text-muted-foreground">{overview.totalExams} exams</p>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Today</span>
            </div>
            <p className="text-2xl font-bold">{overview.lessonsCompletedToday}</p>
            <p className="text-xs text-muted-foreground">lessons completed</p>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-4 h-4 text-violet-600" />
              <span className="text-xs text-muted-foreground">SRS</span>
            </div>
            <p className="text-2xl font-bold">{srsOverview.totalReviews}</p>
            <p className="text-xs text-muted-foreground">{srsOverview.passRate}% pass rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="tracks">Tracks</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Performers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Top Performers
                </CardTitle>
                <CardDescription>Students with highest scores</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {topStudents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No student data yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topStudents.map((student, idx) => (
                        <div key={student.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                            idx === 0 ? "bg-amber-100 text-amber-700" :
                            idx === 1 ? "bg-slate-100 text-slate-700" :
                            idx === 2 ? "bg-orange-100 text-orange-700" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{student.userName}</p>
                            <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                          </div>
                          <div className="text-right">
                            <p className={cn("font-bold text-sm", getScoreColor(student.averageScore))}>
                              {student.averageScore}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {student.lessonsCompleted} lessons
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Struggling Students */}
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-amber-600" />
                  Need Attention
                </CardTitle>
                <CardDescription>Students who may need support</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {strugglingStudents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                      <p className="text-sm">All students performing well!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {strugglingStudents.map((student) => (
                        <div key={student.userId} className="flex items-center gap-3 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-900/10">
                          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{student.userName}</p>
                            <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                          </div>
                          <div className="text-right">
                            <p className={cn("font-bold text-sm", getScoreColor(student.averageScore))}>
                              {student.averageScore}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {student.quizzesCompleted} quizzes
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tracks Tab */}
        <TabsContent value="tracks" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Track Progress Overview</CardTitle>
              <CardDescription>Completion rates and engagement by learning track</CardDescription>
            </CardHeader>
            <CardContent>
              {trackProgress.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No track data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trackProgress.map((track) => (
                    <div key={track.trackId} className="space-y-2 p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{track.trackTitle}</h4>
                          <p className="text-xs text-muted-foreground">
                            {track.totalLessons} lessons • {track.studentsEnrolled} students enrolled
                          </p>
                        </div>
                        <Badge variant="outline" className={getScoreBgColor(track.averageQuizScore)}>
                          Quiz Avg: {track.averageQuizScore}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={track.averageCompletion} className="flex-1 h-2" />
                        <span className="text-sm font-medium w-12 text-right">{track.averageCompletion}%</span>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{track.totalCompletions} completions</span>
                        <span>{track.quizAttempts} quiz attempts</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Exam Performance</CardTitle>
              <CardDescription>Pass rates and scores by exam</CardDescription>
            </CardHeader>
            <CardContent>
              {examAnalytics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No exam data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {examAnalytics.map((exam) => (
                    <div key={exam.examSlug} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium capitalize">{exam.examSlug.replace(/-/g, ' ')}</h4>
                        <Badge variant={exam.passRate >= 70 ? "default" : "secondary"}>
                          {exam.passRate}% pass rate
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div className="text-center p-2 rounded bg-muted/50">
                          <p className="font-bold">{exam.totalAttempts}</p>
                          <p className="text-xs text-muted-foreground">Attempts</p>
                        </div>
                        <div className="text-center p-2 rounded bg-emerald-50 dark:bg-emerald-900/20">
                          <p className="font-bold text-emerald-600">{exam.passed}</p>
                          <p className="text-xs text-muted-foreground">Passed</p>
                        </div>
                        <div className="text-center p-2 rounded bg-red-50 dark:bg-red-900/20">
                          <p className="font-bold text-red-600">{exam.failed}</p>
                          <p className="text-xs text-muted-foreground">Failed</p>
                        </div>
                        <div className="text-center p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                          <p className={cn("font-bold", getScoreColor(exam.averageScore))}>{exam.averageScore}%</p>
                          <p className="text-xs text-muted-foreground">Avg Score</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recent Activity Feed
              </CardTitle>
              <CardDescription>Latest student learning activities</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <div className="mt-0.5">
                          <ActivityIcon type={activity.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{activity.userName}</span>
                            <span className="text-muted-foreground"> {activity.description}</span>
                          </p>
                          {activity.trackTitle && (
                            <p className="text-xs text-muted-foreground">{activity.trackTitle}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {activity.score !== undefined && (
                            <p className={cn("text-sm font-medium", getScoreColor(activity.score))}>
                              {activity.score}%
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
