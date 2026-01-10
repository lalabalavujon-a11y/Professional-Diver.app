import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

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

const API_BASE = '/api/operations-calendar';

// Helper function to get date from operation
function getOperationDate(operation: Operation): Date {
  if (operation.operationDate instanceof Date) {
    return operation.operationDate;
  }
  return new Date(operation.operationDate);
}

// Helper function to format date for API
function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function OperationsCalendarShared() {
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shareToken, setShareToken] = useState<string | null>(null);

  // Extract share token from URL
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const token = pathParts[pathParts.length - 1];
    if (token && token !== 'shared') {
      setShareToken(token);
    }
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthName = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  // Calculate date range for API call
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  // Fetch operations using share token
  const { data: operations = [], isLoading, error } = useQuery<Operation[]>({
    queryKey: ['/api/operations-calendar/shared', shareToken, formatDateForAPI(startDate), formatDateForAPI(endDate)],
    queryFn: async () => {
      if (!shareToken) return [];
      
      const response = await fetch(
        `${API_BASE}?shareToken=${shareToken}&startDate=${formatDateForAPI(startDate)}&endDate=${formatDateForAPI(endDate)}`
      );
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Share link not found');
        }
        if (response.status === 410) {
          throw new Error('Share link has expired');
        }
        throw new Error('Failed to fetch operations');
      }
      return response.json();
    },
    enabled: !!shareToken,
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

  const days = [];
  // Empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  if (!shareToken) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Share Link</h1>
              <p className="text-sm text-gray-600 mb-4">
                The share link is invalid or missing.
              </p>
              <Button onClick={() => setLocation('/operations')}>
                Go to Operations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Calendar</h1>
              <p className="text-sm text-gray-600 mb-4">
                {error instanceof Error ? error.message : 'Failed to load calendar'}
              </p>
              <Button onClick={() => setLocation('/operations')}>
                Go to Operations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                Shared Operations Calendar
              </CardTitle>
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
                        className={`border rounded p-2 min-h-[80px] ${todayClass}`}
                      >
                        <div className="text-sm mb-1">{day}</div>
                        {dayOperations.length > 0 && (
                          <div className="space-y-0.5">
                            {dayOperations.slice(0, 2).map((op) => (
                              <div
                                key={op.id}
                                className="text-xs text-white px-1 py-0.5 rounded truncate"
                                style={{ backgroundColor: op.color || '#8b5cf6' }}
                                title={op.title}
                              >
                                {op.title}
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
      </div>
    </div>
  );
}







