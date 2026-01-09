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
  Building2,
  RefreshCw,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import type { Invite, Track } from "@shared/schema";

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
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  // Fetch tracks for Content Management (admin: get all tracks including unpublished)
  const { data: tracks, isLoading: tracksLoading } = useQuery<Track[]>({
    queryKey: ["/api/tracks", "?all=true"],
    queryFn: async () => {
      const response = await fetch("/api/tracks?all=true");
      if (!response.ok) throw new Error("Failed to fetch tracks");
      return response.json();
    },
  });

  // Fetch user permissions to get Partner Admins and Enterprise Users
  const { data: userPermissionsData } = useQuery<{ users: any[] }>({
    queryKey: ["/api/admin/user-permissions"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/admin/user-permissions?email=${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error('Failed to fetch user permissions');
      return response.json();
    },
    enabled: currentUser?.role === 'SUPER_ADMIN',
  });

  // Only SUPER_ADMIN can access User Management (Access Control)
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  
  // Also check feature permission as a backup
  const { hasFeature } = useFeaturePermissions();
  const canAccessUserManagement = isSuperAdmin && hasFeature("admin_dashboard");

  const pendingInvites = invites?.filter((invite: any) => !invite.usedAt).length || 0;

  // Partner Admins and Enterprise Users counts
  const partnerAdmins = userPermissionsData?.users?.filter((u: any) => u.role === "Partner Admin" || u.role === "AFFILIATE") || [];
  const enterpriseUsers = userPermissionsData?.users?.filter((u: any) => u.role === "Enterprise User" || u.role === "ENTERPRISE") || [];

  // Sync Partners to CRM mutation
  const syncPartnersMutation = useMutation({
    mutationFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/admin/sync-partners-to-crm?email=${encodeURIComponent(email)}`, {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to sync partners");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success",
        description: data.message || `Synced ${data.synced || 0} Partner Admin(s) to CRM`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sync partners to CRM",
        variant: "destructive",
      });
    },
  });

  // Publish track mutation
  const publishTrackMutation = useMutation({
    mutationFn: async ({ trackId, isPublished }: { trackId: string; isPublished: boolean }) => {
      // Try to update track via API - endpoint may need to be created
      const response = await fetch(`/api/tracks/${trackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update track. API endpoint may need to be created.");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      toast({
        title: "Success",
        description: "Track status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update track status",
        variant: "destructive",
      });
    },
  });

  const [location, navigate] = useLocation();

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
            <Link href="/markdown-editor">
              <Button variant="ghost" size="sm" data-testid="button-manage-all">
                Manage All
              </Button>
            </Link>
          }
        >
          {tracksLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : !tracks || tracks.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No tracks found"
              description="Create your first track to get started with content management"
              action={{
                label: "Create Track",
                onClick: () => navigate("/markdown-editor"),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {tracks.slice(0, 4).map((track) => (
                <div key={track.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow" data-testid={`content-card-${track.slug}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-foreground">{track.title}</h4>
                    <Badge 
                      variant={track.isPublished ? "default" : "secondary"} 
                      className={track.isPublished ? "bg-success-100 text-success-800" : "bg-warning-100 text-warning-800"}
                    >
                      {track.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  {track.summary && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{track.summary}</p>
                  )}
                  <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
                    <span className="capitalize">{track.difficulty || "beginner"}</span>
                    {track.estimatedHours && track.estimatedHours > 0 && (
                      <span>{track.estimatedHours} hours</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/tracks/${track.slug}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    {track.isPublished ? (
                      <Link href={`/tracks/${track.slug}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => publishTrackMutation.mutate({ trackId: track.id, isPublished: true })}
                        disabled={publishTrackMutation.isPending}
                      >
                        {publishTrackMutation.isPending ? "Publishing..." : "Publish"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </PageSection>

        {/* CRM Management - Only visible to SUPER_ADMIN */}
        {isSuperAdmin && (
          <PageSection
            title="CRM - Client Management"
            description="Manage your Partners & Clients"
            actions={
              <>
                <Link href="/crm">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Open CRM
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncPartnersMutation.mutate()}
                  disabled={syncPartnersMutation.isPending}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncPartnersMutation.isPending ? 'animate-spin' : ''}`} />
                  Sync Partners to CRM
                </Button>
              </>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-700">Partner Admins</h3>
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">{partnerAdmins.length}</span>
                  <Badge variant="secondary">{partnerAdmins.length} Active</Badge>
                </div>
                {partnerAdmins.length > 0 && (
                  <div className="mt-3 text-xs text-slate-600">
                    {partnerAdmins.slice(0, 3).map((p: any) => p.name || p.email).join(", ")}
                    {partnerAdmins.length > 3 && ` +${partnerAdmins.length - 3} more`}
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-700">Enterprise Users</h3>
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">{enterpriseUsers.length}</span>
                  <Badge variant="secondary">{enterpriseUsers.length} Active</Badge>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-700">All Clients</h3>
                  <Eye className="w-5 h-5 text-green-600" />
                </div>
                <Link href="/crm">
                  <Button variant="ghost" size="sm" className="w-full mt-2">
                    View CRM Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </PageSection>
        )}

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
