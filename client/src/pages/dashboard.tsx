import { useQuery } from "@tanstack/react-query";
import RoleBasedNavigation from "@/components/role-based-navigation";
import UserStatusBadge from "@/components/user-status-badge";
import WidgetBar from "@/components/widgets/widget-bar";
import { PageHeader, PageSection, StatCard } from "@/components/ui/page-header";
import { LoadingSpinner } from "@/components/ui/loading-states";
import { CheckCircle, AlertTriangle, Flame, BookOpen, BarChart3, Award, FileText } from "lucide-react";
import { Link } from "wouter";

interface UserProgressData {
  lessonProgress: Array<{
    lessonId: string;
    completedAt: number | string;
    score?: number | null;
    timeSpent?: number | null;
  }>;
  quizAttempts: Array<{
    quiz_id: string;
    score: number;
    completed_at: number;
    lesson_id?: string;
    track_id?: string;
  }>;
  examAttempts: Array<{
    exam_slug: string;
    score: number;
    total_questions: number;
    completed_at: number;
  }>;
  trackProgress: Array<{
    track_id: string;
    track_title: string;
    track_slug: string;
    total_lessons: number;
    completed_lessons: number;
    completion_percentage: number;
  }>;
}

export default function Dashboard() {
  // Get current user data to determine role and subscription
  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      // Check for email in localStorage or use demo email
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  // Get user progress data
  const { data: userProgress, isLoading } = useQuery<UserProgressData>({
    queryKey: ["/api/users/current/progress"],
    enabled: !!currentUser,
  });

  // Get exam analytics
  const { data: examAnalytics } = useQuery({
    queryKey: ["/api/analytics/exams"],
  });

  // Calculate stats from real data
  const completedLessons = userProgress?.lessonProgress?.length || 0;
  const totalLessons = userProgress?.trackProgress?.reduce((sum, track) => sum + (track.total_lessons || 0), 0) || 0;
  const quizAttempts = userProgress?.quizAttempts || [];
  const examAttempts = userProgress?.examAttempts || [];
  
  // Calculate quiz average
  const quizScores = quizAttempts.map(q => {
    // Need to calculate percentage - would need total questions from quiz
    return q.score;
  });
  const quizAverage = quizAttempts.length > 0 
    ? Math.round((quizAttempts.reduce((sum, q) => sum + (q.score || 0), 0) / quizAttempts.length) * 10) / 10 
    : 0;

  // Calculate exam average
  const examScores = examAttempts.map(e => (e.score / e.total_questions) * 100);
  const examAverage = examScores.length > 0 
    ? Math.round((examScores.reduce((sum, s) => sum + s, 0) / examScores.length) * 10) / 10 
    : 0;

  // Calculate overall track completion
  const overallCompletion = userProgress?.trackProgress?.length > 0
    ? Math.round(userProgress.trackProgress.reduce((sum, track) => sum + (track.completion_percentage || 0), 0) / userProgress.trackProgress.length)
    : 0;

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-background pt-20" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* User Status Badge */}
        <div className="mb-6">
          <UserStatusBadge 
            role={currentUser?.role || 'USER'}
            subscriptionType={currentUser?.subscriptionType || 'TRIAL'}
            subscriptionDate={currentUser?.subscriptionDate}
            trialExpiresAt={currentUser?.trialExpiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}
            userName={currentUser?.name}
          />
        </div>

        {/* Widget Bar */}
        <WidgetBar />

        {isLoading ? (
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        ) : (
          <>
            <PageHeader
              title="Your Learning Dashboard"
              description="Track your progress and continue your diving education"
              icon={BookOpen}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <StatCard
                title="Lessons Completed"
                value={completedLessons.toString()}
                description={`of ${totalLessons} total`}
                icon={CheckCircle}
                variant="primary"
                data-testid="stat-lessons-completed"
              />
              <StatCard
                title="Quiz Average"
                value={quizAttempts.length > 0 ? `${Math.round(quizAverage)}%` : "N/A"}
                description={`across ${quizAttempts.length} ${quizAttempts.length === 1 ? 'quiz' : 'quizzes'}`}
                icon={BarChart3}
                variant="success"
                data-testid="stat-quiz-average"
              />
              <StatCard
                title="Exam Average"
                value={examAttempts.length > 0 ? `${Math.round(examAverage)}%` : "N/A"}
                description={`across ${examAttempts.length} ${examAttempts.length === 1 ? 'exam' : 'exams'}`}
                icon={Award}
                variant="info"
                data-testid="stat-exam-average"
              />
              <StatCard
                title="Track Completion"
                value={`${overallCompletion}%`}
                description="overall progress"
                icon={FileText}
                variant="warning"
                data-testid="stat-track-completion"
              />
            </div>

            <PageSection
              title="AI Learning Path Suggestions"
              description="Get personalized recommendations powered by AI"
              actions={
                <Link href="/learning-path">
                  <button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors"
                    data-testid="button-ai-suggestions"
                  >
                    Get AI Suggestions
                  </button>
                </Link>
              }
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-success-600" />
                  <span>Personalized recommendations</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-success-600" />
                  <span>Career path guidance</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-success-600" />
                  <span>Learning style analysis</span>
                </div>
              </div>
            </PageSection>

            {/* Track Progress Overview */}
            {userProgress?.trackProgress && userProgress.trackProgress.length > 0 && (
              <PageSection
                title="Track Progress"
                description="Your completion across all learning tracks"
              >
                <div className="space-y-4">
                  {userProgress.trackProgress.slice(0, 5).map((track) => (
                    <div key={track.track_id} className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{track.track_title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {track.completed_lessons} of {track.total_lessons} lessons completed
                          </p>
                        </div>
                        <Link href={`/tracks/${track.track_slug}`}>
                          <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto">
                            Continue
                          </button>
                        </Link>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${Math.min(track.completion_percentage || 0, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {userProgress.trackProgress.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No track progress yet. Start a track to begin tracking your progress!</p>
                      <Link href="/tracks">
                        <button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors">
                          Browse Tracks
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </PageSection>
            )}

            <PageSection
              title="Recent Quiz Results"
              actions={
                <Link href="/analytics">
                  <button className="text-primary hover:text-primary/80 font-medium text-sm" data-testid="button-view-all">
                    View All
                  </button>
                </Link>
              }
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg" data-testid="quiz-result-1">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Respiratory System Quiz</h4>
                      <p className="text-sm text-muted-foreground">2 days ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-success-600">90%</span>
                    <p className="text-sm text-muted-foreground">1st attempt</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg" data-testid="quiz-result-2">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-warning-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-warning-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Gas Laws Fundamentals</h4>
                      <p className="text-sm text-muted-foreground">5 days ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-warning-600">72%</span>
                    <p className="text-sm text-muted-foreground">2nd attempt</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg" data-testid="quiz-result-3">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Pressure Effects Quiz</h4>
                      <p className="text-sm text-muted-foreground">1 week ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-success-600">95%</span>
                    <p className="text-sm text-muted-foreground">1st attempt</p>
                  </div>
                </div>
              </div>
            </PageSection>
          </>
        )}
        </main>
      </div>
    </>
  );
}
