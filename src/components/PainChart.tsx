import { usePainChart } from '@/hooks/usePainChart';

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
  viewMode: 'today' | 'week';
  isCompact?: boolean;
}

export const PainChart = ({ painData, viewMode, isCompact = false }: PainChartProps) => {
  const { canvasRef, isChartReady } = usePainChart(painData, viewMode);

  if (painData.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
        No pain data to display
      </div>
    );
  }

  return (
    <div className="relative" style={{ height: isCompact ? '80px' : '200px' }}>
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