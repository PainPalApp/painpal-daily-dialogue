import { usePainChart } from '@/hooks/usePainChart';
import { memo } from 'react';

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

interface PainChartProps {
  painData: PainEntry[];
  viewMode: 'today' | 'week' | 'month' | 'custom';
  isCompact?: boolean;
  width?: number;
  height?: number;
}

const PainChartComponent = ({ painData, viewMode, isCompact = false, width, height }: PainChartProps) => {
  const { canvasRef, isChartReady } = usePainChart(painData, viewMode);

  if (painData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No pain data to display
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
        style={{ 
          display: 'block',
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : '100%'
        }}
      />
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const PainChart = memo(PainChartComponent, (prevProps, nextProps) => {
  // Custom comparison function to prevent re-renders when data hasn't actually changed
  return (
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.isCompact === nextProps.isCompact &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    JSON.stringify(prevProps.painData) === JSON.stringify(nextProps.painData)
  );
});