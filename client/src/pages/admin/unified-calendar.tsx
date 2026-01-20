/**
 * Super Admin Unified Calendar View
 * Displays events from all sources (Internal, Calendly, Google, HighLevel)
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { LoadingSpinner } from "@/components/ui/loading-states";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar as CalendarIcon,
  RefreshCw,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  ExternalLink,
  Sync
} from "lucide-react";
import { format } from "date-fns";
import CalendarEventDetail from "@/components/admin/calendar-event-detail";
import CalendarConflictResolver from "@/components/admin/calendar-conflict-resolver";
import CalendarAnalytics from "@/components/admin/calendar-analytics";

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

const SOURCE_COLORS: Record<string, string> = {
  internal: '#8b5cf6', // Purple
  calendly: '#3b82f6', // Blue
  google: '#dc2626', // Red
  highlevel: '#10b981', // Green
};

const SOURCE_LABELS: Record<string, string> = {
  internal: 'Internal',
  calendly: 'Calendly',
  google: 'Google',
  highlevel: 'HighLevel',
};

export default function UnifiedCalendar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days ahead
  });
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<UnifiedCalendarEvent | null>(null);
  const [showConflicts, setShowConflicts] = useState(false);

  // Fetch unified calendar events
  const { data: calendarData, isLoading, refetch } = useQuery<{
    events: UnifiedCalendarEvent[];
    conflicts: number;
    dateRange: { start: string; end: string };
  }>({
    queryKey: ['/api/admin/calendar/unified', dateRange, sourceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('startDate', dateRange.start.toISOString());
      params.append('endDate', dateRange.end.toISOString());
      if (sourceFilter !== 'all') {
        params.append('sources', sourceFilter);
      }
      const response = await fetch(`/api/admin/calendar/unified?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch unified calendar');
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: async (source?: string) => {
      const response = await fetch('/api/admin/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });
      if (!response.ok) throw new Error('Sync failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Sync started',
        description: 'Calendar sync initiated. Events will update shortly.',
      });
      setTimeout(() => refetch(), 2000);
    },
    onError: (error) => {
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Failed to sync calendars',
        variant: 'destructive',
      });
    },
  });

  // Get events for selected date
  const dayEvents = calendarData?.events.filter(event => {
    const eventDate = new Date(event.startTime);
    return (
      eventDate.getDate() === selectedDate.getDate() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getFullYear() === selectedDate.getFullYear()
    );
  }) || [];

  // Group events by source for stats
  const eventsBySource = calendarData?.events.reduce((acc, event) => {
    acc[event.source] = (acc[event.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="min-h-screen bg-background">
      <RoleBasedNavigation />
      <div className="container mx-auto py-8 px-4">
        <PageHeader
          title="Unified Calendar"
          description="Super Admin operational calendar - view all events from Internal CRM, Calendly, Google Calendar, and HighLevel"
          icon={<CalendarIcon className="w-8 h-8" />}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Events"
            value={calendarData?.events.length || 0}
            icon={<CalendarIcon />}
          />
          <StatCard
            title="Conflicts"
            value={calendarData?.conflicts || 0}
            icon={<AlertTriangle />}
            variant={calendarData && calendarData.conflicts > 0 ? 'destructive' : 'default'}
          />
          <StatCard
            title="Internal"
            value={eventsBySource.internal || 0}
            icon={<CheckCircle />}
          />
          <StatCard
            title="External"
            value={(eventsBySource.calendly || 0) + (eventsBySource.google || 0) + (eventsBySource.highlevel || 0)}
            icon={<ExternalLink />}
          />
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
            <Sync className="w-4 h-4 mr-2" />
            {syncMutation.isPending ? 'Syncing...' : 'Sync All Calendars'}
          </Button>
          <Button onClick={() => setShowConflicts(true)} variant="outline">
            <AlertTriangle className="w-4 h-4 mr-2" />
            View Conflicts ({calendarData?.conflicts || 0})
          </Button>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="calendly">Calendly</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="highlevel">HighLevel</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => refetch()} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                  <CardDescription>
                    {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              {/* Day Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Events for {format(selectedDate, 'MMM d, yyyy')}</CardTitle>
                  <CardDescription>{dayEvents.length} event(s)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : dayEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No events scheduled</p>
                  ) : (
                    dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <Badge
                            style={{ backgroundColor: SOURCE_COLORS[event.source] || '#gray' }}
                            className="text-white"
                          >
                            {SOURCE_LABELS[event.source]}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </div>
                          )}
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {event.attendees.length} attendee(s)
                            </div>
                          )}
                        </div>
                        {event.metadata.syncStatus === 'conflict' && (
                          <Badge variant="destructive" className="mt-2">
                            Conflict
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Events List */}
            <Card>
              <CardHeader>
                <CardTitle>All Events</CardTitle>
                <CardDescription>
                  Showing {calendarData?.events.length || 0} events from all sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingSpinner />
                ) : !calendarData || calendarData.events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events found</p>
                ) : (
                  <div className="space-y-2">
                    {calendarData.events.map((event) => (
                      <div
                        key={event.id}
                        className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{event.title}</h4>
                              <Badge
                                style={{ backgroundColor: SOURCE_COLORS[event.source] || '#gray' }}
                                className="text-white"
                              >
                                {SOURCE_LABELS[event.source]}
                              </Badge>
                              {event.metadata.syncStatus === 'conflict' && (
                                <Badge variant="destructive">Conflict</Badge>
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {format(new Date(event.startTime), 'MMM d, yyyy h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  {event.location}
                                </div>
                              )}
                              {event.description && (
                                <p className="mt-2">{event.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <CalendarAnalytics />
          </TabsContent>
        </Tabs>

        {/* Event Detail Dialog */}
        {selectedEvent && (
          <CalendarEventDetail
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onSync={() => {
              syncMutation.mutate(selectedEvent.source);
              setSelectedEvent(null);
            }}
          />
        )}

        {/* Conflict Resolver Dialog */}
        {showConflicts && (
          <CalendarConflictResolver
            onClose={() => setShowConflicts(false)}
            onResolved={() => {
              refetch();
              setShowConflicts(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
