import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Download,
  Upload,
  Trash2,
  Filter,
  Search
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string;
  subscription_type: "TRIAL" | "MONTHLY" | "ANNUAL";
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  subscription_date: string;
  monthly_revenue: number;
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
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
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
  const filteredClients = clients?.filter(client => {
    const matchesStatus = filterStatus === "ALL" || client.status === filterStatus;
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

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

  const exportClientsCSV = () => {
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
  };

  const handleRefresh = () => {
    refetchClients();
    refetchStats();
    toast({ title: "Refreshed", description: "Data has been updated" });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      <RoleBasedNavigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900" data-testid="text-crm-title">
              Client Management (CRM)
            </h1>
            <p className="text-slate-600 mt-2">
              Manage your clients, subscriptions, and revenue
            </p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={handleRefresh} variant="outline" data-testid="button-refresh-crm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportClientsCSV} variant="outline" data-testid="button-export-clients">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-primary-500 hover:bg-primary-600 text-white" data-testid="button-add-client">
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
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900" data-testid="text-total-clients">
                {statsLoading ? "..." : stats?.totalClients || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900" data-testid="text-active-clients">
                {statsLoading ? "..." : stats?.activeClients || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Monthly Recurring Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900" data-testid="text-mrr">
                {statsLoading ? "..." : formatMRR(stats?.monthlyRecurringRevenue || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-800">Last Updated</CardTitle>
              <Calendar className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-amber-900" data-testid="text-last-updated">
                {statsLoading ? "..." : stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : "Never"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search clients by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-clients"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Clients ({filteredClients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {clientsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {clients?.length === 0 ? "No clients found. Add your first client!" : "No clients match your search."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Subscription</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Revenue</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="border-b hover:bg-gray-50" data-testid={`client-row-${client.id}`}>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{client.name}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{client.email}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">
                            {client.subscription_type} - {getSubscriptionPrice(client.subscription_type)}
                            {client.subscription_type === "ANNUAL" && "/Year"}
                            {client.subscription_type === "MONTHLY" && "/Month"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(client.status)}>
                            {client.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {getSubscriptionPrice(client.subscription_type)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(client.subscription_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingClient(client)}
                              data-testid={`button-edit-client-${client.id}`}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this client?')) {
                                  deleteClientMutation.mutate(client.id);
                                }
                              }}
                              data-testid={`button-delete-client-${client.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Client Dialog */}
        {editingClient && (
          <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Client</DialogTitle>
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
      </main>
    </div>
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