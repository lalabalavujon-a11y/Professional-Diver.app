import { useQuery } from "@tanstack/react-query";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, BookOpen, Award, Clock, Target, Download, Activity } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    created_at: string;
    quiz_title: string;
    lesson_title: string;
    track_title: string;
  }>;
}

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery<QuizAnalytics>({
    queryKey: ["/api/analytics/quiz"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
        <RoleBasedNavigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
        <RoleBasedNavigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              Unable to load analytics data. Please try again later.
            </AlertDescription>
          </Alert>
        </main>
      </div>
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportData = () => {
    const csvContent = [
      ['Track', 'Total Lessons', 'Total Quizzes', 'Total Attempts', 'Average Score'],
      ...analytics.trackStats.map(track => [
        track.title,
        track.total_lessons,
        track.total_quizzes,
        track.total_attempts,
        track.avg_score?.toFixed(2) || '0'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz-analytics.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      <RoleBasedNavigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900" data-testid="text-analytics-title">
              Quiz Analytics Dashboard
            </h1>
            <p className="text-slate-600 mt-2">
              Comprehensive insights into quiz performance and learning outcomes
            </p>
          </div>
          <Button onClick={exportData} className="flex items-center gap-2" data-testid="button-export-analytics">
            <Download className="w-4 h-4" />
            Export Data
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Attempts</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900" data-testid="text-total-attempts">
                {totalAttempts.toLocaleString()}
              </div>
              <p className="text-xs text-blue-700 mt-1">Across all quizzes</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Active Quizzes</CardTitle>
              <BookOpen className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900" data-testid="text-total-quizzes">
                {totalQuizzes}
              </div>
              <p className="text-xs text-green-700 mt-1">Available assessments</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Training Tracks</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900" data-testid="text-total-tracks">
                {totalTracks}
              </div>
              <p className="text-xs text-purple-700 mt-1">Professional programs</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-800">Average Score</CardTitle>
              <Award className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900" data-testid="text-avg-score">
                {overallAvgScore.toFixed(1)}%
              </div>
              <p className="text-xs text-amber-700 mt-1">Platform average</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Quiz Attempts by Track
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trackChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="attempts" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Average Scores by Track
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trackChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgScore" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Distribution and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Attempt Distribution</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Quiz Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {analytics.recentAttempts.length > 0 ? (
                  analytics.recentAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      data-testid={`recent-attempt-${attempt.id}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">
                          {attempt.quiz_title || 'Unknown Quiz'}
                        </div>
                        <div className="text-sm text-slate-600">
                          {attempt.track_title} • {attempt.lesson_title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatTime(attempt.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${getScoreColor(attempt.score, attempt.total_questions)}`}>
                          {attempt.score}/{attempt.total_questions}
                        </div>
                        <div className="text-xs text-slate-500">
                          {Math.round((attempt.score / attempt.total_questions) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No recent quiz attempts found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Track Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Track Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Track</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Lessons</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Quizzes</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Attempts</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Avg Score</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.trackStats.map((track) => (
                    <tr key={track.id} className="border-b hover:bg-gray-50" data-testid={`track-row-${track.id}`}>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{track.title}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{track.total_lessons || 0}</td>
                      <td className="py-3 px-4 text-slate-600">{track.total_quizzes || 0}</td>
                      <td className="py-3 px-4 text-slate-600">{track.total_attempts || 0}</td>
                      <td className="py-3 px-4">
                        <span className={track.avg_score >= 80 ? 'text-green-600' : track.avg_score >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                          {track.avg_score ? track.avg_score.toFixed(1) : '0.0'}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={track.total_attempts > 0 ? "default" : "secondary"}
                          className={track.total_attempts > 0 ? "bg-green-100 text-green-800" : ""}
                        >
                          {track.total_attempts > 0 ? "Active" : "No Attempts"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}