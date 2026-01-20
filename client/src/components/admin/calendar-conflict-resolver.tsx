/**
 * Calendar Conflict Resolver Component
 * Displays and resolves calendar conflicts
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-states";
import { AlertTriangle, CheckCircle, Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

interface CalendarConflict {
  id: string;
  type: 'time_overlap' | 'duplicate' | 'resource';
  severity: 'low' | 'medium' | 'high';
  eventIds: string[];
  detectedAt: string;
  resolvedAt?: string;
  resolution?: 'local_wins' | 'remote_wins' | 'newest_wins' | 'manual';
  resolvedBy?: string;
}

interface CalendarConflictResolverProps {
  onClose: () => void;
  onResolved: () => void;
}

export default function CalendarConflictResolver({ onClose, onResolved }: CalendarConflictResolverProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConflict, setSelectedConflict] = useState<CalendarConflict | null>(null);
  const [resolution, setResolution] = useState<string>('');

  // Fetch conflicts
  const { data: conflictsData, isLoading } = useQuery<{ conflicts: CalendarConflict[] }>({
    queryKey: ['/api/admin/calendar/conflicts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/calendar/conflicts?resolved=false');
      if (!response.ok) throw new Error('Failed to fetch conflicts');
      return response.json();
    },
  });

  // Resolve conflict mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ conflictId, resolution }: { conflictId: string; resolution: string }) => {
      const response = await fetch(`/api/admin/calendar/conflicts/${conflictId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution }),
      });
      if (!response.ok) throw new Error('Failed to resolve conflict');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Conflict resolved',
        description: 'The conflict has been resolved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/calendar/conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/calendar/unified'] });
      setSelectedConflict(null);
      onResolved();
    },
    onError: (error) => {
      toast({
        title: 'Resolution failed',
        description: error instanceof Error ? error.message : 'Failed to resolve conflict',
        variant: 'destructive',
      });
    },
  });

  const conflicts = conflictsData?.conflicts || [];
  const unresolvedConflicts = conflicts.filter(c => !c.resolvedAt);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'time_overlap': return 'Time Overlap';
      case 'duplicate': return 'Duplicate Event';
      case 'resource': return 'Resource Conflict';
      default: return type;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Calendar Conflicts
          </DialogTitle>
          <DialogDescription>
            {unresolvedConflicts.length} unresolved conflict(s) detected
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingSpinner />
        ) : unresolvedConflicts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-medium">No conflicts detected</p>
            <p className="text-sm text-muted-foreground mt-2">
              All calendar events are synchronized without conflicts.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {unresolvedConflicts.map((conflict) => (
              <div
                key={conflict.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={getSeverityColor(conflict.severity)}>
                      {conflict.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      {getTypeLabel(conflict.type)}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Detected: {format(new Date(conflict.detectedAt), 'MMM d, h:mm a')}
                  </span>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>
                    {conflict.type === 'time_overlap' && 'Events overlap in time'}
                    {conflict.type === 'duplicate' && 'Duplicate events detected'}
                    {conflict.type === 'resource' && 'Resource conflict (same location/time)'}
                  </p>
                  <p className="mt-1">
                    Affected events: {conflict.eventIds.length}
                  </p>
                </div>

                {selectedConflict?.id === conflict.id ? (
                  <div className="border-t pt-3 space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Resolution Strategy
                      </label>
                      <Select value={resolution} onValueChange={setResolution}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select resolution" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local_wins">Local Wins (Internal CRM takes precedence)</SelectItem>
                          <SelectItem value="remote_wins">Remote Wins (External source takes precedence)</SelectItem>
                          <SelectItem value="newest_wins">Newest Wins (Most recent update)</SelectItem>
                          <SelectItem value="manual">Manual Review (Flag for later)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (resolution) {
                            resolveMutation.mutate({
                              conflictId: conflict.id,
                              resolution,
                            });
                          }
                        }}
                        disabled={!resolution || resolveMutation.isPending}
                        size="sm"
                      >
                        {resolveMutation.isPending ? 'Resolving...' : 'Resolve Conflict'}
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedConflict(null);
                          setResolution('');
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setSelectedConflict(conflict)}
                    variant="outline"
                    size="sm"
                  >
                    Resolve
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
