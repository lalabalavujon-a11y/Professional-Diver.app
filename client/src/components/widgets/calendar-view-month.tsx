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

interface CalendarViewMonthProps {
  currentDate: Date;
  operations: Operation[];
  timezone: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (day: number) => void;
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

export default function CalendarViewMonth({
  currentDate,
  operations,
  timezone,
  onPreviousMonth,
  onNextMonth,
  onDayClick,
  onOperationClick,
  onDeleteOperation,
  isLoading = false,
}: CalendarViewMonthProps) {
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

  if (isLoading) {
    return (
      <div className="text-center py-8 text-slate-500">Loading operations...</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onPreviousMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="font-semibold text-slate-900">{monthName}</div>
        <Button variant="outline" size="sm" onClick={onNextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
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
            return <div key={`empty-${index}`} className="p-2 min-h-[80px]" />;
          }

          const dayOperations = getOperationsForDay(day);
          const todayClass = isToday(day)
            ? 'bg-purple-100 border-purple-300 font-semibold'
            : 'border-slate-200 hover:bg-slate-50';

          return (
            <div
              key={day}
              className={`border rounded p-2 min-h-[80px] ${todayClass} cursor-pointer relative transition-colors`}
              onClick={() => onDayClick(day)}
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
    </div>
  );
}







