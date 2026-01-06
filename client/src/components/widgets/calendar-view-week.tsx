import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

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

interface CalendarViewWeekProps {
  currentDate: Date;
  operations: Operation[];
  timezone: string;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onOperationClick?: (operation: Operation) => void;
  onDeleteOperation: (e: React.MouseEvent, operationId: string) => void;
  isLoading?: boolean;
}

function getOperationDate(operation: Operation): Date {
  if (operation.operationDate instanceof Date) {
    return operation.operationDate;
  }
  return new Date(operation.operationDate);
}

function getHourFromTime(timeString: string | null): number {
  if (!timeString) return 0;
  const [hours] = timeString.split(':').map(Number);
  return hours || 0;
}

export default function CalendarViewWeek({
  currentDate,
  operations,
  timezone,
  onPreviousWeek,
  onNextWeek,
  onTimeSlotClick,
  onOperationClick,
  onDeleteOperation,
  isLoading = false,
}: CalendarViewWeekProps) {
  // Get start of week (Sunday)
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day;
  startOfWeek.setDate(diff);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDays.push(date);
  }

  const weekRange = `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getOperationsForDayAndHour = (date: Date, hour: number): Operation[] => {
    return operations.filter((op) => {
      const opDate = getOperationDate(op);
      const opHour = getHourFromTime(op.startTime);
      
      return (
        opDate.toDateString() === date.toDateString() &&
        opHour === hour
      );
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-slate-500">Loading operations...</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onPreviousWeek}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="font-semibold text-slate-900">{weekRange}</div>
        <Button variant="outline" size="sm" onClick={onNextWeek}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Week Grid */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-8 border-b bg-slate-50">
          <div className="p-2 text-xs font-semibold text-slate-600">Time</div>
          {weekDays.map((date) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div
                key={date.toISOString()}
                className={`p-2 text-center text-xs font-semibold border-l ${
                  isToday ? 'bg-purple-100 text-purple-900' : 'text-slate-600'
                }`}
              >
                <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="text-lg font-bold">{date.getDate()}</div>
              </div>
            );
          })}
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b min-h-[60px]">
              <div className="p-2 text-xs text-slate-500 border-r">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map((date) => {
                const dayOperations = getOperationsForDayAndHour(date, hour);
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={`${date.toISOString()}-${hour}`}
                    className={`border-l p-1 min-h-[60px] ${
                      isToday ? 'bg-purple-50' : 'bg-white'
                    } hover:bg-slate-50 cursor-pointer transition-colors`}
                    onClick={() => onTimeSlotClick?.(date, hour)}
                  >
                    {dayOperations.map((op) => (
                      <div
                        key={op.id}
                        className="text-xs text-white px-1 py-0.5 rounded mb-1 group relative"
                        style={{ backgroundColor: op.color || '#8b5cf6' }}
                        title={`${op.title}${op.startTime ? ` - ${op.startTime}` : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOperationClick?.(op);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate flex-1">{op.title}</span>
                          <button
                            onClick={(e) => onDeleteOperation(e, op.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {op.startTime && (
                          <div className="text-[10px] opacity-90">{op.startTime}</div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


