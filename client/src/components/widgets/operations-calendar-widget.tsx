import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface OperationsCalendarWidgetProps {
  timezone: string;
}

export default function OperationsCalendarWidget({ timezone }: OperationsCalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // Placeholder operations data
  const operations = [
    { day: 5, title: 'Dive Operation A' },
    { day: 12, title: 'Inspection B' },
    { day: 18, title: 'Maintenance C' },
    { day: 25, title: 'Training Session' },
  ];

  const getOperationsForDay = (day: number) => {
    return operations.filter((op) => op.day === day);
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
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            New Operation
          </Button>
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
                  className={`border rounded p-2 min-h-[60px] ${todayClass}`}
                >
                  <div className="text-sm mb-1">{day}</div>
                  {dayOperations.length > 0 && (
                    <div className="space-y-0.5">
                      {dayOperations.slice(0, 2).map((op, idx) => (
                        <div
                          key={idx}
                          className="text-xs bg-purple-500 text-white px-1 py-0.5 rounded truncate"
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
        </div>
      </CardContent>
    </Card>
  );
}

