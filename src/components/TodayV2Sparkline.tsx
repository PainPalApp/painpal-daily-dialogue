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
        borderColor: 'hsl(var(--accent-primary))',     /* #A78BFA */
        backgroundColor: 'hsl(var(--accent-primary) / 0.12)', /* 12% opacity fill */
        fill: true,
        pointBackgroundColor: savedData.map(() => 'white').concat(
          previewPoints.map(() => 'white')
        ),
        pointBorderColor: savedData.map(() => 'hsl(var(--accent-primary))').concat(
          previewPoints.map(() => 'hsl(var(--accent-primary))')
        ),
        pointBorderWidth: 2,
        pointRadius: 4,
        tension: 0.1,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'hsl(var(--surface))',
        titleColor: 'hsl(var(--text-primary))',
        bodyColor: 'hsl(var(--text-secondary))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: 'hsl(var(--border))',  /* #232445 */
          lineWidth: 0.5,
        },
        ticks: {
          display: true,
          color: 'hsl(var(--text-secondary))',  /* #BDB8E6 */
          font: {
            size: 10,
          },
          maxTicksLimit: 4,
        },
        border: {
          display: false,
        },
      },
      y: {
        display: true,
        min: 0,
        max: 10,
        grid: {
          display: true,
          color: 'hsl(var(--border))',  /* #232445 */
          lineWidth: 0.5,
        },
        ticks: {
          display: true,
          color: 'hsl(var(--text-secondary))',  /* #BDB8E6 */
          font: {
            size: 10,
          },
          stepSize: 2,
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
  };

  return (
    <div className="h-20 w-full bg-transparent">
      <Line data={data} options={options} />
    </div>
  );
};