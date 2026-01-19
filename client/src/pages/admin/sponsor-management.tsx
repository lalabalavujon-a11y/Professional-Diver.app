import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, StatCard, PageSection } from "@/components/ui/page-header";
import { LoadingSpinner } from "@/components/ui/loading-states";
import { EmptyState } from "@/components/ui/empty-states";
import { 
  Building2, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Users,
  DollarSign,
  Calendar
} from "lucide-react";
import type { Sponsor } from "@shared/sponsor-schema";

export default function SponsorManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");

  // Fetch sponsors
  const { data: sponsors, isLoading } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors", { status: statusFilter !== "all" ? statusFilter : undefined, tier: tierFilter !== "all" ? tierFilter : undefined }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (tierFilter !== "all") params.append("tier", tierFilter);
      const response = await fetch(`/api/sponsors?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch sponsors");
      return response.json();
    },
  });

  // Delete sponsor mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/sponsors/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete sponsor");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      toast({
        title: "Success",
        description: "Sponsor deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredSponsors = sponsors?.filter((sponsor) => {
    const matchesSearch = 
      sponsor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sponsor.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sponsor.category?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesSearch;
  }) || [];

  const stats = {
    total: sponsors?.length || 0,
    active: sponsors?.filter((s) => s.status === "ACTIVE").length || 0,
    pending: sponsors?.filter((s) => s.status === "PENDING").length || 0,
    revenue: sponsors?.reduce((sum, s) => sum + (s.monthlyFee || 0), 0) || 0,
  };

  if (isLoading) {
    return (
      <>
        <RoleBasedNavigation />
        <div className="min-h-screen bg-background" data-sidebar-content="true">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <LoadingSpinner />
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-background" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <PageHeader
            title="Sponsor Management"
            description="Manage partnerships, placements, and sponsorships"
            icon={Building2}
            actions={
              <Link href="/admin/sponsors/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Sponsor
                </Button>
              </Link>
            }
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <StatCard
              title="Total Sponsors"
              value={stats.total}
              icon={Building2}
              variant="primary"
            />
            <StatCard
              title="Active"
              value={stats.active}
              icon={TrendingUp}
              variant="success"
            />
            <StatCard
              title="Pending"
              value={stats.pending}
              icon={Calendar}
              variant="warning"
            />
            <StatCard
              title="Monthly Revenue"
              value={`£${(stats.revenue / 100).toLocaleString()}`}
              icon={DollarSign}
              variant="info"
            />
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search sponsors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="BRONZE">Bronze</SelectItem>
                      <SelectItem value="SILVER">Silver</SelectItem>
                      <SelectItem value="GOLD">Gold</SelectItem>
                      <SelectItem value="TITLE">Title</SelectItem>
                      <SelectItem value="FOUNDING">Founding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sponsors List */}
          <PageSection title="Sponsors">
            {filteredSponsors.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No sponsors found"
                description={searchTerm || statusFilter !== "all" || tierFilter !== "all" 
                  ? "Try adjusting your filters"
                  : "Create your first sponsor to get started"}
                action={{
                  label: "New Sponsor",
                  onClick: () => setLocation("/admin/sponsors/new"),
                }}
              />
            ) : (
              <div className="space-y-4">
                {filteredSponsors.map((sponsor) => (
                  <Card key={sponsor.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {sponsor.companyName}
                            </h3>
                            <Badge
                              variant={
                                sponsor.status === "ACTIVE"
                                  ? "default"
                                  : sponsor.status === "PENDING"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {sponsor.status}
                            </Badge>
                            <Badge variant="outline">{sponsor.tier}</Badge>
                            {sponsor.exclusivityCategory && (
                              <Badge variant="secondary">Exclusive: {sponsor.exclusivityCategory}</Badge>
                            )}
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            <p>
                              <strong>Contact:</strong> {sponsor.contactName} ({sponsor.contactEmail})
                            </p>
                            {sponsor.category && (
                              <p>
                                <strong>Category:</strong> {sponsor.category}
                              </p>
                            )}
                            <p>
                              <strong>Monthly Fee:</strong> £{(sponsor.monthlyFee || 0) / 100}
                            </p>
                            {sponsor.startDate && (
                              <p>
                                <strong>Start Date:</strong> {new Date(sponsor.startDate).toLocaleDateString()}
                              </p>
                            )}
                            {sponsor.endDate && (
                              <p>
                                <strong>End Date:</strong> {new Date(sponsor.endDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/sponsors/${sponsor.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/admin/sponsors/${sponsor.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${sponsor.companyName}?`)) {
                                deleteMutation.mutate(sponsor.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </PageSection>
        </main>
      </div>
    </>
  );
}
