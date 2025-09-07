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
        borderColor: 'hsl(var(--primary))',        /* #A78BFA */
        backgroundColor: 'transparent',
        pointBackgroundColor: savedData.map(() => 'hsl(var(--primary))').concat(
          previewPoints.map(() => 'transparent')
        ),
        pointBorderColor: savedData.map(() => 'hsl(var(--primary))').concat(
          previewPoints.map(() => 'hsl(var(--muted-foreground))')
        ),
        pointBorderWidth: savedData.map(() => 1).concat(
          previewPoints.map(() => 2)
        ),
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
        backgroundColor: 'hsl(var(--card))',     /* #17182B */
        titleColor: 'hsl(var(--foreground))',   /* #E9E7FF */
        bodyColor: 'hsl(var(--muted-foreground))', /* #BDB8E6 */
        borderColor: 'hsl(var(--border))',      /* #232445 */
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
        min: 0,
        max: 10,
      },
    },
    elements: {
      line: {
        borderJoinStyle: 'round' as const,
      },
    },
  };

  return (
    <div className="h-16 w-full">
      <Line data={data} options={options} />
    </div>
  );
};