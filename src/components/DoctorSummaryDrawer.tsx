import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { DrawerSheet } from '@/components/lila/DrawerSheet';
import { FileText, Copy, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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

interface DoctorSummaryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  painData: PainEntry[];
  startDate: Date;
  endDate: Date;
}

export const DoctorSummaryDrawer = ({ 
  open, 
  onOpenChange, 
  painData, 
  startDate, 
  endDate 
}: DoctorSummaryDrawerProps) => {
  const { toast } = useToast();

  const summaryData = useMemo(() => {
    if (painData.length === 0) {
      return {
        avgDailyPain: 0,
        totalDays: 0,
        severeDays: 0,
        topTimes: [],
        topWeekdays: [],
        pctLimited: 0,
        pctStopped: 0,
        pctBed: 0,
        topImpactTags: [],
        medicationLines: []
      };
    }

    // Calculate average daily pain
    const validPainLevels = painData.filter(entry => entry.painLevel !== null);
    const avgDailyPain = validPainLevels.length > 0 
      ? validPainLevels.reduce((sum, entry) => sum + (entry.painLevel || 0), 0) / validPainLevels.length
      : 0;

    // Calculate days and severe days
    const uniqueDates = [...new Set(painData.map(entry => entry.date))];
    const totalDays = uniqueDates.length;
    const severeDays = uniqueDates.filter(date => {
      const dayEntries = painData.filter(entry => entry.date === date && entry.painLevel !== null);
      const maxPainLevel = Math.max(...dayEntries.map(entry => entry.painLevel || 0));
      return maxPainLevel >= 7;
    }).length;

    // Calculate time of day patterns
    const timeOfDayData = painData.reduce((acc, entry) => {
      if (entry.painLevel === null) return acc;
      
      const hour = new Date(entry.timestamp).getHours();
      let timeSlot: string;
      if (hour >= 0 && hour < 6) timeSlot = 'Night';
      else if (hour >= 6 && hour < 12) timeSlot = 'Morning';
      else if (hour >= 12 && hour < 18) timeSlot = 'Afternoon';
      else timeSlot = 'Evening';
      
      if (!acc[timeSlot]) acc[timeSlot] = { total: 0, count: 0 };
      acc[timeSlot].total += entry.painLevel;
      acc[timeSlot].count++;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const topTimes = Object.entries(timeOfDayData)
      .map(([time, data]) => ({ time, avg: data.total / data.count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 2)
      .map(item => item.time);

    // Calculate weekday patterns
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekdayData = painData.reduce((acc, entry) => {
      if (entry.painLevel === null) return acc;
      
      const dayOfWeek = new Date(entry.timestamp).getDay();
      const dayName = weekdayNames[dayOfWeek];
      
      if (!acc[dayName]) acc[dayName] = { total: 0, count: 0 };
      acc[dayName].total += entry.painLevel;
      acc[dayName].count++;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const topWeekdays = Object.entries(weekdayData)
      .map(([day, data]) => ({ day, avg: data.total / data.count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 2)
      .map(item => item.day);

    // Calculate functional impact percentages
    const impactRanks = { none: 0, limited: 1, stopped: 2, bed: 3 };
    const dailyImpacts = uniqueDates.map(date => {
      const dayEntries = painData.filter(entry => entry.date === date && entry.functional_impact);
      if (dayEntries.length === 0) return null;
      
      const maxImpact = dayEntries.reduce((max, entry) => {
        const rank = impactRanks[entry.functional_impact?.toLowerCase() as keyof typeof impactRanks] ?? 0;
        return rank > max ? rank : max;
      }, 0);
      
      return Object.keys(impactRanks)[maxImpact];
    }).filter(Boolean);

    const pctLimited = dailyImpacts.length > 0 ? (dailyImpacts.filter(i => i === 'limited').length / dailyImpacts.length) * 100 : 0;
    const pctStopped = dailyImpacts.length > 0 ? (dailyImpacts.filter(i => i === 'stopped').length / dailyImpacts.length) * 100 : 0;
    const pctBed = dailyImpacts.length > 0 ? (dailyImpacts.filter(i => i === 'bed').length / dailyImpacts.length) * 100 : 0;

    // Top impact tags
    const allTags = painData.flatMap(entry => entry.impact_tags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topImpactTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);

    // Medication analysis
    const medicationPairs: { [medication: string]: { deltas: number[], sideEffects: number, totalCount: number } } = {};
    const sortedData = [...painData].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    sortedData.forEach((currentEntry, index) => {
      if (!currentEntry.medications || currentEntry.medications.length === 0) return;
      
      const currentTime = new Date(currentEntry.timestamp).getTime();
      const twoHours = 2 * 60 * 60 * 1000;
      const fourHours = 4 * 60 * 60 * 1000;
      
      const nextEntry = sortedData.slice(index + 1).find(entry => {
        const entryTime = new Date(entry.timestamp).getTime();
        const timeDiff = entryTime - currentTime;
        return timeDiff >= twoHours && timeDiff <= fourHours;
      });
      
      if (!nextEntry || currentEntry.painLevel === null || nextEntry.painLevel === null) return;
      
      currentEntry.medications.forEach((medication: any) => {
        const medName = typeof medication === 'string' ? medication : medication.name || String(medication);
        
        if (!medicationPairs[medName]) {
          medicationPairs[medName] = { deltas: [], sideEffects: 0, totalCount: 0 };
        }
        
        const delta = nextEntry.painLevel! - currentEntry.painLevel!;
        medicationPairs[medName].deltas.push(delta);
        medicationPairs[medName].totalCount++;
        
        if (currentEntry.side_effects && currentEntry.side_effects.trim() !== '') {
          medicationPairs[medName].sideEffects++;
        }
      });
    });

    const medicationLines = Object.entries(medicationPairs)
      .map(([name, data]) => {
        const meanDelta = data.deltas.reduce((sum, delta) => sum + delta, 0) / data.deltas.length;
        const sideEffectsRate = data.totalCount > 0 ? (data.sideEffects / data.totalCount) * 100 : 0;
        
        return `${name}: ${meanDelta < 0 ? '−' : '+'}${Math.abs(meanDelta).toFixed(1)} in 2–4h (n=${data.deltas.length}); side effects ${sideEffectsRate.toFixed(0)}%`;
      })
      .sort((a, b) => {
        const deltaA = parseFloat(a.split(' ')[1].replace('−', '-').replace('+', ''));
        const deltaB = parseFloat(b.split(' ')[1].replace('−', '-').replace('+', ''));
        return deltaA - deltaB;
      });

    return {
      avgDailyPain,
      totalDays,
      severeDays,
      topTimes,
      topWeekdays,
      pctLimited,
      pctStopped,
      pctBed,
      topImpactTags,
      medicationLines
    };
  }, [painData]);

  const summaryText = `Lila — Summary (${format(startDate, 'MMM d, yyyy')} to ${format(endDate, 'MMM d, yyyy')})

• Avg daily pain: ${summaryData.avgDailyPain.toFixed(1)}/10
• Severe days (≥7): ${summaryData.severeDays} of ${summaryData.totalDays}
• Times of day most affected: ${summaryData.topTimes.join(', ') || 'None'}
• Weekdays most affected: ${summaryData.topWeekdays.join(', ') || 'None'}
• Functional impact: Limited ${summaryData.pctLimited.toFixed(0)}%, Stopped ${summaryData.pctStopped.toFixed(0)}%, Bed ${summaryData.pctBed.toFixed(0)}%
  Top factors: ${summaryData.topImpactTags.join(', ') || 'None'}
• Meds: ${summaryData.medicationLines.join('; ') || 'None tracked'}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      toast({
        title: "Copied to clipboard",
        description: "Summary has been copied as plain text.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pain Summary</title>
        <style>
          @media print {
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              font-size: 12px; 
              line-height: 1.4; 
              margin: 20px;
            }
            h1 { font-size: 16px; margin-bottom: 16px; }
            p { margin: 8px 0; white-space: pre-line; }
          }
        </style>
      </head>
      <body>
        <h1>Pain Summary</h1>
        <p>${summaryText.replace(/\n/g, '<br>')}</p>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const footer = (
    <div className="flex gap-2">
      <Button onClick={handleCopy} variant="outline" className="flex-1">
        <Copy className="h-4 w-4 mr-2" />
        Copy
      </Button>
      <Button onClick={handlePrint} variant="outline" className="flex-1">
        <Printer className="h-4 w-4 mr-2" />
        Print
      </Button>
    </div>
  );

  return (
    <DrawerSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Doctor Summary"
      description={`Pain summary for ${format(startDate, 'MMM d, yyyy')} to ${format(endDate, 'MMM d, yyyy')}`}
      footer={footer}
    >
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-medium text-foreground mb-3">
            Lila — Summary ({format(startDate, 'MMM d, yyyy')} to {format(endDate, 'MMM d, yyyy')})
          </h3>
          
          <div className="space-y-2 text-sm text-foreground">
            <p>• Avg daily pain: <span className="font-medium">{summaryData.avgDailyPain.toFixed(1)}/10</span></p>
            
            <p>• Severe days (≥7): <span className="font-medium">{summaryData.severeDays} of {summaryData.totalDays}</span></p>
            
            <p>• Times of day most affected: <span className="font-medium">{summaryData.topTimes.join(', ') || 'None'}</span></p>
            
            <p>• Weekdays most affected: <span className="font-medium">{summaryData.topWeekdays.join(', ') || 'None'}</span></p>
            
            <p>• Functional impact: <span className="font-medium">Limited {summaryData.pctLimited.toFixed(0)}%, Stopped {summaryData.pctStopped.toFixed(0)}%, Bed {summaryData.pctBed.toFixed(0)}%</span></p>
            {summaryData.topImpactTags.length > 0 && (
              <p className="ml-4">Top factors: <span className="font-medium">{summaryData.topImpactTags.join(', ')}</span></p>
            )}
            
            <div>
              <p>• Meds:</p>
              {summaryData.medicationLines.length > 0 ? (
                <div className="ml-4 space-y-1">
                  {summaryData.medicationLines.map((line, index) => (
                    <p key={index} className="font-medium text-xs">{line}</p>
                  ))}
                </div>
              ) : (
                <p className="ml-4 font-medium">None tracked</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          This summary is generated from your pain tracking data for the selected date range. 
          Please review with your healthcare provider.
        </div>
      </div>
    </DrawerSheet>
  );
};