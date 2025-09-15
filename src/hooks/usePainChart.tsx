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
import { useChartTheme } from '@/hooks/useChartTheme';

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
  
  // Use centralized chart theming based on view mode
  const { chartJsOptions, chartJsColors } = useChartTheme({ 
    type: viewMode === 'today' ? 'sparkline' : 'line',
    hideYAxisTitle: true,
    maxXTicks: viewMode === 'today' ? 6 : 4,
  });
  
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const isInitializedRef = useRef(false);

  // Helper functions for data processing
  const getTodayData = useCallback((entries: PainEntry[]) => {
    const today = new Date().toISOString().split('T')[0];
    return entries.filter(entry => entry.date === today);
  }, []);

  const getWeekData = useCallback((entries: PainEntry[]) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekAgo;
    });
  }, []);

  const getMonthData = useCallback((entries: PainEntry[]) => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= monthAgo;
    });
  }, []);

  const getCustomData = useCallback((entries: PainEntry[]) => {
    return entries; // For custom range, assume data is already filtered
  }, []);

  // Process data based on view mode with memoization for performance
  const processedData = useMemo(() => {
    let filteredEntries: PainEntry[];
    
    switch (viewMode) {
      case 'today':
        filteredEntries = getTodayData(painData);
        break;
      case 'week':
        filteredEntries = getWeekData(painData);
        break;
      case 'month':
        filteredEntries = getMonthData(painData);
        break;
      case 'custom':
        filteredEntries = getCustomData(painData);
        break;
      default:
        filteredEntries = painData;
    }

    // Sort by timestamp and filter out null pain levels
    const validEntries = filteredEntries
      .filter(entry => entry.painLevel !== null)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (viewMode === 'today') {
      // For today view, show hourly timeline
      return validEntries.map(entry => ({
        x: new Date(entry.timestamp),
        y: entry.painLevel,
        label: new Date(entry.timestamp).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        }),
        notes: entry.notes || ''
      }));
    } else if (viewMode === 'week') {
      // For week view, group by day and average
      const dailyData = validEntries.reduce((acc, entry) => {
        const dateKey = entry.date;
        if (!acc[dateKey]) {
          acc[dateKey] = { sum: 0, count: 0, date: entry.date };
        }
        acc[dateKey].sum += entry.painLevel || 0;
        acc[dateKey].count += 1;
        return acc;
      }, {} as Record<string, { sum: number; count: number; date: string }>);

      return Object.values(dailyData).map(data => ({
        date: data.date,
        pain: data.sum / data.count,
        label: new Date(data.date).toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      }));
    } else if (viewMode === 'month') {
      // For month view, group by day and average
      const dailyData = validEntries.reduce((acc, entry) => {
        const dateKey = entry.date;
        if (!acc[dateKey]) {
          acc[dateKey] = { sum: 0, count: 0, date: entry.date };
        }
        acc[dateKey].sum += entry.painLevel || 0;
        acc[dateKey].count += 1;
        return acc;
      }, {} as Record<string, { sum: number; count: number; date: string }>);

      return Object.values(dailyData).map(data => ({
        date: data.date,
        pain: data.sum / data.count,
        label: new Date(data.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      }));
    } else {
      // Custom view - group by day and calculate daily averages
      const dailyData = validEntries.reduce((acc, entry) => {
        const dateKey = entry.date;
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(entry.painLevel || 0);
        return acc;
      }, {} as Record<string, number[]>);

      return Object.entries(dailyData)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([date, levels]) => ({
          date,
          avgPain: levels.reduce((sum, level) => sum + level, 0) / levels.length,
          maxPain: Math.max(...levels),
          minPain: Math.min(...levels),
          count: levels.length
        }));
    }
  }, [painData, viewMode, getTodayData, getWeekData, getMonthData, getCustomData]);

  const createChart = useCallback(() => {
    if (!canvasRef.current || isInitializedRef.current) {
      return;
    }

    try {
      // Destroy existing chart if it exists
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      let chartData: any;
      let customOptions: any;

      if (viewMode === 'today') {
        // Today view: Timeline chart
        const timelineData = processedData as any[];
        
        chartData = {
          datasets: [{
            label: 'Pain Level',
            data: timelineData,
            borderColor: chartJsColors.line,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: chartJsColors.point,
            pointBorderColor: 'transparent',
            pointBorderWidth: 0,
            pointHoverBorderWidth: 0,
            pointHitRadius: 12,
            fill: true,
            tension: 0.3,
            cubicInterpolationMode: 'monotone' as const
          }]
        };
        
        customOptions = {
          ...chartJsOptions,
          scales: {
            ...chartJsOptions.scales,
            x: {
              ...chartJsOptions.scales.x,
              type: 'time',
              time: {
                unit: 'hour',
                displayFormats: {
                  hour: 'HH:mm'
                }
              }
            }
          }
        };

      } else if (viewMode === 'week') {
        // Week view: Daily averages
        const weekData = processedData as any[];
        
        chartData = {
          labels: weekData.map(d => d.label),
          datasets: [{
            label: 'Pain Level',
            data: weekData.map(d => d.pain),
            borderColor: chartJsColors.line,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: chartJsColors.point,
            pointBorderColor: 'transparent',
            pointBorderWidth: 0,
            pointHoverBorderWidth: 0,
            pointHitRadius: 12,
            fill: false,
            tension: 0.3,
            spanGaps: true
          }]
        };
        
        customOptions = chartJsOptions;

      } else if (viewMode === 'month') {
        // Month view: Daily averages with smaller points
        const monthData = processedData as any[];
        
        chartData = {
          labels: monthData.map(d => d.label),
          datasets: [{
            label: 'Pain Level',
            data: monthData.map(d => d.pain),
            borderColor: chartJsColors.line,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 4,
            pointBackgroundColor: chartJsColors.point,
            pointBorderColor: 'transparent',
            pointBorderWidth: 0,
            pointHoverBorderWidth: 0,
            pointHitRadius: 12,
            fill: false,
            tension: 0.3,
            spanGaps: true
          }]
        };
        
        customOptions = chartJsOptions;

      } else {
        // Custom view: Daily averages
        const customData = processedData as any[];
        const labels = customData.map(d => {
          const date = new Date(d.date);
          return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
        });
        
        chartData = {
          labels,
          datasets: [{
            label: 'Daily Average Pain',
            data: customData.map(d => d.avgPain),
            borderColor: chartJsColors.line,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: chartJsColors.point,
            pointBorderColor: 'transparent',
            pointBorderWidth: 0,
            pointHoverBorderWidth: 0,
            pointHitRadius: 12,
            fill: false,
            tension: 0.3,
            spanGaps: false
          }]
        };
        
        customOptions = chartJsOptions;
      }

      chartRef.current = new ChartJS(ctx, {
        type: 'line',
        data: chartData,
        options: customOptions,
      });

      isInitializedRef.current = true;
      setIsChartReady(true);

    } catch (error) {
      console.error('Error creating chart:', error);
      setIsChartReady(false);
    }
  }, [processedData, viewMode, chartJsOptions, chartJsColors]);

  const updateChart = useCallback(() => {
    if (!chartRef.current || !isInitializedRef.current) {
      return;
    }

    try {
      if (viewMode === 'today') {
        const timelineData = processedData as any[];
        chartRef.current.data.datasets[0].data = timelineData;
      } else {
        const chartData = processedData as any[];
        if (viewMode === 'week' || viewMode === 'month') {
          chartRef.current.data.labels = chartData.map(d => d.label);
          chartRef.current.data.datasets[0].data = chartData.map(d => d.pain);
        } else {
          // Custom view
          chartRef.current.data.labels = chartData.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            });
          });
          chartRef.current.data.datasets[0].data = chartData.map(d => d.avgPain);
        }
      }

      chartRef.current.update('none'); // No animation for smoother updates
    } catch (error) {
      console.error('Error updating chart:', error);
    }
  }, [processedData, viewMode]);

  // Effect to create chart when view mode changes
  useEffect(() => {
    if (viewMode) {
      // Reset initialization when view mode changes
      isInitializedRef.current = false;
      setIsChartReady(false);
      
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        createChart();
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [viewMode, createChart]);

  // Effect to update chart when data changes (but not view mode)
  useEffect(() => {
    if (isInitializedRef.current && chartRef.current) {
      updateChart();
    }
  }, [painData, updateChart]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }
      isInitializedRef.current = false;
    };
  }, []);

  return {
    canvasRef,
    isChartReady,
  };
};