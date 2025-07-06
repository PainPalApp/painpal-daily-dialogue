import { useRef, useEffect, useCallback, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register all Chart.js components including LineController
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
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

export const usePainChart = (painData: PainEntry[], viewMode: 'today' | 'week') => {
  const chartRef = useRef<ChartJS | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  const getTodayData = useCallback((data: PainEntry[]) => {
    const today = new Date().toISOString().split('T')[0];
    return data.filter(entry => entry.date === today)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, []);

  const getWeekData = useCallback((data: PainEntry[]) => {
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = data.find(entry => entry.date === dateStr);
      chartData.push({
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        pain: dayData?.painLevel || null
      });
    }
    return chartData;
  }, []);

  const createChart = useCallback(() => {
    if (!canvasRef.current) return;

    // Clean up existing chart
    if (chartRef.current) {
      try {
        chartRef.current.destroy();
      } catch (e) {
        console.warn('Chart cleanup failed:', e);
      }
      chartRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    setIsChartReady(false);

    if (viewMode === 'today') {
      const todayData = getTodayData(painData);
      
      if (todayData.length === 0) {
        setIsChartReady(true);
        return;
      }

      const timelineData = todayData.map(entry => ({
        x: new Date(entry.timestamp).getTime(),
        y: entry.painLevel,
        location: entry.location?.join(', ') || 'general',
        notes: entry.notes || ''
      }));

      chartRef.current = new ChartJS(ctx, {
        type: 'line',
        data: {
          datasets: [{
            label: 'Pain Level',
            data: timelineData,
            borderColor: 'hsl(var(--destructive))',
            backgroundColor: 'hsl(var(--destructive) / 0.1)',
            borderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: 'hsl(var(--destructive))',
            pointBorderColor: 'hsl(var(--background))',
            pointBorderWidth: 2,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 200 },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: function(context: any) {
                  const dataPoint = context[0].raw;
                  const time = new Date(dataPoint.x).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  return time;
                },
                label: function(context: any) {
                  const dataPoint = context.raw;
                  return [
                    `Pain Level: ${dataPoint.y}/10`,
                    `Location: ${dataPoint.location}`,
                    `Notes: ${dataPoint.notes}`
                  ];
                }
              }
            }
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'hour',
                displayFormats: { hour: 'HH:mm' }
              },
              title: {
                display: true,
                text: 'Time Today',
                color: 'hsl(var(--muted-foreground))'
              },
              ticks: { color: 'hsl(var(--muted-foreground))' }
            },
            y: {
              min: 0,
              max: 10,
              title: {
                display: true,
                text: 'Pain Level',
                color: 'hsl(var(--muted-foreground))'
              },
              ticks: { 
                stepSize: 1,
                color: 'hsl(var(--muted-foreground))'
              }
            }
          }
        }
      });
    } else {
      // Week view - simplified line chart
      const weekData = getWeekData(painData);
      
      chartRef.current = new ChartJS(ctx, {
        type: 'line',
        data: {
          labels: weekData.map(d => d.label),
          datasets: [{
            label: 'Pain Level',
            data: weekData.map(d => d.pain),
            borderColor: 'hsl(var(--primary))',
            backgroundColor: 'hsl(var(--primary) / 0.1)',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false,
            tension: 0.3,
            spanGaps: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 200 },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  return context.raw ? `Pain: ${context.raw}/10` : 'No pain recorded';
                }
              }
            }
          },
          scales: {
            y: {
              min: 0,
              max: 10,
              ticks: { 
                stepSize: 1,
                color: 'hsl(var(--muted-foreground))'
              },
              title: {
                display: true,
                text: 'Pain Level',
                color: 'hsl(var(--muted-foreground))'
              }
            },
            x: {
              ticks: { color: 'hsl(var(--muted-foreground))' }
            }
          }
        }
      });
    }

    setIsChartReady(true);
  }, [painData, viewMode, getTodayData, getWeekData]);

  const updateChart = useCallback(() => {
    if (!chartRef.current || !isChartReady) {
      createChart();
      return;
    }

    try {
      if (viewMode === 'today') {
        const todayData = getTodayData(painData);
        if (todayData.length > 0) {
          const timelineData = todayData.map(entry => ({
            x: new Date(entry.timestamp).getTime(),
            y: entry.painLevel,
            location: entry.location?.join(', ') || 'general',
            notes: entry.notes || ''
          }));
          chartRef.current.data.datasets[0].data = timelineData;
        }
      } else {
        const weekData = getWeekData(painData);
        chartRef.current.data.labels = weekData.map(d => d.label);
        chartRef.current.data.datasets[0].data = weekData.map(d => d.pain);
      }
      
      chartRef.current.update('none');
    } catch (error) {
      console.warn('Chart update failed, recreating:', error);
      createChart();
    }
  }, [painData, viewMode, isChartReady, createChart, getTodayData, getWeekData]);

  useEffect(() => {
    createChart();
    
    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.destroy();
        } catch (e) {
          console.warn('Chart cleanup failed:', e);
        }
        chartRef.current = null;
      }
    };
  }, [viewMode]);

  useEffect(() => {
    if (isChartReady) {
      updateChart();
    }
  }, [painData, updateChart, isChartReady]);

  return { canvasRef, isChartReady };
};