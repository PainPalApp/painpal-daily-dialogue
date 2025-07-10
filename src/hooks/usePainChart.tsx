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

export const usePainChart = (painData: PainEntry[], viewMode: 'today' | 'week' | 'month') => {
  const chartRef = useRef<ChartJS | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  const getTodayData = useCallback((data: PainEntry[]) => {
    const today = new Date().toISOString().split('T')[0];
    return data.filter(entry => 
      entry.date === today && 
      entry.painLevel !== null && 
      entry.painLevel !== undefined &&
      entry.painLevel > 0
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
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

  const getMonthData = useCallback((data: PainEntry[]) => {
    const chartData = [];
    for (let i = 29; i >= 0; i--) {
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
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#ffffff',
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
                color: '#94a3b8'
              },
              ticks: { color: '#94a3b8' },
              grid: { color: '#334155' }
            },
            y: {
              min: 0,
              max: 10,
              title: {
                display: true,
                text: 'Pain Level',
                color: '#94a3b8'
              },
              ticks: { 
                stepSize: 1,
                color: '#94a3b8'
              },
              grid: { color: '#334155' }
            }
          }
        }
      });
    } else if (viewMode === 'week') {
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
    } else {
      // Month view - similar to week but with more data points
      const monthData = getMonthData(painData);
      
      chartRef.current = new ChartJS(ctx, {
        type: 'line',
        data: {
          labels: monthData.map(d => d.label),
          datasets: [{
            label: 'Pain Level',
            data: monthData.map(d => d.pain),
            borderColor: 'hsl(var(--primary))',
            backgroundColor: 'hsl(var(--primary) / 0.1)',
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 4,
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
              ticks: { 
                color: 'hsl(var(--muted-foreground))',
                maxTicksLimit: 10
              }
            }
          }
        }
      });
    }

    setIsChartReady(true);
  }, [painData, viewMode, getTodayData, getWeekData, getMonthData]);

  const updateChart = useCallback(() => {
    if (!chartRef.current || !isChartReady) {
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
      } else if (viewMode === 'week') {
        const weekData = getWeekData(painData);
        chartRef.current.data.labels = weekData.map(d => d.label);
        chartRef.current.data.datasets[0].data = weekData.map(d => d.pain);
      } else {
        const monthData = getMonthData(painData);
        chartRef.current.data.labels = monthData.map(d => d.label);
        chartRef.current.data.datasets[0].data = monthData.map(d => d.pain);
      }
      
      chartRef.current.update('none');
    } catch (error) {
      console.warn('Chart update failed, recreating:', error);
      createChart();
    }
  }, [painData, viewMode, isChartReady, getTodayData, getWeekData, getMonthData]);

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
  }, [createChart]);

  useEffect(() => {
    if (isChartReady) {
      updateChart();
    }
  }, [painData, isChartReady, updateChart]);

  return { canvasRef, isChartReady };
};