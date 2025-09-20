import { useMemo } from 'react';
import { ChartContainer, EmptyState } from '@/components/lila';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, Pill, FileText } from 'lucide-react';

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
  functional_impact?: string;
  impact_tags?: string[];
  side_effects?: string;
  rx_taken?: boolean;
}

interface MedicationAnalysis {
  name: string;
  effectivenessDelta: number;
  sampleSize: number;
  sideEffectsRate: number | null;
  rxCount: number;
  totalCount: number;
}

interface MedicationsCardProps {
  painData: PainEntry[];
  onUseLast7Days: () => void;
  onJumpToToday: () => void;
}

export const MedicationsCard = ({ painData, onUseLast7Days, onJumpToToday }: MedicationsCardProps) => {
  const medicationAnalyses = useMemo(() => {
    // Extract all medications from pain data and analyze effectiveness
    const medicationPairs: { [medication: string]: { deltas: number[], sideEffects: number, rxCount: number, totalCount: number } } = {};
    
    // Sort pain data by timestamp for pairing logic
    const sortedData = [...painData].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    sortedData.forEach((currentEntry, index) => {
      if (!currentEntry.medications || currentEntry.medications.length === 0) return;
      
      // Find next log within 2-4 hours
      const currentTime = new Date(currentEntry.timestamp).getTime();
      const twoHours = 2 * 60 * 60 * 1000;
      const fourHours = 4 * 60 * 60 * 1000;
      
      const nextEntry = sortedData.slice(index + 1).find(entry => {
        const entryTime = new Date(entry.timestamp).getTime();
        const timeDiff = entryTime - currentTime;
        return timeDiff >= twoHours && timeDiff <= fourHours;
      });
      
      if (!nextEntry || currentEntry.painLevel === null || nextEntry.painLevel === null) return;
      
      // Process each medication in current entry
      currentEntry.medications.forEach((medication: any) => {
        const medName = typeof medication === 'string' ? medication : medication.name || String(medication);
        
        if (!medicationPairs[medName]) {
          medicationPairs[medName] = { deltas: [], sideEffects: 0, rxCount: 0, totalCount: 0 };
        }
        
        // Calculate effectiveness delta
        const delta = nextEntry.painLevel! - currentEntry.painLevel!;
        medicationPairs[medName].deltas.push(delta);
        medicationPairs[medName].totalCount++;
        
        // Count side effects (if column exists and has non-null/non-empty value)
        if (currentEntry.side_effects && currentEntry.side_effects.trim() !== '') {
          medicationPairs[medName].sideEffects++;
        }
        
        // Count RX usage
        if (currentEntry.rx_taken === true) {
          medicationPairs[medName].rxCount++;
        }
      });
    });
    
    // Convert to analysis format and sort by effectiveness (most negative delta first)
    const analyses: MedicationAnalysis[] = Object.entries(medicationPairs)
      .map(([name, data]) => {
        const meanDelta = data.deltas.reduce((sum, delta) => sum + delta, 0) / data.deltas.length;
        const sideEffectsRate = data.totalCount > 0 ? (data.sideEffects / data.totalCount) * 100 : null;
        
        return {
          name,
          effectivenessDelta: meanDelta,
          sampleSize: data.deltas.length,
          sideEffectsRate,
          rxCount: data.rxCount,
          totalCount: data.totalCount
        };
      })
      .sort((a, b) => a.effectivenessDelta - b.effectivenessDelta); // Most negative (best) first
    
    return analyses;
  }, [painData]);
  
  if (medicationAnalyses.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">Medications</h2>
        </div>
        <div className="bg-card border rounded-lg">
          <EmptyState 
            icon={<Pill className="h-12 w-12" />}
            title="No medication data to analyze"
            description="Track medications and pain levels to see effectiveness patterns."
            actions={
              <div className="flex gap-2">
                <Button onClick={onUseLast7Days} variant="outline" size="sm">
                  Use Last 7 days
                </Button>
                <Button onClick={onJumpToToday} variant="outline" size="sm">
                  Jump to Today
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-foreground">Medications</h2>
      </div>
      <div className="bg-card border rounded-lg p-4">
        <div className="space-y-3">
          {medicationAnalyses.map((med) => (
            <div key={med.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground truncate">{med.name}</span>
                  {med.rxCount > 0 && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                      RX
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>n={med.sampleSize}</span>
                  {med.sideEffectsRate !== null && (
                    <>
                      <span>•</span>
                      <span>{med.sideEffectsRate.toFixed(0)}% side effects</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1 ml-2">
                {med.effectivenessDelta < 0 && (
                  <ArrowDown className="h-3 w-3 text-green-500" />
                )}
                <span 
                  className={`text-sm font-medium ${
                    med.effectivenessDelta < 0 ? 'text-green-600' : 'text-muted-foreground'
                  }`}
                >
                  {med.effectivenessDelta < 0 ? '−' : '+'}
                  {Math.abs(med.effectivenessDelta).toFixed(1)} in 2–4h
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};