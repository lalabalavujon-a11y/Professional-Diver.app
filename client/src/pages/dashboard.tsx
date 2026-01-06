import { useQuery } from "@tanstack/react-query";
import RoleBasedNavigation from "@/components/role-based-navigation";
import UserStatusBadge from "@/components/user-status-badge";
import WidgetBar from "@/components/widgets/widget-bar";
import { PageHeader, PageSection, StatCard } from "@/components/ui/page-header";
import { LoadingSpinner } from "@/components/ui/loading-states";
import { CheckCircle, AlertTriangle, Flame, BookOpen, BarChart3 } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: userProgress, isLoading } = useQuery({
    queryKey: ["/api/users/current/progress"],
  });

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

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-background" data-sidebar-content="true">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <StatCard
                title="Lessons Completed"
                value="8"
                description="of 12 total"
                icon={CheckCircle}
                variant="primary"
                data-testid="stat-lessons-completed"
              />
              <StatCard
                title="Quiz Average"
                value="87%"
                description="across 5 quizzes"
                icon={BarChart3}
                variant="success"
                data-testid="stat-quiz-average"
              />
              <StatCard
                title="Study Streak"
                value="12"
                description="days active"
                icon={Flame}
                variant="warning"
                data-testid="stat-study-streak"
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

            <PageSection
              title="Continue Learning"
              description="3 of 5 lessons completed"
            >
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground" data-testid="text-current-track">Physiology Basics</h4>
                    <p className="text-sm text-muted-foreground">Next: Circulatory System</p>
                  </div>
                  <Link href="/tracks/diving-physiology-basics">
                    <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto" data-testid="button-continue">
                      Continue
                    </button>
                  </Link>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all" style={{ width: "60%" }}></div>
                </div>
              </div>
            </PageSection>

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
