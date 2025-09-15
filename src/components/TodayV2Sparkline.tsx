import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useChartTheme } from '@/hooks/useChartTheme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SparklineData {
  ts: string;
  pain_level: number;
}

interface TodayV2SparklineProps {
  savedData: SparklineData[];
  previewPoints: { ts: Date; pain_level: number }[];
  chartType?: 'line' | 'bar' | 'area' | 'sparkline'; // Injected by ChartCard
}

export const TodayV2Sparkline = ({ savedData, previewPoints, chartType }: TodayV2SparklineProps) => {
  // Use centralized chart theming
  const { chartJsOptions, chartJsColors, mobileHeights } = useChartTheme({ 
    type: 'sparkline',
    hideXAxis: true,
    hideYAxisTitle: true,
    customOptions: {
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          display: true,
          min: 0,
          max: 10,
          position: 'left' as const,
          ticks: {
            stepSize: 5,
            font: { size: 10 },
          },
          grid: { display: false },
          border: { display: false },
        },
      },
      elements: {
        line: {
          borderJoinStyle: 'round' as const,
        },
      },
    }
  });

  const formatTime = (dateStr: string | Date) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const allTimes = [
    ...savedData.map(d => d.ts),
    ...previewPoints.map(p => p.ts.toISOString())
  ];

  const labels = allTimes.map(formatTime);

  const data = {
    labels,
    datasets: [
      {
        label: 'Pain Level',
        data: [
          ...savedData.map(d => d.pain_level),
          ...previewPoints.map(p => p.pain_level)
        ],
        borderColor: chartJsColors.line,
        backgroundColor: chartJsColors.background,
        fill: false,
        pointBackgroundColor: chartJsColors.point,
        pointBorderColor: 'transparent',
        pointBorderWidth: 0,
        pointRadius: 3, // Sparkline-specific smaller radius
        pointHoverRadius: 5,
        pointHoverBorderWidth: 0,
        pointHoverBackgroundColor: chartJsColors.point,
        pointHitRadius: 12, // Touch-friendly hit area
        tension: 0.3,
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className={`w-full bg-transparent ${mobileHeights.sm}`}>
      <Line data={data} options={chartJsOptions} />
    </div>
  );
};