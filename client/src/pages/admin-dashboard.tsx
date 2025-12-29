import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import RoleBasedNavigation from "@/components/role-based-navigation";
import TrialCountdown from "@/components/trial-countdown";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  Eye,
  MoreVertical,
  Shield,
  Wrench,
  BarChart3,
  Settings,
  Lock,
  Download
} from "lucide-react";
import { Link } from "wouter";
import type { Invite } from "@shared/schema";
import BehaviorAnalyticsDashboard from "@/components/behavior-analytics-dashboard";

type DashboardStats = {
  activeUsers: number;
  totalLessons: number;
  completions: { month: string; completed: number }[];
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  subscriptionType: string;
  subscriptionStatus?: string;
  trialExpiresAt?: string;
};

type AccessPermission = {
  email: string;
  name: string;
  role: string;
  operationsCenter: boolean;
  adminDashboard: boolean;
  crm: boolean;
  analytics: boolean;
  contentEditor: boolean;
  updatedAt: string;
  updatedBy: string;
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user to determine access type
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isPartnerAdmin = currentUser?.role === 'PARTNER_ADMIN';

  const { data: invites } = useQuery<Invite[]>({
    queryKey: ["/api/admin/invites"],
    enabled: isSuperAdmin // Only Super Admin can see invites
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isSuperAdmin || isPartnerAdmin // Both can see stats
  });

  // Get current user's access permissions (for Partner Admins)
  const { data: userAccessPermissions } = useQuery({
    queryKey: ["/api/users/access-permissions"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/access-permissions?email=${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error('Failed to fetch access permissions');
      return response.json();
    },
    enabled: isPartnerAdmin
  });

  // Get access control permissions (Super Admin only) - for managing other users
  const accessPermissionsQuery = useQuery<AccessPermission[]>({
    queryKey: ["/api/admin/access-control"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      console.log('Fetching access control permissions for:', email, 'isSuperAdmin:', isSuperAdmin);
      
      const response = await fetch(`/api/admin/access-control?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error('Access control API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          email
        });
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Access control permissions fetched successfully:', data);
      return data;
    },
    enabled: isSuperAdmin, // Only fetch for Super Admin
    retry: 1
  });

  const accessPermissions = accessPermissionsQuery.data;
  const isLoadingPermissions = accessPermissionsQuery.isLoading;
  const permissionsError = accessPermissionsQuery.error;

  // Update access permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ email, updates }: { email: string; updates: Partial<AccessPermission> }) => {
      const requesterEmail = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/admin/access-control/${email}?email=${requesterEmail}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update access permission');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/access-control"] });
      toast({
        title: "Success",
        description: "Access permission updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update access permission",
        variant: "destructive",
      });
    }
  });

  const handleTogglePermission = (email: string, feature: keyof AccessPermission, value: boolean) => {
    updatePermissionMutation.mutate({
      email,
      updates: { [feature]: value }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      <RoleBasedNavigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Access Type Banner */}
        <div className="mb-6">
          <TrialCountdown 
            expiresAt={currentUser?.trialExpiresAt} 
            showUpgradeButton={false}
            role={currentUser?.role}
            subscriptionType={currentUser?.subscriptionType}
            subscriptionStatus={currentUser?.subscriptionStatus}
          />
        </div>

        <section className="mb-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900" data-testid="text-admin-title">
                    {isSuperAdmin ? 'Super Admin Dashboard' : isPartnerAdmin ? 'Partner Admin Dashboard' : 'Admin Dashboard'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {isSuperAdmin 
                      ? 'Full platform control and access management' 
                      : isPartnerAdmin 
                        ? 'Restricted access - Limited features based on permissions'
                        : 'Manage invites, content, and user progress'}
                  </p>
                </div>
                {isSuperAdmin && (
                  <div className="flex space-x-3">
                    <Link href="/admin/invites">
                      <Button 
                        className="bg-primary-500 hover:bg-primary-600 text-white"
                        data-testid="button-new-invite"
                      >
                        New Invite
                      </Button>
                    </Link>
                    <Button 
                      variant="outline"
                      data-testid="button-export-data"
                    >
                      Export Data
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              {/* Stats Cards - Show for both Super Admin and Partner Admin */}
              {(isSuperAdmin || isPartnerAdmin) && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-primary-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-primary-600">Active Users</p>
                      <p className="text-2xl font-bold text-primary-900" data-testid="text-active-users">
                        {stats?.activeUsers || 127}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-ocean-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-ocean-100 rounded-lg">
                      <FileText className="w-6 h-6 text-ocean-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-ocean-600">Lessons</p>
                      <p className="text-2xl font-bold text-ocean-900" data-testid="text-total-lessons">
                        {stats?.totalLessons || 23}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-yellow-600">Pending Invites</p>
                      <p className="text-2xl font-bold text-yellow-900" data-testid="text-pending-invites">
                        {invites?.filter((invite: any) => !invite.usedAt).length || 8}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600">Completions</p>
                      <p className="text-2xl font-bold text-green-900" data-testid="text-completions">
                        {stats?.completions?.length || 89}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* CSV Export Section - Super Admin only */}
              {isSuperAdmin && (
                <div className="mb-8">
                  <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Download className="w-5 h-5 text-primary-600" />
                        <span>Data Export</span>
                      </CardTitle>
                      <CardDescription>
                        Export platform data as CSV files
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <a 
                          href="/api/admin/exports/attempts"
                          download
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-primary-600" />
                            <div>
                              <p className="font-medium text-slate-900">Export Attempts</p>
                              <p className="text-sm text-slate-500">Quiz attempts data</p>
                            </div>
                          </div>
                          <Download className="w-4 h-4 text-slate-400" />
                        </a>
                        <a 
                          href="/api/admin/exports/users"
                          download
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <Users className="w-5 h-5 text-primary-600" />
                            <div>
                              <p className="font-medium text-slate-900">Export Users</p>
                              <p className="text-sm text-slate-500">All user data</p>
                            </div>
                          </div>
                          <Download className="w-4 h-4 text-slate-400" />
                        </a>
                        <a 
                          href="/api/admin/exports/affiliates"
                          download
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <Shield className="w-5 h-5 text-primary-600" />
                            <div>
                              <p className="font-medium text-slate-900">Export Affiliates</p>
                              <p className="text-sm text-slate-500">Affiliate program data</p>
                            </div>
                          </div>
                          <Download className="w-4 h-4 text-slate-400" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {isSuperAdmin && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Recent Invites</h3>
                    <Link href="/admin/invites">
                      <button 
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                        data-testid="button-view-all-invites"
                      >
                        View All
                      </button>
                    </Link>
                  </div>
                
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invites && invites.length > 0 ? (
                        invites.slice(0, 3).map((invite: any) => (
                          <tr key={invite.id} data-testid={`invite-row-${invite.id}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-slate-900">
                                {invite.email}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                invite.usedAt 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-yellow-100 text-yellow-800"
                              }`}>
                                {invite.usedAt ? "Accepted" : "Pending"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              {new Date(invite.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              {!invite.usedAt && (
                                <>
                                  <button 
                                    className="text-primary-600 hover:text-primary-900"
                                    data-testid={`button-copy-link-${invite.id}`}
                                  >
                                    Copy Link
                                  </button>
                                  <button 
                                    className="text-red-600 hover:text-red-900"
                                    data-testid={`button-revoke-${invite.id}`}
                                  >
                                    Revoke
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-slate-500">
                            No invites found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              )}

              {/* Content Management - Super Admin only */}
              {isSuperAdmin && (
                <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Content Management</h3>
                  <button 
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                    data-testid="button-manage-all"
                  >
                    Manage All
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4" data-testid="content-card-physiology">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-slate-900">Physiology Basics</h4>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        Published
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">5 lessons, 3 quizzes</p>
                    <div className="flex space-x-2">
                      <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        Edit
                      </button>
                      <button className="text-sm text-slate-600 hover:text-slate-700">
                        <Eye className="w-4 h-4 inline mr-1" />
                        Preview
                      </button>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4" data-testid="content-card-decompression">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-slate-900">Decompression Theory</h4>
                      <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                        Draft
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">7 lessons, 5 quizzes</p>
                    <div className="flex space-x-2">
                      <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        Edit
                      </button>
                      <button className="text-sm text-ocean-600 hover:text-ocean-700">
                        Publish
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Partner Admin Restricted Access Notice */}
              {isPartnerAdmin && (
                <div className="mb-8">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-blue-900">
                        <Lock className="w-5 h-5" />
                        <span>Restricted Access Dashboard</span>
                      </CardTitle>
                      <CardDescription className="text-blue-700">
                        You have limited access to admin features. Only features enabled by Super Admin are available.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-medium">Admin Dashboard</span>
                          </div>
                          <Badge variant={userAccessPermissions?.adminDashboard ? "default" : "secondary"}>
                            {userAccessPermissions?.adminDashboard ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Wrench className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-medium">Operations Center</span>
                          </div>
                          <Badge variant={userAccessPermissions?.operationsCenter ? "default" : "secondary"}>
                            {userAccessPermissions?.operationsCenter ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-medium">CRM</span>
                          </div>
                          <Badge variant={userAccessPermissions?.crm ? "default" : "secondary"}>
                            {userAccessPermissions?.crm ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-medium">Analytics</span>
                          </div>
                          <Badge variant={userAccessPermissions?.analytics ? "default" : "secondary"}>
                            {userAccessPermissions?.analytics ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-slate-600" />
                            <span className="text-sm font-medium">Content Editor</span>
                          </div>
                          <Badge variant={userAccessPermissions?.contentEditor ? "default" : "secondary"}>
                            {userAccessPermissions?.contentEditor ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Behavior Analytics Dashboard - Super Admin always visible, Partner Admin with toggle */}
              {((isSuperAdmin) || (isPartnerAdmin && userAccessPermissions?.analytics)) && (
                <section className="mb-12">
                  <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5 text-primary-600" />
                            <span>Behavior Analytics & Insights</span>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Real-time monitoring of user behavior, performance metrics, and platform insights
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <BehaviorAnalyticsDashboard />
                    </CardContent>
                  </Card>
                </section>
              )}
            </div>
          </div>
        </section>

        {/* Access Control Section - Super Admin Only */}
        {isSuperAdmin && (
          <section className="mb-12">
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-primary-600" />
                      <span>Access Control</span>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Control Partner Admin and Supervisor access to admin features
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingPermissions ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>Loading access control permissions...</p>
                  </div>
                ) : permissionsError ? (
                  <div className="text-center py-8 text-red-500">
                    <p>Error loading permissions: {permissionsError instanceof Error ? permissionsError.message : 'Unknown error'}</p>
                  </div>
                ) : accessPermissions && accessPermissions.length > 0 ? (
                  <div className="space-y-6">
                    {accessPermissions.map((permission) => (
                      <div key={permission.email} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-slate-900">{permission.name}</h4>
                            <p className="text-sm text-slate-500">{permission.email}</p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                              {permission.role === 'PARTNER_ADMIN' ? 'Partner Admin' : 'Supervisor'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Wrench className="w-4 h-4 text-slate-600" />
                              <Label htmlFor={`ops-${permission.email}`} className="text-sm font-medium cursor-pointer">
                                Operations Center
                              </Label>
                            </div>
                            <Switch
                              id={`ops-${permission.email}`}
                              checked={permission.operationsCenter}
                              onCheckedChange={(checked) => 
                                handleTogglePermission(permission.email, 'operationsCenter', checked)
                              }
                              disabled={updatePermissionMutation.isPending}
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Shield className="w-4 h-4 text-slate-600" />
                              <Label htmlFor={`admin-${permission.email}`} className="text-sm font-medium cursor-pointer">
                                Admin Dashboard
                              </Label>
                            </div>
                            <Switch
                              id={`admin-${permission.email}`}
                              checked={permission.adminDashboard}
                              onCheckedChange={(checked) => 
                                handleTogglePermission(permission.email, 'adminDashboard', checked)
                              }
                              disabled={updatePermissionMutation.isPending}
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-slate-600" />
                              <Label htmlFor={`crm-${permission.email}`} className="text-sm font-medium cursor-pointer">
                                CRM
                              </Label>
                            </div>
                            <Switch
                              id={`crm-${permission.email}`}
                              checked={permission.crm}
                              onCheckedChange={(checked) => 
                                handleTogglePermission(permission.email, 'crm', checked)
                              }
                              disabled={updatePermissionMutation.isPending}
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <BarChart3 className="w-4 h-4 text-slate-600" />
                              <Label htmlFor={`analytics-${permission.email}`} className="text-sm font-medium cursor-pointer">
                                Analytics
                              </Label>
                            </div>
                            <Switch
                              id={`analytics-${permission.email}`}
                              checked={permission.analytics}
                              onCheckedChange={(checked) => 
                                handleTogglePermission(permission.email, 'analytics', checked)
                              }
                              disabled={updatePermissionMutation.isPending}
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-slate-600" />
                              <Label htmlFor={`content-${permission.email}`} className="text-sm font-medium cursor-pointer">
                                Content Editor
                              </Label>
                            </div>
                            <Switch
                              id={`content-${permission.email}`}
                              checked={permission.contentEditor}
                              onCheckedChange={(checked) => 
                                handleTogglePermission(permission.email, 'contentEditor', checked)
                              }
                              disabled={updatePermissionMutation.isPending}
                            />
                          </div>
                        </div>

                        {permission.updatedAt && (
                          <p className="text-xs text-slate-400 mt-3">
                            Last updated: {new Date(permission.updatedAt).toLocaleString()} by {permission.updatedBy}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Lock className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p>No Partner Admins or Supervisors found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}
