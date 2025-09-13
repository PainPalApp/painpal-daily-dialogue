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
import { CHART_COLORS, mergeChartJSOptions } from '@/lib/chartTheme';

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
}

export const TodayV2Sparkline = ({ savedData, previewPoints }: TodayV2SparklineProps) => {
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
        borderColor: CHART_COLORS.accent,
        backgroundColor: CHART_COLORS.transparent,
        fill: false,
        pointBackgroundColor: CHART_COLORS.white,
        pointBorderColor: CHART_COLORS.accent,
        pointBorderWidth: 2,
        pointRadius: 4,
        tension: 0.3,
        borderWidth: 2,
      },
    ],
  };

  const options = mergeChartJSOptions({
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: true,
        min: 0,
        max: 10,
        position: 'left' as const,
        ticks: {
          stepSize: 5,
          font: {
            size: 10,
          },
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
    elements: {
      line: {
        borderJoinStyle: 'round' as const,
      },
    },
  });

  return (
    <div className="h-16 sm:h-20 w-full bg-transparent">
      <Line data={data} options={options} />
    </div>
  );
};