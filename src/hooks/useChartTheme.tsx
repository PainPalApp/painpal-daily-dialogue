import { useMemo } from 'react'
import { CHART_COLORS, mergeChartJSOptions } from '@/lib/chartTheme'

interface ChartThemeConfig {
  // Chart.js configuration
  chartJsOptions: any
  chartJsColors: typeof CHART_COLORS
  
  // Recharts configuration  
  rechartsConfig: {
    colors: typeof CHART_COLORS
    cartesianGrid: { stroke: string; strokeDasharray: string; strokeWidth: number }
    xAxis: { tick: { fill: string; fontSize: number }; axisLine: { stroke: string; strokeWidth: number }; tickLine: { stroke: string; strokeWidth: number } }
    yAxis: { tick: { fill: string; fontSize: number }; axisLine: { stroke: string; strokeWidth: number }; tickLine: { stroke: string; strokeWidth: number } }
    tooltip: { contentStyle: any; labelStyle: any }
  }
  
  // Mobile heights
  mobileHeights: {
    sm: string
    md: string
    lg: string
  }
}

export interface UseChartThemeOptions {
  // Chart type specific options
  type?: 'line' | 'bar' | 'area' | 'sparkline'
  
  // Mobile responsiveness
  hideXAxis?: boolean
  hideYAxis?: boolean
  hideYAxisTitle?: boolean
  maxXTicks?: number
  
  // Custom overrides
  customOptions?: any
}

/**
 * Centralized chart theming hook that provides consistent styling
 * across all chart components using design system tokens
 */
export function useChartTheme(options: UseChartThemeOptions = {}): ChartThemeConfig {
  const {
    type = 'line',
    hideXAxis = false,
    hideYAxis = false, 
    hideYAxisTitle = true, // Default to hiding Y axis title on mobile
    maxXTicks = 4, // Mobile-friendly X tick limit
    customOptions = {}
  } = options

  const chartJsOptions = useMemo(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 }, // Disable initial animation to avoid flicker
      
      // Global styling from design tokens
      color: CHART_COLORS.label,
      backgroundColor: CHART_COLORS.background,
      borderColor: CHART_COLORS.axis,
      
      scales: {
        x: {
          display: !hideXAxis,
          ticks: {
            color: CHART_COLORS.label,
            font: { size: 11 },
            maxTicksLimit: maxXTicks,
            callback: function(value: any, index: number) {
              // Short date format for mobile
              const label = this.getLabelForValue(value);
              if (typeof label === 'string' && label.includes('/')) {
                const date = new Date(label);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }
              return label;
            },
          },
          grid: {
            color: CHART_COLORS.gridOpacity,
            drawOnChartArea: true,
            drawTicks: true,
            lineWidth: 1,
          },
          border: {
            color: CHART_COLORS.axis,
            width: 1,
          },
        },
        y: {
          display: !hideYAxis,
          title: {
            display: !hideYAxisTitle,
          },
          ticks: {
            color: CHART_COLORS.label,
            font: { size: 11 },
          },
          grid: {
            color: CHART_COLORS.gridOpacity,
            drawOnChartArea: true,
            drawTicks: true,
            lineWidth: 1,
          },
          border: {
            color: CHART_COLORS.axis,
            width: 1,
          },
        },
      },
      
      plugins: {
        tooltip: {
          backgroundColor: CHART_COLORS.surface,
          titleColor: CHART_COLORS.textPrimary,
          bodyColor: CHART_COLORS.textPrimary,
          borderColor: CHART_COLORS.border,
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          padding: 12,
          titleFont: { size: 12, weight: '600' },
          bodyFont: { size: 11 },
        },
        legend: {
          labels: {
            color: CHART_COLORS.label,
            font: { size: 11 },
          },
        },
      },
      
      // Dataset defaults based on chart type
      datasets: getDatasetDefaults(type),
    }
    
    return mergeChartJSOptions({ ...baseOptions, ...customOptions })
  }, [type, hideXAxis, hideYAxis, hideYAxisTitle, maxXTicks, customOptions])

  const rechartsConfig = useMemo(() => ({
    colors: CHART_COLORS,
    cartesianGrid: {
      stroke: CHART_COLORS.gridOpacity,
      strokeDasharray: '3 3',
      strokeWidth: 1,
    },
    xAxis: {
      tick: { fill: CHART_COLORS.label, fontSize: 12 },
      axisLine: { stroke: CHART_COLORS.axis, strokeWidth: 1 },
      tickLine: { stroke: CHART_COLORS.axis, strokeWidth: 1 },
    },
    yAxis: {
      tick: { fill: CHART_COLORS.label, fontSize: 12 },
      axisLine: { stroke: CHART_COLORS.axis, strokeWidth: 1 },
      tickLine: { stroke: CHART_COLORS.axis, strokeWidth: 1 },
    },
    tooltip: {
      contentStyle: {
        backgroundColor: CHART_COLORS.surface,
        border: `1px solid ${CHART_COLORS.border}`,
        borderRadius: '8px',
        color: CHART_COLORS.textPrimary,
        fontSize: '12px',
        padding: '12px',
      },
      labelStyle: {
        color: CHART_COLORS.textPrimary,
        fontWeight: '500',
      },
    },
  }), [])

  const mobileHeights = useMemo(() => ({
    sm: 'h-[120px]',  // Mobile height ~120px as requested
    md: 'h-[160px]',   
    lg: 'h-[200px]'    
  }), [])

  return {
    chartJsOptions,
    chartJsColors: CHART_COLORS,
    rechartsConfig,
    mobileHeights,
  }
}

/**
 * Get dataset defaults based on chart type
 */
function getDatasetDefaults(type: string) {
  const baseDefaults = {
    borderColor: CHART_COLORS.line,
    backgroundColor: CHART_COLORS.background,
    borderWidth: 2,
    pointBackgroundColor: CHART_COLORS.point,
    pointBorderColor: 'transparent',
    pointBorderWidth: 0,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointHoverBorderWidth: 0,
    pointHoverBackgroundColor: CHART_COLORS.point,
    pointHitRadius: 12, // Touch-friendly hit area
    tension: 0.3,
  }

  switch (type) {
    case 'line':
      return {
        line: {
          ...baseDefaults,
          fill: false,
        }
      }
    
    case 'area':
      return {
        line: {
          ...baseDefaults,
          fill: true,
          backgroundColor: CHART_COLORS.accentFaded,
        }
      }
    
    case 'bar':
      return {
        bar: {
          backgroundColor: `${CHART_COLORS.line}D9`, // 85% opacity
          borderColor: 'transparent',
          borderWidth: 0,
          hoverBackgroundColor: CHART_COLORS.point,
          hoverBorderColor: 'transparent',
          hoverBorderWidth: 0,
        }
      }
    
    case 'sparkline':
      return {
        line: {
          ...baseDefaults,
          fill: false,
          pointRadius: 3, // Smaller points for sparklines
          pointHoverRadius: 5,
          borderWidth: 2,
        }
      }
    
    default:
      return { line: baseDefaults }
  }
}

export default useChartTheme