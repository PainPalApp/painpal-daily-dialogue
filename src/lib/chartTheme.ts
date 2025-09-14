// Centralized chart theme configuration for both Chart.js and Recharts
// Design tokens based on app theme

export const CHART_COLORS = {
  // Chart-specific tokens from design system
  line: '#8B5CF6',           // chart.line - mid purple
  point: '#A78BFA',          // chart.point - accent
  grid: '#232445',           // chart.grid - border at 60% opacity when used
  axis: '#232445',           // chart.axis - border
  label: '#BDB8E6',          // chart.label - text secondary
  background: 'transparent', // chart.background
  
  // Legacy colors for compatibility
  border: '#232445',
  textSecondary: '#BDB8E6',
  textPrimary: '#FFFFFF',
  accent: '#A78BFA',
  surface: '#17182B',
  
  // Derived colors
  gridLines: '#232445',
  accentFaded: 'rgba(139, 92, 246, 0.12)', // Using chart.line at 12% opacity
  accentMedium: 'rgba(139, 92, 246, 0.6)', // Using chart.line at 60% opacity
  pointGlow: 'rgba(167, 139, 250, 0.4)', // Using chart.point at 40% opacity for glow
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

// Chart.js theme configuration
export const getChartJSTheme = () => ({
  // Global defaults
  color: CHART_COLORS.textSecondary,
  backgroundColor: CHART_COLORS.transparent,
  borderColor: CHART_COLORS.border,
  
  // Scale defaults
  scales: {
    x: {
      ticks: {
        color: CHART_COLORS.label,
        font: {
          size: 11, // Slightly smaller for mobile
        },
      },
      grid: {
        color: `${CHART_COLORS.grid}99`, // 60% opacity
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
      ticks: {
        color: CHART_COLORS.label,
        font: {
          size: 11, // Slightly smaller for mobile
        },
      },
      grid: {
        color: `${CHART_COLORS.grid}99`, // 60% opacity
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
  
  // Plugin defaults
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
      titleFont: {
        size: 12,
        weight: '600',
      },
      bodyFont: {
        size: 11,
      },
    },
    legend: {
      labels: {
        color: CHART_COLORS.label,
        font: {
          size: 11,
        },
      },
    },
  },
  
  // Dataset defaults
  datasets: {
    line: {
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
      fill: false,
      tension: 0.3,
    },
    area: {
      borderColor: CHART_COLORS.line,
      backgroundColor: CHART_COLORS.accentFaded,
      borderWidth: 2,
      pointBackgroundColor: CHART_COLORS.point,
      pointBorderColor: 'transparent',
      pointBorderWidth: 0,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointHoverBorderWidth: 0,
      pointHoverBackgroundColor: CHART_COLORS.point,
      fill: true,
      tension: 0.3,
    },
  },
});

// Recharts theme configuration
export const getRechartsTheme = () => ({
  // Grid and axis colors
  cartesianGrid: {
    stroke: `${CHART_COLORS.grid}99`, // 60% opacity
    strokeDasharray: '3 3',
    strokeWidth: 1,
  },
  
  // Axis styling
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
  
  // Line styling
  line: {
    stroke: CHART_COLORS.line,
    strokeWidth: 2,
    dot: {
      fill: CHART_COLORS.point,
      stroke: 'none',
      strokeWidth: 0,
      r: 4,
    },
    activeDot: {
      fill: CHART_COLORS.point,
      stroke: 'none',
      strokeWidth: 0,
      r: 6,
      filter: `drop-shadow(0 0 8px ${CHART_COLORS.point}66)`, // 40% opacity glow
    },
  },
  
  // Area styling
  area: {
    fill: CHART_COLORS.accentFaded,
    stroke: CHART_COLORS.line,
    strokeWidth: 2,
  },
  
  // Bar styling
  bar: {
    fill: CHART_COLORS.line,
  },
  
  // Tooltip styling
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
});

// Utility function to merge theme with custom options
export const mergeChartJSOptions = (customOptions: any = {}) => {
  const theme = getChartJSTheme();
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    ...theme,
    ...customOptions,
    scales: {
      ...theme.scales,
      ...customOptions.scales,
    },
    plugins: {
      ...theme.plugins,
      ...customOptions.plugins,
    },
  };
};

// CSS variables for chart styling (if needed)
export const CHART_CSS_VARS = {
  '--chart-line': CHART_COLORS.line,
  '--chart-point': CHART_COLORS.point,
  '--chart-point-glow': CHART_COLORS.pointGlow,
  '--chart-grid': CHART_COLORS.grid,
  '--chart-axis': CHART_COLORS.axis,
  '--chart-label': CHART_COLORS.label,
  '--chart-background': CHART_COLORS.background,
  '--chart-border': CHART_COLORS.border,
  '--chart-text-secondary': CHART_COLORS.textSecondary,
  '--chart-text-primary': CHART_COLORS.textPrimary,
  '--chart-accent': CHART_COLORS.accent,
  '--chart-surface': CHART_COLORS.surface,
  '--chart-grid-opacity': `${CHART_COLORS.grid}99`,
  '--chart-accent-faded': CHART_COLORS.accentFaded,
} as const;