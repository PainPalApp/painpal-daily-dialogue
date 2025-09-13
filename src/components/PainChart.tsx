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
}

const PainChartComponent = ({ painData, viewMode, isCompact = false }: PainChartProps) => {
  const { canvasRef, isChartReady } = usePainChart(painData, viewMode);

  if (painData.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
        No pain data to display
      </div>
    );
  }

  return (
    <div className="relative h-20 sm:h-48 md:h-64">
      <canvas 
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      {!isChartReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-sm text-muted-foreground">Loading chart...</div>
        </div>
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const PainChart = memo(PainChartComponent, (prevProps, nextProps) => {
  // Custom comparison function to prevent re-renders when data hasn't actually changed
  return (
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.isCompact === nextProps.isCompact &&
    JSON.stringify(prevProps.painData) === JSON.stringify(nextProps.painData)
  );
});