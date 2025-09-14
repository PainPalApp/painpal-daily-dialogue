import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
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
import { CHART_COLORS, mergeChartJSOptions } from '@/lib/chartTheme';

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
  id: number | string;
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

export const usePainChart = (painData: PainEntry[], viewMode: 'today' | 'week' | 'month' | 'custom') => {
  const chartRef = useRef<ChartJS | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const isInitializedRef = useRef(false);

  const getTodayData = (data: PainEntry[]) => {
    const today = new Date().toISOString().split('T')[0];
    return data.filter(entry => 
      entry.date === today && 
      entry.painLevel !== null && 
      entry.painLevel !== undefined &&
      entry.painLevel > 0
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const getWeekData = (data: PainEntry[]) => {
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
  };

  const getMonthData = (data: PainEntry[]) => {
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
  };

  const getCustomData = (data: PainEntry[]) => {
    // Group entries by date and calculate daily averages
    const dateGroups: Record<string, PainEntry[]> = {};
    
    data.forEach(entry => {
      if (entry.painLevel !== null && entry.painLevel !== undefined) {
        if (!dateGroups[entry.date]) {
          dateGroups[entry.date] = [];
        }
        dateGroups[entry.date].push(entry);
      }
    });
    
    // Calculate daily averages and sort by date
    const dailyAverages = Object.keys(dateGroups)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(date => {
        const entries = dateGroups[date];
        const avgPain = entries.reduce((sum, entry) => sum + (entry.painLevel || 0), 0) / entries.length;
        return {
          date,
          avgPain: Math.round(avgPain * 10) / 10, // Round to 1 decimal place
          entryCount: entries.length
        };
      });
    
    return dailyAverages;
  };

  // Memoize processed data to prevent unnecessary recalculations
  const processedData = useMemo(() => {
    switch (viewMode) {
      case 'today':
        return getTodayData(painData);
      case 'week':
        return getWeekData(painData);
      case 'month':
        return getMonthData(painData);
      case 'custom':
        return getCustomData(painData);
      default:
        return [];
    }
  }, [painData, viewMode]);

  const createChart = useCallback(() => {
    if (!canvasRef.current || !painData || !canvasRef.current.isConnected) return;

    // Prevent multiple initializations
    if (isInitializedRef.current && chartRef.current) {
      return;
    }

    // Clean up existing chart
    if (chartRef.current) {
      try {
        chartRef.current.destroy();
      } catch (e) {
        console.warn('Chart cleanup failed:', e);
      }
      chartRef.current = null;
    }

    // Clean up existing MutationObserver
    if (mutationObserverRef.current) {
      try {
        mutationObserverRef.current.disconnect();
      } catch (e) {
        console.warn('MutationObserver cleanup failed:', e);
      }
      mutationObserverRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    setIsChartReady(false);

    if (viewMode === 'today') {
      const todayData = processedData as PainEntry[];
      
      if (todayData.length === 0) {
        setIsChartReady(true);
        isInitializedRef.current = true;
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
            borderColor: CHART_COLORS.line,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: CHART_COLORS.point,
            pointBorderColor: 'transparent',
            pointBorderWidth: 0,
            pointHoverBorderWidth: 0,
            pointHitRadius: 12,
            fill: true,
            tension: 0.3,
            cubicInterpolationMode: 'monotone' as const
          }]
        },
        options: mergeChartJSOptions({
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
              },
            },
            y: {
              min: 0,
              max: 10,
              title: {
                display: true,
                text: 'Pain Level',
              },
              ticks: { 
                stepSize: 1,
              },
            }
          }
        })
      });
    } else if (viewMode === 'week') {
      // Week view - simplified line chart
      const weekData = processedData as any[];
      
      chartRef.current = new ChartJS(ctx, {
        type: 'line',
        data: {
          labels: weekData.map(d => d.label),
          datasets: [{
            label: 'Pain Level',
            data: weekData.map(d => d.pain),
            borderColor: CHART_COLORS.line,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: CHART_COLORS.point,
            pointBorderColor: 'transparent',
            pointBorderWidth: 0,
            pointHoverBorderWidth: 0,
            pointHitRadius: 12,
            fill: false,
            tension: 0.3,
            spanGaps: true
          }]
        },
        options: mergeChartJSOptions({
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
              },
              title: {
                display: true,
                text: 'Pain Level',
              }
            },
          }
        })
      });
    } else if (viewMode === 'month') {
      // Month view - similar to week but with more data points
      const monthData = processedData as any[];
      
      chartRef.current = new ChartJS(ctx, {
        type: 'line',
        data: {
          labels: monthData.map(d => d.label),
          datasets: [{
            label: 'Pain Level',
            data: monthData.map(d => d.pain),
            borderColor: CHART_COLORS.line,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 4,
            pointBackgroundColor: CHART_COLORS.point,
            pointBorderColor: 'transparent',
            pointBorderWidth: 0,
            pointHoverBorderWidth: 0,
            pointHitRadius: 12,
            fill: false,
            tension: 0.3,
            spanGaps: true
          }]
        },
        options: mergeChartJSOptions({
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
              },
              title: {
                display: true,
                text: 'Pain Level',
              }
            },
            x: {
              ticks: { 
                maxTicksLimit: 10
              }
            }
          }
        })
      });
    } else if (viewMode === 'custom') {
      // Custom date range view - daily averages with purple theme
      const customData = processedData as any[];
      
      if (customData.length === 0) {
        setIsChartReady(true);
        isInitializedRef.current = true;
        return;
      }
      
      const labels = customData.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      
      chartRef.current = new ChartJS(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Daily Average Pain',
            data: customData.map(d => d.avgPain),
            borderColor: CHART_COLORS.line,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: CHART_COLORS.point,
            pointBorderColor: 'transparent',
            pointBorderWidth: 0,
            pointHoverBorderWidth: 0,
            pointHitRadius: 12,
            fill: false,
            tension: 0.3,
            spanGaps: false
          }]
        },
        options: mergeChartJSOptions({
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: (context: any) => {
                  const index = context[0].dataIndex;
                  const dataPoint = customData[index];
                  return new Date(dataPoint.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                },
                label: (context: any) => {
                  const index = context.dataIndex;
                  const dataPoint = customData[index];
                  return [
                    `Average Pain: ${dataPoint.avgPain}/10`,
                    `${dataPoint.entryCount} ${dataPoint.entryCount === 1 ? 'entry' : 'entries'}`
                  ];
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
              },
              title: {
                display: true,
                text: 'Daily Average Pain Level',
              },
            },
            x: {
              ticks: { 
                maxTicksLimit: 15,
                maxRotation: 45
              },
            }
          }
        })
      });
    }

    // Set up MutationObserver to watch for DOM changes only once
    if (canvasRef.current && !mutationObserverRef.current) {
      try {
        mutationObserverRef.current = new MutationObserver(() => {
          // Only reconnect chart if it was disconnected
          if (chartRef.current && !canvasRef.current?.isConnected) {
            console.log('Canvas disconnected, will recreate on next update');
          }
        });
        
        mutationObserverRef.current.observe(canvasRef.current.parentNode as Node, {
          childList: true,
          subtree: true
        });
      } catch (e) {
        console.warn('Failed to set up MutationObserver:', e);
      }
    }

    setIsChartReady(true);
    isInitializedRef.current = true;
  }, [painData, viewMode, processedData]);

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
      } else if (viewMode === 'month') {
        const monthData = getMonthData(painData);
        chartRef.current.data.labels = monthData.map(d => d.label);
        chartRef.current.data.datasets[0].data = monthData.map(d => d.pain);
      } else if (viewMode === 'custom') {
        const customData = getCustomData(painData);
        const labels = customData.map(d => {
          const date = new Date(d.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        chartRef.current.data.labels = labels;
        chartRef.current.data.datasets[0].data = customData.map(d => d.avgPain);
      }
      
      chartRef.current.update('none');
    } catch (error) {
      console.warn('Chart update failed, recreating:', error);
      createChart();
    }
  }, [painData, viewMode, isChartReady, getTodayData, getWeekData, getMonthData]);

  useEffect(() => {
    // Only create chart once, then update data
    if (!isInitializedRef.current) {
      createChart();
    }
    
    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.destroy();
        } catch (e) {
          console.warn('Chart cleanup failed:', e);
        }
        chartRef.current = null;
      }
      
      if (mutationObserverRef.current) {
        try {
          mutationObserverRef.current.disconnect();
        } catch (e) {
          console.warn('MutationObserver cleanup failed:', e);
        }
        mutationObserverRef.current = null;
      }
      
      isInitializedRef.current = false;
    };
  }, [viewMode]); // Only recreate when viewMode changes

  // Update chart data when painData changes (without recreating the entire chart)
  useEffect(() => {
    if (chartRef.current && isChartReady && isInitializedRef.current) {
      updateChart();
    } else if (!isInitializedRef.current) {
      createChart();
    }
  }, [painData, updateChart, isChartReady, createChart]);

  return { canvasRef, isChartReady };
};