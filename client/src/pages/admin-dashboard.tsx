import { useQuery } from "@tanstack/react-query";
import RoleBasedNavigation from "@/components/role-based-navigation";
import TrialCountdown from "@/components/trial-countdown";
import UserManagementContainer from "@/components/user-management-container";
import { useFeaturePermissions } from "@/hooks/use-feature-permissions";
import { PageHeader, StatCard, PageSection } from "@/components/ui/page-header";
import { LoadingSpinner } from "@/components/ui/loading-states";
import { EmptyState } from "@/components/ui/empty-states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  Eye,
  Shield,
  Mail,
  Download,
} from "lucide-react";
import { Link } from "wouter";
import type { Invite } from "@shared/schema";

type DashboardStats = {
  activeUsers: number;
  totalLessons: number;
  completions: { month: string; completed: number }[];
};

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'USER' | 'LIFETIME' | 'AFFILIATE' | 'ENTERPRISE';
  subscriptionType: 'TRIAL' | 'MONTHLY' | 'ANNUAL' | 'LIFETIME';
}

export default function AdminDashboard() {
  // Get current user to check role
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  const { data: invites } = useQuery<Invite[]>({
    queryKey: ["/api/admin/invites"],
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  // Only SUPER_ADMIN can access User Management (Access Control)
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  
  // Also check feature permission as a backup
  const { hasFeature } = useFeaturePermissions();
  const canAccessUserManagement = isSuperAdmin && hasFeature("admin_dashboard");

  const pendingInvites = invites?.filter((invite: any) => !invite.usedAt).length || 0;

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-background" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Trial User Management */}
        <div className="mb-6">
          <TrialCountdown 
            expiresAt={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()} 
            showUpgradeButton={false}
          />
        </div>

        <PageHeader
          title="Admin Dashboard"
          description="Manage invites, content, and user progress"
          icon={Shield}
          actions={
            <>
              <Link href="/admin/invites">
                <Button data-testid="button-new-invite">
                  <Mail className="w-4 h-4 mr-2" />
                  New Invite
                </Button>
              </Link>
              <Button variant="outline" data-testid="button-export-data">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Active Users"
            value={stats?.activeUsers || 127}
            icon={Users}
            variant="primary"
            data-testid="stat-active-users"
          />
          <StatCard
            title="Lessons"
            value={stats?.totalLessons || 23}
            icon={FileText}
            variant="info"
            data-testid="stat-total-lessons"
          />
          <StatCard
            title="Pending Invites"
            value={pendingInvites}
            icon={Clock}
            variant="warning"
            data-testid="stat-pending-invites"
          />
          <StatCard
            title="Completions"
            value={stats?.completions?.length || 89}
            icon={CheckCircle}
            variant="success"
            data-testid="stat-completions"
          />
        </div>

        {/* Invites Management */}
        <PageSection
          title="Recent Invites"
          actions={
            <Link href="/admin/invites">
              <Button variant="ghost" size="sm" data-testid="button-view-all-invites">
                View All
              </Button>
            </Link>
          }
        >
          {!invites || invites.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No invites found"
              description="Create your first invite to get started"
              action={{
                label: "Create Invite",
                onClick: () => window.location.href = "/admin/invites",
              }}
            />
          ) : (
            <div className="space-y-3">
              {invites.slice(0, 3).map((invite: any) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`invite-row-${invite.id}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{invite.email}</div>
                      <div className="text-sm text-muted-foreground">
                        Created {new Date(invite.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge
                      variant={invite.usedAt ? "default" : "secondary"}
                      className={invite.usedAt ? "bg-success-100 text-success-800" : "bg-warning-100 text-warning-800"}
                    >
                      {invite.usedAt ? "Accepted" : "Pending"}
                    </Badge>
                  </div>
                  {!invite.usedAt && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-copy-link-${invite.id}`}
                      >
                        Copy Link
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        data-testid={`button-revoke-${invite.id}`}
                      >
                        Revoke
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </PageSection>

        {/* Content Management */}
        <PageSection
          title="Content Management"
          actions={
            <Button variant="ghost" size="sm" data-testid="button-manage-all">
              Manage All
            </Button>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow" data-testid="content-card-physiology">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground">Physiology Basics</h4>
                <Badge variant="default" className="bg-success-100 text-success-800">
                  Published
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">5 lessons, 3 quizzes</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Edit</Button>
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow" data-testid="content-card-decompression">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground">Decompression Theory</h4>
                <Badge variant="secondary" className="bg-warning-100 text-warning-800">
                  Draft
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">7 lessons, 5 quizzes</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Edit</Button>
                <Button variant="default" size="sm">Publish</Button>
              </div>
            </div>
          </div>
        </PageSection>

        {/* User Management Container (Access Control) - SUPER_ADMIN only */}
        {canAccessUserManagement && (
          <PageSection className="mt-6">
            <UserManagementContainer />
          </PageSection>
        )}
        </main>
      </div>
    </>
  );
}
