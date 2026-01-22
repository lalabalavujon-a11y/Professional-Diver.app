/**
 * Calendar Event Detail Component
 * Shows full details of a calendar event with sync status
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  MapPin, 
  Users, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Calendar as CalendarIcon
} from "lucide-react";
import { format } from "date-fns";

interface UnifiedCalendarEvent {
  id: string;
  source: 'internal' | 'calendly' | 'google' | 'highlevel';
  sourceId: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
  attendees?: Array<{ email: string; name?: string }>;
  metadata: {
    clientId?: string;
    eventUri?: string;
    calendarId?: string;
    syncStatus: 'synced' | 'pending' | 'conflict';
    lastSyncedAt?: string;
  };
  color?: string;
  allDay?: boolean;
}

interface CalendarEventDetailProps {
  event: UnifiedCalendarEvent;
  onClose: () => void;
  onSync?: () => void;
}

const SOURCE_COLORS: Record<string, string> = {
  internal: '#8b5cf6',
  calendly: '#3b82f6',
  google: '#dc2626',
  highlevel: '#10b981',
};

const SOURCE_LABELS: Record<string, string> = {
  internal: 'Internal CRM',
  calendly: 'Calendly',
  google: 'Google Calendar',
  highlevel: 'HighLevel',
};

export default function CalendarEventDetail({ event, onClose, onSync }: CalendarEventDetailProps) {
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)); // minutes

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{event.title}</DialogTitle>
            <Badge
              style={{ backgroundColor: SOURCE_COLORS[event.source] || '#gray' }}
              className="text-white"
            >
              {SOURCE_LABELS[event.source]}
            </Badge>
          </div>
          <DialogDescription>
            Event details and sync information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Time Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Date & Time</span>
            </div>
            <div className="pl-6 space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>
                  {format(startDate, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="pl-6">
                {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                {event.allDay && <span className="text-muted-foreground ml-2">(All Day)</span>}
              </div>
              <div className="text-sm text-muted-foreground pl-6">
                Duration: {duration} minutes
              </div>
            </div>
          </div>

          <Separator />

          {/* Location */}
          {event.location && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Location</span>
                </div>
                <p className="pl-6">{event.location}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Attendees ({event.attendees.length})</span>
                </div>
                <div className="pl-6 space-y-1">
                  {event.attendees.map((attendee, idx) => (
                    <div key={idx} className="text-sm">
                      {attendee.name ? `${attendee.name} (${attendee.email})` : attendee.email}
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Description */}
          {event.description && (
            <>
              <div className="space-y-2">
                <span className="font-medium text-sm">Description</span>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Sync Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Sync Status</span>
            </div>
            <div className="pl-6 space-y-2">
              <div className="flex items-center gap-2">
                {event.metadata.syncStatus === 'synced' ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Synced</span>
                  </>
                ) : event.metadata.syncStatus === 'conflict' ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">Conflict Detected</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm">Pending Sync</span>
                  </>
                )}
              </div>
              {event.metadata.lastSyncedAt && (
                <div className="text-xs text-muted-foreground">
                  Last synced: {format(new Date(event.metadata.lastSyncedAt), 'MMM d, yyyy h:mm a')}
                </div>
              )}
              {event.metadata.eventUri && (
                <div className="text-xs text-muted-foreground">
                  Event URI: {event.metadata.eventUri}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {onSync && (
              <Button onClick={onSync} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Now
              </Button>
            )}
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
