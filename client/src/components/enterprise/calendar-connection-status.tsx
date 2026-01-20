/**
 * Calendar Connection Status Component
 * Displays connection status and sync information
 */

import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

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

interface CalendarConnectionStatusProps {
  connection: CalendarConnection;
}

export default function CalendarConnectionStatus({ connection }: CalendarConnectionStatusProps) {
  const getStatusIcon = () => {
    if (!connection.isActive) {
      return <XCircle className="w-4 h-4 text-muted-foreground" />;
    }
    if (connection.lastSyncAt) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    return <Clock className="w-4 h-4 text-yellow-600" />;
  };

  const getStatusText = () => {
    if (!connection.isActive) {
      return 'Inactive';
    }
    if (!connection.syncEnabled) {
      return 'Sync Disabled';
    }
    if (connection.lastSyncAt) {
      return 'Synced';
    }
    return 'Never Synced';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
        <Badge variant={connection.syncEnabled ? 'default' : 'secondary'}>
          {connection.syncDirection}
        </Badge>
      </div>

      {connection.lastSyncAt && (
        <div className="text-xs text-muted-foreground">
          Last synced: {format(new Date(connection.lastSyncAt), 'MMM d, yyyy h:mm a')}
        </div>
      )}

      {!connection.lastSyncAt && connection.isActive && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          No sync yet - will sync automatically
        </div>
      )}
    </div>
  );
}
