import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE = '/api/operations-calendar';

function getUserEmail(): string {
  return localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
}

interface SyncStatus {
  google: { connected: boolean; lastSync?: string };
  outlook: { connected: boolean; lastSync?: string };
  apple: { connected: boolean; lastSync?: string };
}

export default function CalendarSyncSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [syncDirection, setSyncDirection] = useState<'bidirectional' | 'pull' | 'push'>('bidirectional');

  const { data: syncStatus, isLoading } = useQuery<SyncStatus>({
    queryKey: ['/api/operations-calendar/sync/status'],
    queryFn: async () => {
      const email = getUserEmail();
      const response = await fetch(`${API_BASE}/sync/status`, {
        headers: {
          'x-user-email': email,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch sync status');
      return response.json();
    },
  });

  const connectGoogleMutation = useMutation({
    mutationFn: async () => {
      const email = getUserEmail();
      const response = await fetch(`${API_BASE}/google/auth`, {
        headers: {
          'x-user-email': email,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect Google Calendar');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        // Open OAuth window
        window.location.href = data.authUrl;
      } else {
        toast({
          title: 'Info',
          description: 'Google Calendar sync is not yet fully implemented. Please use iCal export/import.',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to connect Google Calendar',
        variant: 'destructive',
      });
    },
  });

  const connectOutlookMutation = useMutation({
    mutationFn: async () => {
      const email = getUserEmail();
      const response = await fetch(`${API_BASE}/outlook/auth`, {
        headers: {
          'x-user-email': email,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect Outlook');
      }
      return response.json();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to connect Outlook',
        variant: 'destructive',
      });
    },
  });

  const connectAppleMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const email = getUserEmail();
      const response = await fetch(`${API_BASE}/apple/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': email,
        },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect Apple Calendar');
      }
      return response.json();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to connect Apple Calendar',
        variant: 'destructive',
      });
    },
  });

  const syncProvider = (provider: 'google' | 'outlook' | 'apple') => {
    // TODO: Implement manual sync trigger
    toast({
      title: 'Info',
      description: `${provider} sync is not yet fully implemented. Please use iCal export/import.`,
    });
  };

  const disconnectProvider = (provider: 'google' | 'outlook' | 'apple') => {
    // TODO: Implement disconnect
    toast({
      title: 'Info',
      description: `Disconnect for ${provider} is not yet fully implemented.`,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Calendar Synchronization
        </CardTitle>
        <CardDescription>
          Connect your calendar to sync operations with Google Calendar, Outlook, or Apple iCloud.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sync Direction Setting */}
        <div className="space-y-2">
          <Label>Default Sync Direction</Label>
          <Select value={syncDirection} onValueChange={(value) => setSyncDirection(value as typeof syncDirection)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bidirectional">Bidirectional (Sync both ways)</SelectItem>
              <SelectItem value="pull">Pull Only (Import from external calendar)</SelectItem>
              <SelectItem value="push">Push Only (Export to external calendar)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Google Calendar */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                G
              </div>
              <div>
                <h3 className="font-semibold">Google Calendar</h3>
                <p className="text-sm text-slate-500">Sync with your Google Calendar</p>
              </div>
            </div>
            {syncStatus?.google?.connected ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">Not Connected</Badge>
            )}
          </div>
          {syncStatus?.google?.connected ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => syncProvider('google')}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Sync Now
              </Button>
              <Button variant="outline" size="sm" onClick={() => disconnectProvider('google')}>
                <XCircle className="w-4 h-4 mr-1" />
                Disconnect
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => connectGoogleMutation.mutate()} 
              disabled={connectGoogleMutation.isPending}
              size="sm"
            >
              {connectGoogleMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Google Calendar'
              )}
            </Button>
          )}
          {syncStatus?.google?.lastSync && (
            <p className="text-xs text-slate-500">Last synced: {new Date(syncStatus.google.lastSync).toLocaleString()}</p>
          )}
        </div>

        {/* Microsoft Outlook */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
                M
              </div>
              <div>
                <h3 className="font-semibold">Microsoft Outlook</h3>
                <p className="text-sm text-slate-500">Sync with Outlook / Office 365</p>
              </div>
            </div>
            {syncStatus?.outlook?.connected ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">Not Connected</Badge>
            )}
          </div>
          {syncStatus?.outlook?.connected ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => syncProvider('outlook')}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Sync Now
              </Button>
              <Button variant="outline" size="sm" onClick={() => disconnectProvider('outlook')}>
                <XCircle className="w-4 h-4 mr-1" />
                Disconnect
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => connectOutlookMutation.mutate()} 
              disabled={connectOutlookMutation.isPending}
              size="sm"
            >
              {connectOutlookMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Outlook'
              )}
            </Button>
          )}
          {syncStatus?.outlook?.lastSync && (
            <p className="text-xs text-slate-500">Last synced: {new Date(syncStatus.outlook.lastSync).toLocaleString()}</p>
          )}
        </div>

        {/* Apple iCloud */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white">
                <span className="text-lg">🍎</span>
              </div>
              <div>
                <h3 className="font-semibold">Apple iCloud</h3>
                <p className="text-sm text-slate-500">Sync with iCloud Calendar via CalDAV</p>
              </div>
            </div>
            {syncStatus?.apple?.connected ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">Not Connected</Badge>
            )}
          </div>
          {syncStatus?.apple?.connected ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => syncProvider('apple')}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Sync Now
              </Button>
              <Button variant="outline" size="sm" onClick={() => disconnectProvider('apple')}>
                <XCircle className="w-4 h-4 mr-1" />
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                Note: Apple iCloud requires an app-specific password. Generate one at appleid.apple.com
              </p>
              <Button 
                onClick={() => {
                  // TODO: Show dialog for credentials
                  toast({
                    title: 'Info',
                    description: 'Apple Calendar sync is not yet fully implemented. Please use iCal export/import.',
                  });
                }}
                size="sm"
              >
                Connect Apple Calendar
              </Button>
            </div>
          )}
          {syncStatus?.apple?.lastSync && (
            <p className="text-xs text-slate-500">Last synced: {new Date(syncStatus.apple.lastSync).toLocaleString()}</p>
          )}
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-slate-500">
            💡 Tip: Use iCal export/import for immediate synchronization with any calendar application.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}







