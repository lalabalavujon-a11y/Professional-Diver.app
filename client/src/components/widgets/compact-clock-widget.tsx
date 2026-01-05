import { Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CompactClockWidgetProps {
  timezone: string;
  clockType: 'digital' | 'analog';
}

export default function CompactClockWidget({ timezone, clockType }: CompactClockWidgetProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  if (clockType === 'digital') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
        <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-slate-900 leading-tight">{formatTime(currentTime)}</div>
          <div className="text-xs text-slate-500 leading-tight">{formatDate(currentTime)}</div>
        </div>
      </div>
    );
  }

  // Analog clock (compact version)
  const seconds = currentTime.getSeconds();
  const minutes = currentTime.getMinutes();
  const hours = currentTime.getHours();

  const secondDeg = (seconds / 60) * 360;
  const minuteDeg = (minutes / 60) * 360 + (seconds / 60) * 6;
  const hourDeg = (hours / 12) * 360 + (minutes / 60) * 30;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
      <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
      <div className="relative w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center flex-shrink-0">
        <div
          className="absolute bg-slate-700 h-3 w-0.5 rounded-full origin-bottom"
          style={{ transform: `translateY(-50%) rotate(${hourDeg}deg)` }}
        ></div>
        <div
          className="absolute bg-slate-500 h-4 w-0.5 rounded-full origin-bottom"
          style={{ transform: `translateY(-50%) rotate(${minuteDeg}deg)` }}
        ></div>
        <div
          className="absolute bg-red-500 h-4 w-0.5 rounded-full origin-bottom"
          style={{ transform: `translateY(-50%) rotate(${secondDeg}deg)` }}
        ></div>
        <div className="absolute w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
      </div>
      <div className="flex flex-col">
        <div className="text-xs font-medium text-slate-700 leading-tight">{formatDate(currentTime)}</div>
        <div className="text-xs text-slate-500 leading-tight">{timezone.split('/').pop()?.replace('_', ' ')}</div>
      </div>
    </div>
  );
}

