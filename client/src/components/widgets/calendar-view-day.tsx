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

interface CalendarViewDayProps {
  currentDate: Date;
  operations: Operation[];
  timezone: string;
  onPreviousDay: () => void;
  onNextDay: () => void;
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

function getMinutesFromTime(timeString: string | null): number {
  if (!timeString) return 0;
  const [, minutes] = timeString.split(':').map(Number);
  return minutes || 0;
}

export default function CalendarViewDay({
  currentDate,
  operations,
  timezone,
  onPreviousDay,
  onNextDay,
  onTimeSlotClick,
  onOperationClick,
  onDeleteOperation,
  isLoading = false,
}: CalendarViewDayProps) {
  const dayName = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const isToday = currentDate.toDateString() === new Date().toDateString();

  const getOperationsForDate = (date: Date): Operation[] => {
    return operations.filter((op) => {
      const opDate = getOperationDate(op);
      return opDate.toDateString() === date.toDateString();
    });
  };

  const dayOperations = getOperationsForDate(currentDate);

  // Calculate position for each operation
  const getOperationStyle = (op: Operation): React.CSSProperties => {
    const startHour = getHourFromTime(op.startTime);
    const startMinutes = getMinutesFromTime(op.startTime);
    const endHour = op.endTime ? getHourFromTime(op.endTime) : startHour + 1;
    const endMinutes = op.endTime ? getMinutesFromTime(op.endTime) : 0;

    const startOffset = startHour * 60 + startMinutes;
    const duration = (endHour * 60 + endMinutes) - startOffset;
    const top = `${(startOffset / 60) * 100}%`;
    const height = `${(duration / 60) * 100}%`;

    return {
      top,
      height,
      backgroundColor: op.color || '#8b5cf6',
    };
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-slate-500">Loading operations...</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Day Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onPreviousDay}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className={`font-semibold ${isToday ? 'text-purple-600' : 'text-slate-900'}`}>
          {dayName}
        </div>
        <Button variant="outline" size="sm" onClick={onNextDay}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day Grid */}
      <div className="border rounded-lg overflow-hidden">
        <div className="relative">
          {/* Hour slots */}
          {hours.map((hour) => (
            <div
              key={hour}
              className={`grid grid-cols-12 border-b min-h-[80px] ${
                isToday && hour === new Date().getHours() ? 'bg-purple-50' : ''
              }`}
            >
              <div className="p-2 text-xs text-slate-500 border-r col-span-1">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div
                className="col-span-11 p-1 relative hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => onTimeSlotClick?.(currentDate, hour)}
              >
                {/* Operations positioned absolutely */}
                {dayOperations
                  .filter((op) => {
                    const opHour = getHourFromTime(op.startTime);
                    return opHour === hour || (opHour < hour && op.endTime && getHourFromTime(op.endTime) > hour);
                  })
                  .map((op) => (
                    <div
                      key={op.id}
                      className="absolute left-1 right-1 text-xs text-white px-2 py-1 rounded mb-1 group"
                      style={getOperationStyle(op)}
                      title={`${op.title}${op.startTime ? ` ${op.startTime}` : ''}${op.endTime ? ` - ${op.endTime}` : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOperationClick?.(op);
                      }}
                    >
                      <div className="flex items-center justify-between h-full">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{op.title}</div>
                          {op.startTime && op.endTime && (
                            <div className="text-[10px] opacity-90">
                              {op.startTime} - {op.endTime}
                            </div>
                          )}
                          {op.location && (
                            <div className="text-[10px] opacity-75 truncate">{op.location}</div>
                          )}
                        </div>
                        <button
                          onClick={(e) => onDeleteOperation(e, op.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

