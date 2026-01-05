import { Card, CardContent } from '@/components/ui/card';
import { Moon } from 'lucide-react';

interface MoonPhaseWidgetProps {
  timezone: string;
  latitude?: number;
  longitude?: number;
}

// Calculate moon phase percentage (0-100)
function getMoonPhase(date: Date): { phase: number; name: string } {
  // Simplified calculation - in production, use a proper astronomical library
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Approximate calculation
  const daysSinceNewMoon = (year * 365 + month * 30 + day) % 29.53;
  const phase = (daysSinceNewMoon / 29.53) * 100;

  let name = 'New Moon';
  if (phase < 3.691) name = 'New Moon';
  else if (phase < 22.07) name = 'Waxing Crescent';
  else if (phase < 25.83) name = 'First Quarter';
  else if (phase < 47.14) name = 'Waxing Gibbous';
  else if (phase < 50.9) name = 'Full Moon';
  else if (phase < 72.21) name = 'Waning Gibbous';
  else if (phase < 75.97) name = 'Last Quarter';
  else name = 'Waning Crescent';

  return { phase: Math.round(phase), name };
}

export default function MoonPhaseWidget({ timezone, latitude, longitude }: MoonPhaseWidgetProps) {
  const now = new Date();
  const { phase, name } = getMoonPhase(now);

  // Calculate next phase change (simplified)
  const nextPhaseDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Simple visual representation
  const isWaxing = phase < 50;
  const moonFill = phase > 50 ? 100 - phase : phase;

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Moon className="w-5 h-5 text-indigo-500" />
          <div className="flex-1">
            <div className="text-xs text-slate-500 mb-1">Moon Phase</div>
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full ${
                    isWaxing
                      ? 'bg-slate-200 clip-path-[inset(0_50%_0_0)]'
                      : 'bg-slate-200 clip-path-[inset(0_0_0_50%)]'
                  }`}
                  style={{
                    clipPath: isWaxing
                      ? `inset(0 ${50 - moonFill}% 0 0)`
                      : `inset(0 0 0 ${50 - moonFill}%)`,
                  }}
                />
                <div className="relative w-8 h-8 rounded-full bg-slate-100" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{name}</div>
                <div className="text-xs text-slate-600">{phase}% • Next: {formatDate(nextPhaseDate)}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

