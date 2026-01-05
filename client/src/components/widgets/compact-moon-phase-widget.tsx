import { Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CompactMoonPhaseWidgetProps {
  timezone: string;
}

export default function CompactMoonPhaseWidget({ timezone }: CompactMoonPhaseWidgetProps) {
  const [phase, setPhase] = useState(0);
  const [phaseName, setPhaseName] = useState('');

  useEffect(() => {
    const calculateMoonPhase = () => {
      const now = new Date();
      const lp = 2551443; // lunar synodic period in seconds
      const newMoon = new Date(2000, 0, 6, 18, 38, 0);
      const diff = (now.getTime() - newMoon.getTime()) / 1000;
      const phaseSeconds = diff % lp;
      const currentPhase = (phaseSeconds / lp) * 100;

      setPhase(currentPhase);

      if (currentPhase < 1.85 || currentPhase > 98.15) setPhaseName('New Moon');
      else if (currentPhase < 23.15) setPhaseName('Waxing Crescent');
      else if (currentPhase < 26.85) setPhaseName('First Quarter');
      else if (currentPhase < 48.15) setPhaseName('Waxing Gibbous');
      else if (currentPhase < 51.85) setPhaseName('Full Moon');
      else if (currentPhase < 73.15) setPhaseName('Waning Gibbous');
      else if (currentPhase < 76.85) setPhaseName('Last Quarter');
      else setPhaseName('Waning Crescent');
    };

    calculateMoonPhase();
    const interval = setInterval(calculateMoonPhase, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  const isWaxing = phase < 50;
  const moonFill = phase > 50 ? 100 - phase : phase;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded-lg border border-indigo-200">
      <Moon className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
      <div className="relative w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center flex-shrink-0">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            clipPath: isWaxing
              ? `inset(0 ${50 - moonFill}% 0 0)`
              : `inset(0 0 0 ${50 - moonFill}%)`,
            backgroundColor: '#E2E8F0',
          }}
        ></div>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            clipPath: isWaxing
              ? `inset(0 0 0 ${50 + moonFill}%)`
              : `inset(0 ${50 + moonFill}% 0 0)`,
            backgroundColor: '#334155',
          }}
        ></div>
      </div>
      <div className="text-[10px] font-medium text-slate-700 leading-tight">{phaseName}</div>
    </div>
  );
}

