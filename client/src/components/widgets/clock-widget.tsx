import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface ClockWidgetProps {
  timezone: string;
  clockType: 'digital' | 'analog';
}

export default function ClockWidget({ timezone, clockType }: ClockWidgetProps) {
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
      hour12: true,
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

  const getTimeForAnalog = (date: Date) => {
    const hours = parseInt(new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(date));
    const minutes = parseInt(new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      minute: '2-digit',
    }).format(date));
    const seconds = parseInt(new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      second: '2-digit',
    }).format(date));

    return {
      hours: (hours % 12) * 30 + minutes * 0.5,
      minutes: minutes * 6,
      seconds: seconds * 6,
    };
  };

  if (clockType === 'analog') {
    const { hours, minutes, seconds } = getTimeForAnalog(currentTime);
    const size = 80;
    const center = size / 2;
    const radius = size / 2 - 5;

    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-slate-500" />
            <div className="flex-1">
              <div className="text-xs text-slate-500 mb-1">Local Time</div>
              <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                  {/* Clock face */}
                  <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="2"
                  />
                  {/* Hour marks */}
                  {[0, 3, 6, 9].map((h) => {
                    const angle = (h * 30 - 90) * (Math.PI / 180);
                    const x1 = center + (radius - 5) * Math.cos(angle);
                    const y1 = center + (radius - 5) * Math.sin(angle);
                    const x2 = center + radius * Math.cos(angle);
                    const y2 = center + radius * Math.sin(angle);
                    return (
                      <line
                        key={h}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#64748b"
                        strokeWidth="2"
                      />
                    );
                  })}
                  {/* Hour hand */}
                  <line
                    x1={center}
                    y1={center}
                    x2={center + (radius * 0.5) * Math.cos((hours * Math.PI) / 180)}
                    y2={center + (radius * 0.5) * Math.sin((hours * Math.PI) / 180)}
                    stroke="#1e293b"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Minute hand */}
                  <line
                    x1={center}
                    y1={center}
                    x2={center + (radius * 0.7) * Math.cos((minutes * Math.PI) / 180)}
                    y2={center + (radius * 0.7) * Math.sin((minutes * Math.PI) / 180)}
                    stroke="#475569"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Second hand */}
                  <line
                    x1={center}
                    y1={center}
                    x2={center + (radius * 0.8) * Math.cos((seconds * Math.PI) / 180)}
                    y2={center + (radius * 0.8) * Math.sin((seconds * Math.PI) / 180)}
                    stroke="#ef4444"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                  {/* Center dot */}
                  <circle cx={center} cy={center} r="3" fill="#1e293b" />
                </svg>
              </div>
              <div className="text-xs text-slate-600 mt-1">{formatDate(currentTime)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-slate-500" />
          <div className="flex-1">
            <div className="text-xs text-slate-500 mb-1">Local Time</div>
            <div className="text-2xl font-bold text-slate-900">{formatTime(currentTime)}</div>
            <div className="text-xs text-slate-600 mt-1">{formatDate(currentTime)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

