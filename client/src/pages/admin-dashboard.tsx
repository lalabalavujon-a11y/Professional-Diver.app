import { useQuery } from "@tanstack/react-query";
import RoleBasedNavigation from "@/components/role-based-navigation";
import TrialCountdown from "@/components/trial-countdown";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  Eye,
  MoreVertical 
} from "lucide-react";
import { Link } from "wouter";
import type { Invite } from "@shared/schema";

type DashboardStats = {
  activeUsers: number;
  totalLessons: number;
  completions: { month: string; completed: number }[];
};

export default function AdminDashboard() {
  const { data: invites } = useQuery<Invite[]>({
    queryKey: ["/api/admin/invites"],
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trial User Management */}
        <div className="mb-6">
          <TrialCountdown 
            expiresAt={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()} 
            showUpgradeButton={false}
          />
        </div>

        <section className="mb-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900" data-testid="text-admin-title">
                    Admin Dashboard
                  </h2>
                  <p className="text-sm text-slate-500">Manage invites, content, and user progress</p>
                </div>
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
              </div>
            </div>

            <div className="p-6">
              {/* Stats Cards */}
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

              {/* Invites Management */}
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

              {/* Content Management */}
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
            </div>
          </div>
        </section>
        </main>
      </div>
    </>
  );
}
