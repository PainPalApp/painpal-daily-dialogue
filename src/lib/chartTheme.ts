// Centralized chart theme configuration for both Chart.js and Recharts
// Design tokens based on app theme

export const CHART_COLORS = {
  // Primary colors
  border: '#232445',
  textSecondary: '#BDB8E6',
  textPrimary: '#FFFFFF',
  accent: '#A78BFA',
  surface: '#17182B',
  
  // Derived colors
  gridLines: '#232445', // 60% opacity applied in usage
  accentFaded: 'rgba(167, 139, 250, 0.12)', // 12% opacity
  accentMedium: 'rgba(167, 139, 250, 0.6)', // 60% opacity
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
        color: CHART_COLORS.textSecondary,
      },
      grid: {
        color: `${CHART_COLORS.gridLines}99`, // 60% opacity
        drawOnChartArea: true,
        drawTicks: true,
        lineWidth: 1,
      },
      border: {
        color: CHART_COLORS.border,
        width: 1,
      },
    },
    y: {
      ticks: {
        color: CHART_COLORS.textSecondary,
      },
      grid: {
        color: `${CHART_COLORS.gridLines}99`, // 60% opacity
        drawOnChartArea: true,
        drawTicks: true,
        lineWidth: 1,
      },
      border: {
        color: CHART_COLORS.border,
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
    },
    legend: {
      labels: {
        color: CHART_COLORS.textSecondary,
      },
    },
  },
  
  // Dataset defaults
  datasets: {
    line: {
      borderColor: CHART_COLORS.accent,
      backgroundColor: CHART_COLORS.accentFaded,
      borderWidth: 2,
      pointBackgroundColor: CHART_COLORS.white,
      pointBorderColor: CHART_COLORS.accent,
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: false,
      tension: 0.3,
    },
    area: {
      borderColor: CHART_COLORS.accent,
      backgroundColor: CHART_COLORS.accentFaded,
      borderWidth: 2,
      pointBackgroundColor: CHART_COLORS.white,
      pointBorderColor: CHART_COLORS.accent,
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: true,
      tension: 0.3,
    },
  },
});

// Recharts theme configuration
export const getRechartsTheme = () => ({
  // Grid and axis colors
  cartesianGrid: {
    stroke: `${CHART_COLORS.gridLines}99`, // 60% opacity
    strokeDasharray: '3 3',
    strokeWidth: 1,
  },
  
  // Axis styling
  xAxis: {
    tick: { fill: CHART_COLORS.textSecondary, fontSize: 12 },
    axisLine: { stroke: CHART_COLORS.border, strokeWidth: 1 },
    tickLine: { stroke: CHART_COLORS.border, strokeWidth: 1 },
  },
  
  yAxis: {
    tick: { fill: CHART_COLORS.textSecondary, fontSize: 12 },
    axisLine: { stroke: CHART_COLORS.border, strokeWidth: 1 },
    tickLine: { stroke: CHART_COLORS.border, strokeWidth: 1 },
  },
  
  // Line styling
  line: {
    stroke: CHART_COLORS.accent,
    strokeWidth: 2,
    dot: {
      fill: CHART_COLORS.white,
      stroke: CHART_COLORS.accent,
      strokeWidth: 2,
      r: 4,
    },
    activeDot: {
      fill: CHART_COLORS.accent,
      stroke: CHART_COLORS.white,
      strokeWidth: 2,
      r: 6,
    },
  },
  
  // Area styling
  area: {
    fill: CHART_COLORS.accentFaded,
    stroke: CHART_COLORS.accent,
    strokeWidth: 2,
  },
  
  // Bar styling
  bar: {
    fill: CHART_COLORS.accent,
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
  '--chart-border': CHART_COLORS.border,
  '--chart-text-secondary': CHART_COLORS.textSecondary,
  '--chart-text-primary': CHART_COLORS.textPrimary,
  '--chart-accent': CHART_COLORS.accent,
  '--chart-surface': CHART_COLORS.surface,
  '--chart-grid': `${CHART_COLORS.gridLines}99`,
  '--chart-accent-faded': CHART_COLORS.accentFaded,
} as const;