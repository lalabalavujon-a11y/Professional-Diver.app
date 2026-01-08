import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { PageHeader, StatCard, PageSection } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { LoadingSpinner, SkeletonTable } from "@/components/ui/loading-states";
import { EmptyState, ErrorState } from "@/components/ui/empty-states";
import { SearchBar, AdvancedFilters, ActiveFilters, type FilterConfig } from "@/components/ui/filters";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  DollarSign, 
  Calendar,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Eye,
} from "lucide-react";
import EnhancedCallingButton from "@/components/crm/EnhancedCallingButton";
import ClientDetailView from "@/components/crm/ClientDetailView";

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subscription_type: "TRIAL" | "MONTHLY" | "ANNUAL" | "LIFETIME";
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  subscription_date: string;
  monthly_revenue: number;
  partner_status?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ClientStats {
  totalClients: number;
  activeClients: number;
  monthlyRecurringRevenue: number;
  lastUpdated: string;
}

export default function CRMDashboard() {
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch clients
  const { data: clients, isLoading: clientsLoading, refetch: refetchClients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch client stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<ClientStats>({
    queryKey: ["/api/clients/stats"],
  });

  // Mutations
  const createClientMutation = useMutation({
    mutationFn: async (newClient: Partial<Client>) => {
      try {
        const response = await apiRequest("/api/clients", "POST", newClient);
        return response;
      } catch (error) {
        console.error('Create client mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients/stats"] });
      toast({ title: "Success", description: "Client created successfully" });
      setShowAddDialog(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create client", variant: "destructive" });
    }
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Client>) => 
      apiRequest(`/api/clients/${id}`, "PUT", updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients/stats"] });
      toast({ title: "Success", description: "Client updated successfully" });
      setEditingClient(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update client", variant: "destructive" });
    }
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/clients/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients/stats"] });
      toast({ title: "Success", description: "Client deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete client", variant: "destructive" });
    }
  });

  // Filter and search clients
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(client => {
      const matchesStatus = filterStatus === "ALL" || client.status === filterStatus;
      const matchesSearch = !searchTerm || 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [clients, filterStatus, searchTerm]);

  // Define filter configuration
  const filterConfig: FilterConfig[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "All Statuses", value: "ALL" },
        { label: "Active", value: "ACTIVE" },
        { label: "Paused", value: "PAUSED" },
        { label: "Cancelled", value: "CANCELLED" },
      ],
    },
  ];

  // Utility functions
  const getSubscriptionPrice = (type: string) => {
    switch (type) {
      case "TRIAL": return "$0";
      case "MONTHLY": return "$25";
      case "ANNUAL": return "$250";
      default: return "$0";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "PAUSED": return "bg-yellow-100 text-yellow-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatMRR = (mrr: number) => {
    return `$${(mrr / 100).toFixed(2)}`;
  };

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    if (format === "csv") {
      const csvContent = [
        ['Name', 'Email', 'Subscription Type', 'Status', 'Subscription Date', 'Monthly Revenue', 'Notes'],
        ...filteredClients.map(client => [
          client.name,
          client.email,
          client.subscription_type,
          client.status,
          new Date(client.subscription_date).toLocaleDateString(),
          getSubscriptionPrice(client.subscription_type),
          client.notes || ''
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Export Complete", description: "Clients exported as CSV" });
    }
  };

  const handleBulkAction = (selectedRows: Client[], action: string) => {
    if (action === "delete") {
      if (window.confirm(`Are you sure you want to delete ${selectedRows.length} client(s)?`)) {
        selectedRows.forEach(client => {
          deleteClientMutation.mutate(client.id);
        });
      }
    }
  };

  const handleRefresh = () => {
    refetchClients();
    refetchStats();
    toast({ title: "Refreshed", description: "Data has been updated" });
  };

  // Define table columns
  const columns: ColumnDef<Client>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div className="text-muted-foreground">{row.original.email}</div>,
    },
    {
      accessorKey: "subscription_type",
      header: "Subscription",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.subscription_type} - {getSubscriptionPrice(row.original.subscription_type)}
          {row.original.subscription_type === "ANNUAL" && "/Year"}
          {row.original.subscription_type === "MONTHLY" && "/Month"}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={getStatusColor(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "revenue",
      header: "Revenue",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {getSubscriptionPrice(row.original.subscription_type)}
        </div>
      ),
    },
    {
      accessorKey: "subscription_date",
      header: "Date",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {new Date(row.original.subscription_date).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewingClient(row.original)}
            aria-label={`View ${row.original.name} details`}
            title="View Details"
          >
            <Eye className="w-3 h-3" />
          </Button>
          <EnhancedCallingButton
            clientId={row.original.id}
            email={row.original.email}
            name={row.original.name}
            size="sm"
            variant="outline"
            showLabel={false}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditingClient(row.original)}
            aria-label={`Edit ${row.original.name}`}
          >
            <Edit2 className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete ${row.original.name}?`)) {
                deleteClientMutation.mutate(row.original.id);
              }
            }}
            aria-label={`Delete ${row.original.name}`}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ),
    },
  ], []);

  const activeFiltersList = useMemo(() => {
    const list: Array<{ key: string; label: string; value: string }> = [];
    if (filterStatus !== "ALL") {
      list.push({ key: "status", label: "Status", value: filterStatus });
    }
    return list;
  }, [filterStatus]);

  if (clientsLoading || statsLoading) {
    return (
      <>
        <RoleBasedNavigation />
        <div className="min-h-screen bg-background pt-20" data-sidebar-content="true">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <LoadingSpinner size="lg" text="Loading CRM dashboard..." />
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-background pt-20" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <PageHeader
            title="Client Management (CRM)"
            description="Manage your clients, subscriptions, and revenue"
            icon={Users}
            actions={
              <>
                <Button 
                  onClick={handleRefresh} 
                  variant="outline" 
                  data-testid="button-refresh-crm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-client">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Client
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Client</DialogTitle>
                    </DialogHeader>
                    <ClientForm 
                      onSubmit={(data) => {
                        const subscriptionRevenue = data.subscription_type === "MONTHLY" ? 2500 : 
                                                  data.subscription_type === "ANNUAL" ? 25000 : 0;
                        createClientMutation.mutate({
                          ...data,
                          monthly_revenue: subscriptionRevenue,
                          subscription_date: new Date().toISOString()
                        });
                      }}
                      loading={createClientMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
              </>
            }
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <StatCard
              title="Total Clients"
              value={stats?.totalClients || 0}
              icon={Users}
              variant="info"
              data-testid="stat-total-clients"
            />
            <StatCard
              title="Active Clients"
              value={stats?.activeClients || 0}
              icon={Users}
              variant="success"
              data-testid="stat-active-clients"
            />
            <StatCard
              title="Monthly Recurring Revenue"
              value={formatMRR(stats?.monthlyRecurringRevenue || 0)}
              icon={DollarSign}
              variant="primary"
              data-testid="stat-mrr"
            />
            <StatCard
              title="Last Updated"
              value={stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : "Never"}
              icon={Calendar}
              variant="warning"
              data-testid="stat-last-updated"
            />
          </div>

          {/* Filters and Search */}
          <PageSection card={false} className="mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1 max-w-sm">
                <SearchBar
                  placeholder="Search clients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => setSearchTerm("")}
                  data-testid="input-search-clients"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {activeFiltersList.length > 0 && (
              <ActiveFilters
                filters={activeFiltersList}
                onRemove={(key) => {
                  if (key === "status") setFilterStatus("ALL");
                }}
                onClearAll={() => setFilterStatus("ALL")}
              />
            )}
          </PageSection>

          {/* Clients Table */}
          <PageSection>
            {!clients || clients.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No clients found"
                description="Get started by adding your first client"
                action={{
                  label: "Add Client",
                  onClick: () => setShowAddDialog(true),
                }}
              />
            ) : (
              <DataTable
                columns={columns}
                data={filteredClients}
                isLoading={clientsLoading}
                searchKey="name"
                searchPlaceholder="Search clients..."
                enableRowSelection
                enableColumnVisibility
                enableSorting
                enablePagination
                pageSize={10}
                onExport={handleExport}
                onBulkAction={handleBulkAction}
                bulkActions={[
                  { label: "Delete Selected", value: "delete", variant: "destructive" },
                ]}
                emptyState={
                  <EmptyState
                    icon={Users}
                    title="No matching clients"
                    description="Try adjusting your search or filters"
                  />
                }
              />
            )}
          </PageSection>
        </main>
      </div>

        {/* View Client Detail Dialog */}
        {viewingClient && (
          <ClientDetailView
            client={viewingClient}
            isOpen={!!viewingClient}
            onClose={() => {
              setViewingClient(null);
            }}
            onUpdate={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
              queryClient.invalidateQueries({ queryKey: ["/api/clients/stats"] });
            }}
          />
        )}

        {/* Edit Client Dialog */}
        {editingClient && (
          <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Edit Client</span>
                  <EnhancedCallingButton
                    clientId={editingClient.id}
                    email={editingClient.email}
                    name={editingClient.name}
                    size="sm"
                    variant="outline"
                  />
                </DialogTitle>
              </DialogHeader>
              <ClientForm 
                client={editingClient}
                onSubmit={(data) => {
                  const subscriptionRevenue = data.subscription_type === "MONTHLY" ? 2500 : 
                                            data.subscription_type === "ANNUAL" ? 25000 : 0;
                  updateClientMutation.mutate({
                    id: editingClient.id,
                    ...data,
                    monthly_revenue: subscriptionRevenue
                  });
                }}
                loading={updateClientMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
    </>
  );
}

// Client Form Component
interface ClientFormProps {
  client?: Client;
  onSubmit: (data: any) => void;
  loading: boolean;
}

function ClientForm({ client, onSubmit, loading }: ClientFormProps) {
  const [formData, setFormData] = useState({
    name: client?.name || "",
    email: client?.email || "",
    phone: client?.phone || "",
    subscription_type: client?.subscription_type || "TRIAL",
    status: client?.status || "ACTIVE",
    notes: client?.notes || ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter client's full name"
          required
          data-testid="input-client-name"
        />
      </div>

      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Enter client's email"
          required
          data-testid="input-client-email"
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone Number (Optional)</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="+44 7448 320513"
          data-testid="input-client-phone"
        />
      </div>

      <div>
        <Label htmlFor="subscription_type">Subscription Type</Label>
        <Select 
          value={formData.subscription_type} 
          onValueChange={(value: any) => setFormData(prev => ({ ...prev, subscription_type: value }))}
        >
          <SelectTrigger data-testid="select-subscription-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TRIAL">24hr Free Trial - $0</SelectItem>
            <SelectItem value="MONTHLY">Monthly - $25/Month USD</SelectItem>
            <SelectItem value="ANNUAL">Annual - $250/Year USD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select 
          value={formData.status} 
          onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
        >
          <SelectTrigger data-testid="select-client-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Any additional notes about this client..."
          data-testid="textarea-client-notes"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="submit" disabled={loading} data-testid="button-save-client">
          {loading ? "Saving..." : client ? "Update Client" : "Add Client"}
        </Button>
      </div>
    </form>
  );
}