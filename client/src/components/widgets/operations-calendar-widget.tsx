import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Share2, Copy, Check, Filter, CalendarDays, CalendarRange, Calendar as CalendarIcon, List, Download, Upload, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CalendarViewMonth from './calendar-view-month';
import CalendarViewWeek from './calendar-view-week';
import CalendarViewDay from './calendar-view-day';
import CalendarViewList from './calendar-view-list';
import { CalendarFiltersComponent, CalendarFilters } from './calendar-filters';
import CalendarSyncSettings from '@/components/calendar-sync-settings';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

type ViewMode = 'month' | 'week' | 'day' | 'list';

export default function OperationsCalendarWidget({ timezone }: OperationsCalendarWidgetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Load view mode from localStorage or default to 'month'
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('calendarViewMode');
    return (saved as ViewMode) || 'month';
  });
  
  // Save view mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('calendarViewMode', viewMode);
  }, [viewMode]);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSyncSettingsOpen, setIsSyncSettingsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  
  // Filters state
  const [filters, setFilters] = useState<CalendarFilters>({
    search: '',
    type: 'ALL',
    status: 'ALL',
    dateFrom: '',
    dateTo: '',
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate date range for API call based on view mode
  let startDate: Date;
  let endDate: Date;
  
  if (viewMode === 'list') {
    // For list view, fetch a wider range (3 months back, 6 months forward)
    startDate = new Date(year, month - 3, 1);
    endDate = new Date(year, month + 6, 0);
  } else if (viewMode === 'week') {
    // For week view, get the week range
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day;
    startDate = new Date(currentDate);
    startDate.setDate(diff);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
  } else if (viewMode === 'day') {
    // For day view, just the current day
    startDate = new Date(currentDate);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(currentDate);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Month view - current month
    startDate = new Date(year, month, 1);
    endDate = new Date(year, month + 1, 0);
  }

  // Fetch operations
  const { data: allOperations = [], isLoading } = useQuery<Operation[]>({
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

  // Apply filters to operations
  const operations = allOperations.filter((op) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        op.title.toLowerCase().includes(searchLower) ||
        (op.description && op.description.toLowerCase().includes(searchLower)) ||
        (op.location && op.location.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }

    // Type filter
    if (filters.type !== 'ALL' && op.type !== filters.type) {
      return false;
    }

    // Status filter
    if (filters.status !== 'ALL' && op.status !== filters.status) {
      return false;
    }

    // Date range filters
    const opDate = getOperationDate(op);
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (opDate < fromDate) return false;
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (opDate > toDate) return false;
    }

    return true;
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

  // Update operation mutation (for drag & drop)
  const updateOperationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Operation> }) => {
      const email = getUserEmail();
      const response = await fetch(`${API_BASE}/${id}?email=${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': email,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update operation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/operations-calendar'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update operation. Please try again.',
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


  // Navigation handlers for different view modes
  const previousPeriod = () => {
    if (viewMode === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    } else if (viewMode === 'day') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    } else if (viewMode === 'day') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddOperation = (day?: number) => {
    if (day !== undefined) {
      setSelectedDay(day);
      const date = new Date(year, month, day);
      setCurrentDate(date);
    }
    setIsAddDialogOpen(true);
  };

  const handleAddOperationAtTime = (date: Date, hour: number) => {
    const newDate = new Date(date);
    newDate.setHours(hour, 0, 0, 0);
    setCurrentDate(newDate);
    setSelectedDay(newDate.getDate());
    setIsAddDialogOpen(true);
  };

  const handleDeleteOperation = (e: React.MouseEvent, operationId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this operation?')) {
      deleteOperationMutation.mutate(operationId);
    }
  };

  const handleOperationClick = (operation: Operation) => {
    setSelectedOperation(operation);
    setIsAddDialogOpen(true);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleAddOperation();
      } else if (e.key === 'ArrowLeft' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        previousPeriod();
      } else if (e.key === 'ArrowRight' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        nextPeriod();
      } else if (e.key === 't' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        goToToday();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [viewMode, year, month, currentDate]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const operationId = active.id as string;
    const targetDate = over.data.current?.date as Date | undefined;
    const targetHour = over.data.current?.hour as number | undefined;

    if (targetDate) {
      const operation = operations.find(op => op.id === operationId);
      if (operation) {
        const newDate = new Date(targetDate);
        if (targetHour !== undefined) {
          newDate.setHours(targetHour, 0, 0, 0);
          // Update start time if it exists
          const newStartTime = `${targetHour.toString().padStart(2, '0')}:00`;
          updateOperationMutation.mutate({
            id: operationId,
            data: {
              operationDate: newDate.toISOString(),
              startTime: newStartTime,
            },
          });
        } else {
          // Just update the date, keep the time if it exists
          newDate.setHours(
            operation.startTime ? parseInt(operation.startTime.split(':')[0]) : 0,
            operation.startTime ? parseInt(operation.startTime.split(':')[1]) : 0,
            0,
            0
          );
          updateOperationMutation.mutate({
            id: operationId,
            data: {
              operationDate: newDate.toISOString(),
            },
          });
        }
      }
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: 'ALL',
      status: 'ALL',
      dateFrom: '',
      dateTo: '',
    });
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

  // Export iCal mutation
  const exportICalMutation = useMutation({
    mutationFn: async () => {
      const email = getUserEmail();
      const params = new URLSearchParams({
        email: encodeURIComponent(email),
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
      });
      
      const response = await fetch(`${API_BASE}/export/ical?${params}`, {
        headers: {
          'x-user-email': email,
        },
      });
      
      if (!response.ok) throw new Error('Failed to export calendar');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `operations-calendar-${formatDateForAPI(new Date())}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: 'Calendar Exported',
        description: 'Your calendar has been exported as an iCal file.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to export calendar. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Import iCal mutation
  const importICalMutation = useMutation({
    mutationFn: async (file: File) => {
      const email = getUserEmail();
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE}/import/ical`, {
        method: 'POST',
        headers: {
          'x-user-email': email,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to import calendar');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/operations-calendar'] });
      setIsImportDialogOpen(false);
      toast({
        title: 'Calendar Imported',
        description: `Successfully imported ${data.imported} operation(s).`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to import calendar. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Operations Calendar
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => exportICalMutation.mutate()}
              disabled={exportICalMutation.isPending}
            >
              <Download className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Import</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Calendar</DialogTitle>
                  <DialogDescription>
                    Import operations from an iCal (.ics) file.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="ical-file">Select iCal File</Label>
                    <Input
                      id="ical-file"
                      type="file"
                      accept=".ics"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          importICalMutation.mutate(file);
                        }
                      }}
                      disabled={importICalMutation.isPending}
                    />
                  </div>
                  {importICalMutation.isPending && (
                    <div className="text-sm text-slate-500">Importing calendar...</div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Share</span>
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
            
            <Dialog open={isSyncSettingsOpen} onOpenChange={setIsSyncSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Sync</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Calendar Synchronization</DialogTitle>
                  <DialogDescription>
                    Connect and sync your calendar with external services.
                  </DialogDescription>
                </DialogHeader>
                <CalendarSyncSettings />
              </DialogContent>
            </Dialog>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            New Operation
          </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] md:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedOperation ? 'Edit Operation' : 'Add New Operation'}</DialogTitle>
                  <DialogDescription>
                    {selectedOperation ? 'Update the operation details.' : 'Add a new operation to your calendar.'}
                  </DialogDescription>
                </DialogHeader>
                <AddOperationForm
                  selectedDay={selectedDay}
                  month={month}
                  year={year}
                  selectedOperation={selectedOperation}
                  onSubmit={(data) => {
                    if (selectedOperation) {
                      // Update existing operation
                      updateOperationMutation.mutate({
                        id: selectedOperation.id,
                        data,
                      });
                      setSelectedOperation(null);
                    } else {
                      // Create new operation
                      createOperationMutation.mutate(data);
                    }
                    setIsAddDialogOpen(false);
                  }}
                  onCancel={() => {
                    setIsAddDialogOpen(false);
                    setSelectedOperation(null);
                  }}
                />
              </DialogContent>
            </Dialog>
            
            {/* View Mode Selector */}
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="w-full md:w-auto">
                <TabsList className="grid w-full grid-cols-4 md:w-auto">
                  <TabsTrigger value="month" className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    <span className="hidden sm:inline">Month</span>
                  </TabsTrigger>
                  <TabsTrigger value="week" className="flex items-center gap-1">
                    <CalendarRange className="w-4 h-4" />
                    <span className="hidden sm:inline">Week</span>
                  </TabsTrigger>
                  <TabsTrigger value="day" className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Day</span>
                  </TabsTrigger>
                  <TabsTrigger value="list" className="flex items-center gap-1">
                    <List className="w-4 h-4" />
                    <span className="hidden sm:inline">List</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {/* Filters Toggle */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Button
              variant={isFiltersOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            >
              <Filter className="w-4 h-4 mr-1" />
              Filters
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
          
          {/* Filters Panel */}
          {isFiltersOpen && (
            <CalendarFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={clearFilters}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="space-y-4">
            {viewMode === 'month' && (
              <CalendarViewMonth
                currentDate={currentDate}
                operations={operations}
                timezone={timezone}
                onPreviousMonth={previousPeriod}
                onNextMonth={nextPeriod}
                onDayClick={handleAddOperation}
                onOperationClick={handleOperationClick}
                onDeleteOperation={handleDeleteOperation}
                isLoading={isLoading}
              />
            )}
            
            {viewMode === 'week' && (
              <CalendarViewWeek
                currentDate={currentDate}
                operations={operations}
                timezone={timezone}
                onPreviousWeek={previousPeriod}
                onNextWeek={nextPeriod}
                onTimeSlotClick={handleAddOperationAtTime}
                onOperationClick={handleOperationClick}
                onDeleteOperation={handleDeleteOperation}
                isLoading={isLoading}
              />
            )}
            
            {viewMode === 'day' && (
              <CalendarViewDay
                currentDate={currentDate}
                operations={operations}
                timezone={timezone}
                onPreviousDay={previousPeriod}
                onNextDay={nextPeriod}
                onTimeSlotClick={handleAddOperationAtTime}
                onOperationClick={handleOperationClick}
                onDeleteOperation={handleDeleteOperation}
                isLoading={isLoading}
              />
            )}
            
            {viewMode === 'list' && (
              <CalendarViewList
                operations={operations}
                onOperationClick={handleOperationClick}
                onDeleteOperation={handleDeleteOperation}
                isLoading={isLoading}
              />
            )}
          </div>
        </DndContext>
      </CardContent>
      
      {/* Floating Action Button for Quick Add */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
          onClick={() => handleAddOperation()}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </Card>
  );
}

interface AddOperationFormProps {
  selectedDay: number | null;
  month: number;
  year: number;
  selectedOperation?: Operation | null;
  onSubmit: (data: Partial<Operation>) => void;
  onCancel: () => void;
}

function AddOperationForm({ selectedDay, month, year, selectedOperation, onSubmit, onCancel }: AddOperationFormProps) {
  const getOperationDate = (op: Operation): Date => {
    if (op.operationDate instanceof Date) return op.operationDate;
    return new Date(op.operationDate);
  };

  const [formData, setFormData] = useState({
    title: selectedOperation?.title || '',
    description: selectedOperation?.description || '',
    operationDate: selectedOperation 
      ? formatDateForAPI(getOperationDate(selectedOperation))
      : selectedDay 
        ? formatDateForAPI(new Date(year, month, selectedDay)) 
        : formatDateForAPI(new Date()),
    startTime: selectedOperation?.startTime || '',
    endTime: selectedOperation?.endTime || '',
    location: selectedOperation?.location || '',
    type: (selectedOperation?.type || 'DIVE') as Operation['type'],
    status: (selectedOperation?.status || 'SCHEDULED') as Operation['status'],
    color: selectedOperation?.color || '#8b5cf6',
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
        <Button type="submit">{selectedOperation ? 'Update Operation' : 'Add Operation'}</Button>
      </DialogFooter>
    </form>
  );
}
