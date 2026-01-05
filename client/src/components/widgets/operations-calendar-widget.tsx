import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Share2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OperationsCalendarWidgetProps {
  timezone: string;
}

interface Operation {
  id: string;
  title: string;
  description?: string | null;
  operationDate: string | Date;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  type: 'DIVE' | 'INSPECTION' | 'MAINTENANCE' | 'TRAINING' | 'OTHER';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  color?: string | null;
}

interface ShareLink {
  id: string;
  shareToken: string;
  isPublic: boolean;
  expiresAt?: string | Date | null;
  createdAt?: string | Date;
}


const API_BASE = '/api/operations-calendar';

// Helper function to get user email for API calls
function getUserEmail(): string {
  return localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
}

// Helper function to format date for API
function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper function to get date from operation
function getOperationDate(operation: Operation): Date {
  if (operation.operationDate instanceof Date) {
    return operation.operationDate;
  }
  return new Date(operation.operationDate);
}

export default function OperationsCalendarWidget({ timezone }: OperationsCalendarWidgetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthName = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  // Calculate date range for API call
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  // Fetch operations
  const { data: operations = [], isLoading } = useQuery<Operation[]>({
    queryKey: ['/api/operations-calendar', formatDateForAPI(startDate), formatDateForAPI(endDate)],
    queryFn: async () => {
      const email = getUserEmail();
      const response = await fetch(
        `${API_BASE}?email=${encodeURIComponent(email)}&startDate=${formatDateForAPI(startDate)}&endDate=${formatDateForAPI(endDate)}`,
        {
          headers: {
            'x-user-email': email,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch operations');
      return response.json();
    },
  });

  // Fetch share links
  const { data: shareLinks = [], refetch: refetchShareLinks } = useQuery<ShareLink[]>({
    queryKey: ['/api/operations-calendar/share-links'],
    queryFn: async () => {
      const email = getUserEmail();
      const response = await fetch(`${API_BASE}/share-links?email=${encodeURIComponent(email)}`, {
        headers: {
          'x-user-email': email,
        },
      });
      if (!response.ok) {
        // If no share links exist yet, return empty array
        if (response.status === 404 || response.status === 401) {
          return [];
        }
        throw new Error('Failed to fetch share links');
      }
      return response.json();
    },
    enabled: isShareDialogOpen, // Only fetch when dialog is open
  });


  // Create operation mutation
  const createOperationMutation = useMutation({
    mutationFn: async (data: Partial<Operation>) => {
      const email = getUserEmail();
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': email,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create operation' }));
        throw new Error(errorData.error || `Failed to create operation: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/operations-calendar'] });
      setIsAddDialogOpen(false);
      toast({
        title: 'Operation Created',
        description: 'The operation has been added to your calendar.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create operation. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete operation mutation
  const deleteOperationMutation = useMutation({
    mutationFn: async (id: string) => {
      const email = getUserEmail();
      const response = await fetch(`${API_BASE}/${id}?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': email,
        },
      });
      if (!response.ok) throw new Error('Failed to delete operation');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/operations-calendar'] });
      toast({
        title: 'Operation Deleted',
        description: 'The operation has been removed from your calendar.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete operation. Please try again.',
        variant: 'destructive',
      });
    },
  });


  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const getOperationsForDay = (day: number): Operation[] => {
    const targetDate = new Date(year, month, day);
    return operations.filter((op) => {
      const opDate = getOperationDate(op);
      return (
        opDate.getDate() === targetDate.getDate() &&
        opDate.getMonth() === targetDate.getMonth() &&
        opDate.getFullYear() === targetDate.getFullYear()
      );
    });
  };

  const handleAddOperation = (day: number) => {
    setSelectedDay(day);
    setIsAddDialogOpen(true);
  };

  const handleDeleteOperation = (e: React.MouseEvent, operationId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this operation?')) {
      deleteOperationMutation.mutate(operationId);
    }
  };

  // Create share link mutation
  const createShareLinkMutation = useMutation({
    mutationFn: async (data: { isPublic?: boolean; expiresAt?: string }) => {
      const email = getUserEmail();
      const response = await fetch(`${API_BASE}/share-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': email,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create share link');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/operations-calendar/share-links'] });
      refetchShareLinks();
      toast({
        title: 'Share Link Created',
        description: 'Your calendar share link has been created.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create share link. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleCopyShareUrl = (shareToken: string) => {
    const shareUrl = `${window.location.origin}/operations-calendar/shared/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedItem(`share-${shareToken}`);
    toast({
      title: 'Link Copied!',
      description: 'The share link has been copied to your clipboard.',
    });
    setTimeout(() => setCopiedItem(null), 2000);
  };



  const days = [];
  // Empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            Operations Calendar
          </CardTitle>
          <div className="flex gap-2">
            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Share Calendar</DialogTitle>
                  <DialogDescription>
                    Create a shareable link for your operations calendar.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Create New Share Link</Label>
                      <p className="text-xs text-slate-500 mt-1">
                        Generate a shareable link for your calendar
                      </p>
                    </div>
                    <Button
                      onClick={() => createShareLinkMutation.mutate({ isPublic: false })}
                      size="sm"
                      disabled={createShareLinkMutation.isPending}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Create Link
                    </Button>
                  </div>
                  
                  {shareLinks.length > 0 && (
                    <div className="space-y-3">
                      <Label>Existing Share Links</Label>
                      {shareLinks.map((link) => {
                        const shareUrl = `${window.location.origin}/operations-calendar/shared/${link.shareToken}`;
                        const shareKey = `share-${link.shareToken}`;
                        
                        return (
                          <div key={link.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium mb-1">Share Link</div>
                                <div className="text-xs text-slate-500 break-all font-mono bg-slate-50 p-2 rounded">
                                  {shareUrl}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyShareUrl(link.shareToken)}
                                className="ml-2 flex-shrink-0"
                              >
                                {copiedItem === shareKey ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {shareLinks.length === 0 && !createShareLinkMutation.isPending && (
                    <div className="text-center py-4 text-slate-500 text-sm">
                      No share links created yet. Click "Create Link" to generate one.
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            New Operation
          </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Operation</DialogTitle>
                  <DialogDescription>
                    Add a new operation to your calendar.
                  </DialogDescription>
                </DialogHeader>
                <AddOperationForm
                  selectedDay={selectedDay}
                  month={month}
                  year={year}
                  onSubmit={(data) => {
                    createOperationMutation.mutate(data);
                  }}
                  onCancel={() => setIsAddDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="font-semibold text-slate-900">{monthName}</div>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading operations...</div>
          ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-slate-500 p-1">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="p-2" />;
              }

              const dayOperations = getOperationsForDay(day);
              const todayClass = isToday(day)
                ? 'bg-purple-100 border-purple-300 font-semibold'
                : 'border-slate-200 hover:bg-slate-50';

              return (
                <div
                  key={day}
                    className={`border rounded p-2 min-h-[80px] ${todayClass} cursor-pointer relative`}
                    onClick={() => handleAddOperation(day)}
                >
                  <div className="text-sm mb-1">{day}</div>
                  {dayOperations.length > 0 && (
                    <div className="space-y-0.5">
                        {dayOperations.slice(0, 2).map((op) => (
                        <div
                            key={op.id}
                            className="text-xs text-white px-1 py-0.5 rounded truncate group relative"
                            style={{ backgroundColor: op.color || '#8b5cf6' }}
                          title={op.title}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate flex-1">{op.title}</span>
                              <button
                                onClick={(e) => handleDeleteOperation(e, op.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                        </div>
                      ))}
                      {dayOperations.length > 2 && (
                        <div className="text-xs text-slate-500">
                          +{dayOperations.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface AddOperationFormProps {
  selectedDay: number | null;
  month: number;
  year: number;
  onSubmit: (data: Partial<Operation>) => void;
  onCancel: () => void;
}

function AddOperationForm({ selectedDay, month, year, onSubmit, onCancel }: AddOperationFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    operationDate: selectedDay ? formatDateForAPI(new Date(year, month, selectedDay)) : formatDateForAPI(new Date()),
    startTime: '',
    endTime: '',
    location: '',
    type: 'DIVE' as Operation['type'],
    status: 'SCHEDULED' as Operation['status'],
    color: '#8b5cf6',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure operationDate is in the correct format (YYYY-MM-DD)
    const submitData = {
      ...formData,
      operationDate: formData.operationDate, // Already in YYYY-MM-DD format from date input
      description: formData.description || undefined,
      startTime: formData.startTime || undefined,
      endTime: formData.endTime || undefined,
      location: formData.location || undefined,
    };
    
    console.log('Submitting operation:', submitData);
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="operationDate">Date *</Label>
        <Input
          id="operationDate"
          type="date"
          value={formData.operationDate}
          onChange={(e) => setFormData({ ...formData, operationDate: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as Operation['type'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DIVE">Dive</SelectItem>
              <SelectItem value="INSPECTION">Inspection</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              <SelectItem value="TRAINING">Training</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as Operation['status'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="color">Color</Label>
        <div className="flex items-center gap-2">
          <Input
            id="color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="flex-1"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add Operation</Button>
      </DialogFooter>
    </form>
  );
}
