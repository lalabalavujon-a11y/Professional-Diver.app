/**
 * Enterprise Calendar Setup Page
 * Allows Enterprise users to connect and manage their calendar systems
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingSpinner } from "@/components/ui/loading-states";
import { 
  Calendar as CalendarIcon,
  Plus,
  Settings,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  ExternalLink,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import CalendarProviderSelector from "@/components/enterprise/calendar-provider-selector";
import CalendarConnectionStatus from "@/components/enterprise/calendar-connection-status";
import CalendarSetupInstructions from "@/components/enterprise/calendar-setup-instructions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CalendarConnection {
  id: string;
  provider: string;
  connectionName: string;
  calendarId?: string;
  isActive: boolean;
  syncEnabled: boolean;
  syncDirection: string;
  lastSyncAt?: string;
  createdAt: string;
}

interface CalendarProvider {
  provider: string;
  name: string;
  description: string;
  requiresOAuth: boolean;
  requiredFields: string[];
  optionalFields: string[];
}

export default function EnterpriseCalendarSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionsProvider, setInstructionsProvider] = useState<string | null>(null);

  // Fetch calendar connections
  const { data: connectionsData, isLoading } = useQuery<{ connections: CalendarConnection[] }>({
    queryKey: ['/api/enterprise/calendar/connections'],
    queryFn: async () => {
      const response = await fetch('/api/enterprise/calendar/connections');
      if (!response.ok) throw new Error('Failed to fetch connections');
      return response.json();
    },
  });

  // Fetch available providers
  const { data: providersData } = useQuery<{ providers: CalendarProvider[] }>({
    queryKey: ['/api/enterprise/calendar/providers'],
    queryFn: async () => {
      const response = await fetch('/api/enterprise/calendar/providers');
      if (!response.ok) throw new Error('Failed to fetch providers');
      return response.json();
    },
  });

  // Add connection mutation
  const addConnectionMutation = useMutation({
    mutationFn: async (data: { provider: string; connectionName?: string; calendarId?: string; providerConfig?: any }) => {
      const response = await fetch('/api/enterprise/calendar/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create connection');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.requiresOAuth && data.authUrl) {
        // Redirect to OAuth
        window.location.href = data.authUrl;
      } else {
        toast({
          title: 'Connection created',
          description: 'Calendar connection has been added successfully.',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/enterprise/calendar/connections'] });
        setShowAddConnection(false);
      }
    },
    onError: (error) => {
      toast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : 'Failed to create connection',
        variant: 'destructive',
      });
    },
  });

  // Delete connection mutation
  const deleteConnectionMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await fetch(`/api/enterprise/calendar/connections/${connectionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete connection');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Connection deleted',
        description: 'Calendar connection has been removed.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/enterprise/calendar/connections'] });
    },
    onError: () => {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete connection',
        variant: 'destructive',
      });
    },
  });

  // Toggle connection active state
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/enterprise/calendar/connections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error('Failed to update connection');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enterprise/calendar/connections'] });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await fetch(`/api/enterprise/calendar/connections/${connectionId}/test`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Test failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? 'Connection successful' : 'Connection failed',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      });
    },
  });

  const connections = connectionsData?.connections || [];
  const providers = providersData?.providers || [];

  const handleAddConnection = (provider: string, config: any) => {
    addConnectionMutation.mutate({
      provider,
      ...config,
    });
  };

  const handleViewInstructions = (provider: string) => {
    setInstructionsProvider(provider);
    setShowInstructions(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <RoleBasedNavigation />
      <div className="container mx-auto py-8 px-4">
        <PageHeader
          title="Calendar Setup"
          description="Connect and manage your operational calendars"
          icon={<CalendarIcon className="w-8 h-8" />}
        />

        {/* Add Connection Button */}
        <div className="mb-6">
          <Button onClick={() => setShowAddConnection(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Calendar Connection
          </Button>
        </div>

        {/* Connections List */}
        {isLoading ? (
          <LoadingSpinner />
        ) : connections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Calendar Connections</h3>
              <p className="text-muted-foreground mb-4">
                Get started by connecting your first calendar system.
              </p>
              <Button onClick={() => setShowAddConnection(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Connection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((connection) => (
              <Card key={connection.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{connection.connectionName || connection.provider}</CardTitle>
                    <Badge variant={connection.isActive ? 'default' : 'secondary'}>
                      {connection.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription className="capitalize">{connection.provider}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CalendarConnectionStatus connection={connection} />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnectionMutation.mutate(connection.id)}
                      disabled={testConnectionMutation.isPending}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${testConnectionMutation.isPending ? 'animate-spin' : ''}`} />
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActiveMutation.mutate({ id: connection.id, isActive: !connection.isActive })}
                    >
                      {connection.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this connection?')) {
                          deleteConnectionMutation.mutate(connection.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {connection.calendarId && (
                    <div className="text-sm text-muted-foreground">
                      Calendar ID: {connection.calendarId}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Available Providers Info */}
        {providers.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Available Calendar Providers</CardTitle>
              <CardDescription>
                Connect any of these calendar systems to your unified calendar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((provider) => (
                  <div key={provider.provider} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium capitalize">{provider.name}</div>
                      <div className="text-sm text-muted-foreground">{provider.description}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewInstructions(provider.provider)}
                      >
                        <HelpCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProvider(provider.provider);
                          setShowAddConnection(true);
                        }}
                      >
                        Connect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Connection Dialog */}
        {showAddConnection && (
          <CalendarProviderSelector
            providers={providers}
            selectedProvider={selectedProvider}
            onSelectProvider={setSelectedProvider}
            onConnect={handleAddConnection}
            onClose={() => {
              setShowAddConnection(false);
              setSelectedProvider(null);
            }}
          />
        )}

        {/* Instructions Dialog */}
        {showInstructions && instructionsProvider && (
          <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Setup Instructions</DialogTitle>
                <DialogDescription>
                  Step-by-step guide for connecting {instructionsProvider}
                </DialogDescription>
              </DialogHeader>
              <CalendarSetupInstructions provider={instructionsProvider} />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
