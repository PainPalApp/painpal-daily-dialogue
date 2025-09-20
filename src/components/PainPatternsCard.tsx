import { useMemo } from 'react';
import { useChartTheme } from '@/hooks/useChartTheme';
import { ChartContainer, EmptyState } from '@/components/lila';
import { Button } from '@/components/ui/button';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip
);

interface PainEntry {
  id: number;
  date: string;
  timestamp: string;
  painLevel: number | null;
  location: string[];
  triggers: string[];
  medications: any[];
  notes: string;
  symptoms: string[];
  status: string;
}

interface PainPatternsCardProps {
  painData: PainEntry[];
  onUseLast7Days: () => void;
  onJumpToToday: () => void;
}

export const PainPatternsCard = ({ painData, onUseLast7Days, onJumpToToday }: PainPatternsCardProps) => {
  const { chartJsOptions, chartJsColors } = useChartTheme({
    type: 'bar',
    hideYAxisTitle: true,
    maxXTicks: 7,
  });

  // Process data for weekday patterns
  const weekdayData = useMemo(() => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdayTotals = Array(7).fill(0);
    const weekdayCounts = Array(7).fill(0);

    painData.forEach(entry => {
      if (entry.painLevel !== null) {
        const date = new Date(entry.timestamp);
        const dayOfWeek = date.getDay(); // 0 = Sunday
        weekdayTotals[dayOfWeek] += entry.painLevel;
        weekdayCounts[dayOfWeek]++;
      }
    });

    const averages = weekdayTotals.map((total, index) => 
      weekdayCounts[index] > 0 ? total / weekdayCounts[index] : 0
    );

    return {
      labels: weekdays,
      datasets: [{
        data: averages,
        backgroundColor: `${chartJsColors.line}D9`, // 85% opacity
        borderColor: 'transparent',
        borderWidth: 0,
        hoverBackgroundColor: chartJsColors.point,
        hoverBorderColor: 'transparent',
        hoverBorderWidth: 0,
      }]
    };
  }, [painData, chartJsColors]);

  // Process data for time of day patterns
  const timeOfDayData = useMemo(() => {
    const timeSlots = ['Night', 'Morning', 'Afternoon', 'Evening'];
    const timeTotals = Array(4).fill(0);
    const timeCounts = Array(4).fill(0);

    painData.forEach(entry => {
      if (entry.painLevel !== null) {
        const date = new Date(entry.timestamp);
        const hour = date.getHours();
        
        let timeSlotIndex: number;
        if (hour >= 0 && hour < 6) timeSlotIndex = 0; // Night
        else if (hour >= 6 && hour < 12) timeSlotIndex = 1; // Morning
        else if (hour >= 12 && hour < 18) timeSlotIndex = 2; // Afternoon
        else timeSlotIndex = 3; // Evening

        timeTotals[timeSlotIndex] += entry.painLevel;
        timeCounts[timeSlotIndex]++;
      }
    });

    const averages = timeTotals.map((total, index) => 
      timeCounts[index] > 0 ? total / timeCounts[index] : 0
    );

    return {
      labels: timeSlots,
      datasets: [{
        data: averages,
        backgroundColor: `${chartJsColors.line}D9`, // 85% opacity
        borderColor: 'transparent',
        borderWidth: 0,
        hoverBackgroundColor: chartJsColors.point,
        hoverBorderColor: 'transparent',
        hoverBorderWidth: 0,
      }]
    };
  }, [painData, chartJsColors]);

  // Chart options with tooltips
  const chartOptions = useMemo(() => ({
    ...chartJsOptions,
    plugins: {
      ...chartJsOptions.plugins,
      tooltip: {
        ...chartJsOptions.plugins.tooltip,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y;
            return value > 0 ? `Average: ${value.toFixed(1)}/10` : 'No data';
          }
        }
      }
    },
    scales: {
      ...chartJsOptions.scales,
      y: {
        ...chartJsOptions.scales.y,
        beginAtZero: true,
        max: 10,
        ticks: {
          ...chartJsOptions.scales.y.ticks,
          stepSize: 2,
        }
      }
    }
  }), [chartJsOptions]);

  // Check if we have any valid pain data
  const hasData = painData.some(entry => entry.painLevel !== null);

  if (!hasData) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">Pain patterns</h2>
        </div>
        <EmptyState 
          title="No pain data available"
          description="Try adjusting your date range to see patterns."
          actions={
            <div className="flex gap-2 justify-center overflow-x-auto scrollbar-hide lg:justify-center lg:overflow-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
              <Button onClick={onUseLast7Days} variant="outline" className="min-h-[44px] min-w-[44px] whitespace-nowrap flex-shrink-0">
                Use Last 7 days
              </Button>
              <Button onClick={onJumpToToday} variant="outline" className="min-h-[44px] min-w-[44px] whitespace-nowrap flex-shrink-0">
                Jump to Today
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-foreground">Pain patterns</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By Weekday Chart */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">By weekday</h3>
          <ChartContainer 
            minHeightSm={120}
            minHeightMd={160}
            className="w-full"
          >
            {({ width, height, ready }) => ready ? (
              <Bar
                data={weekdayData}
                options={chartOptions}
                width={width}
                height={height}
              />
            ) : null}
          </ChartContainer>
        </div>

        {/* By Time of Day Chart */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">By time of day</h3>
          <ChartContainer 
            minHeightSm={120}
            minHeightMd={160}
            className="w-full"
          >
            {({ width, height, ready }) => ready ? (
              <Bar
                data={timeOfDayData}
                options={chartOptions}
                width={width}
                height={height}
              />
            ) : null}
          </ChartContainer>
        </div>
      </div>
    </div>
  );
};