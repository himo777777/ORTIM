import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ActivityData {
  date: string;
  value: number;
}

interface ActivityGraphProps {
  data: ActivityData[];
  days?: number;
  className?: string;
}

export function ActivityGraph({ data, days = 30, className }: ActivityGraphProps) {
  // Generate dates for the last N days
  const dates = useMemo(() => {
    const result: { date: string; value: number; dayOfWeek: number }[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const existingData = data.find((d) => d.date === dateStr);

      result.push({
        date: dateStr,
        value: existingData?.value || 0,
        dayOfWeek: date.getDay(),
      });
    }

    return result;
  }, [data, days]);

  const maxValue = Math.max(...dates.map((d) => d.value), 1);

  const getIntensity = (value: number): string => {
    if (value === 0) return 'bg-muted';
    const ratio = value / maxValue;
    if (ratio < 0.25) return 'bg-primary/25';
    if (ratio < 0.5) return 'bg-primary/50';
    if (ratio < 0.75) return 'bg-primary/75';
    return 'bg-primary';
  };

  const weekDays = ['S', 'M', 'T', 'O', 'T', 'F', 'L'];

  // Group by weeks
  const weeks = useMemo(() => {
    const result: (typeof dates)[] = [];
    let currentWeek: typeof dates = [];

    // Pad the beginning to align with week start
    const firstDayOfWeek = dates[0]?.dayOfWeek || 0;
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: '', value: -1, dayOfWeek: i });
    }

    dates.forEach((day) => {
      currentWeek.push(day);
      if (day.dayOfWeek === 6) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [dates]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-1">
        {/* Week day labels */}
        <div className="flex flex-col gap-1 pr-2 text-xs text-muted-foreground">
          {weekDays.map((day, i) => (
            <div key={i} className="h-3 flex items-center">
              {i % 2 === 1 && day}
            </div>
          ))}
        </div>

        {/* Activity grid */}
        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={cn(
                    'w-3 h-3 rounded-sm transition-colors',
                    day.value === -1 ? 'bg-transparent' : getIntensity(day.value)
                  )}
                  title={
                    day.date
                      ? `${day.date}: ${day.value} aktiviteter`
                      : undefined
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
        <span>Mindre</span>
        <div className="w-3 h-3 rounded-sm bg-muted" />
        <div className="w-3 h-3 rounded-sm bg-primary/25" />
        <div className="w-3 h-3 rounded-sm bg-primary/50" />
        <div className="w-3 h-3 rounded-sm bg-primary/75" />
        <div className="w-3 h-3 rounded-sm bg-primary" />
        <span>Mer</span>
      </div>
    </div>
  );
}
