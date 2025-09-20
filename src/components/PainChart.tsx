import { ChartContainer } from '@/components/lila';
import { PainLineChart } from '@/components/ui/chart';
import { format } from 'date-fns';
import { isSingleDay } from '@/lib/dateUtils';
import { memo } from 'react';

interface PainEntry {
  id: number;
  logged_at: string;
  pain_level: number | null;
  location?: string[];
  triggers?: string[];
  medications?: any[];
  notes?: string;
  symptoms?: string[];
  status?: string;
}

interface PainChartProps {
  painData: PainEntry[];
  startDate: Date;
  endDate: Date;
  isCompact?: boolean;
}

const PainChartComponent = ({ painData, startDate, endDate, isCompact = false }: PainChartProps) => {
  // Determine if this is a single day (Today preset) or multi-day range
  const isToday = isSingleDay(startDate, endDate);
  
  // Process data based on view type
  const chartData = (() => {
    const validEntries = painData
      .filter(entry => entry.pain_level !== null)
      .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());

    if (isToday) {
      // Single day: plot each log (x=time in p format, y=pain_level)
      return validEntries.map(entry => ({
        x: format(new Date(entry.logged_at), 'p'),
        y: entry.pain_level,
        notes: entry.notes || ''
      }));
    } else {
      // Multi-day: plot daily averages
      const dailyData = validEntries.reduce((acc, entry) => {
        const dateKey = format(new Date(entry.logged_at), 'yyyy-MM-dd');
        if (!acc[dateKey]) {
          acc[dateKey] = { sum: 0, count: 0, date: dateKey };
        }
        acc[dateKey].sum += entry.pain_level || 0;
        acc[dateKey].count += 1;
        return acc;
      }, {} as Record<string, { sum: number; count: number; date: string }>);

      return Object.values(dailyData)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(data => ({
          x: format(new Date(data.date), 'MMM d'),
          y: Math.round((data.sum / data.count) * 10) / 10 // Round to 1 decimal
        }));
    }
  })();

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No pain data to display
      </div>
    );
  }

  return (
    <ChartContainer
      minHeightSm={120}
      minHeightMd={160}
      minHeightLg={200}
    >
      {({ width, height, ready }) => 
        ready ? <PainLineChart data={chartData} height={height} /> : null
      }
    </ChartContainer>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const PainChart = memo(PainChartComponent, (prevProps, nextProps) => {
  return (
    prevProps.startDate.getTime() === nextProps.startDate.getTime() &&
    prevProps.endDate.getTime() === nextProps.endDate.getTime() &&
    prevProps.isCompact === nextProps.isCompact &&
    JSON.stringify(prevProps.painData) === JSON.stringify(nextProps.painData)
  );
});