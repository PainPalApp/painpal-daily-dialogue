import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePainLogs } from '@/hooks/usePainLogs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Pill, FileText, AlertTriangle, Edit, Save, X, BarChart3, Stethoscope, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PainChart } from '@/components/PainChart';
import { PainPatternsCard } from '@/components/PainPatternsCard';
import { FunctionalImpactCard } from '@/components/FunctionalImpactCard';
import { MedicationsCard } from '@/components/MedicationsCard';
import { DoctorSummaryDrawer } from '@/components/DoctorSummaryDrawer';
import { DateRangePicker } from '@/components/DateRangePicker';
import { ChartContainer, ChartCard, StatBadge, ChipPill, DayGroupCard, EntryRow, EmptyState, DrawerSheet } from '@/components/lila';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { getLocalTodayUtcRangeISO, isSingleDay } from '@/lib/dateUtils';

interface PainEntry {
  id: number;
  logged_at: string;
  pain_level: number | null;
  location?: string[];
  triggers?: string[];
  medications?: any[];
  notes?: string;
  symptoms?: string[];
  status?: string;
}

interface DateRangeState {
  startISO: string;
  endISO: string;
  preset: 'today' | 'last7' | 'last30' | 'last60' | 'last90' | 'custom';
}

export const InsightsSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updatePainLog } = usePainLogs();
  const { toast } = useToast();
  
  // State
  const [painData, setPainData] = useState<PainEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<PainEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDoctorSummaryOpen, setIsDoctorSummaryOpen] = useState(false);
  
  // Single source of truth for date range
  const [range, setRange] = useState<DateRangeState>(() => {
    // Initialize with URL params or default to last 7 days
    const urlParams = new URLSearchParams(window.location.search);
    const startParam = urlParams.get('start');
    const endParam = urlParams.get('end');
    
    if (startParam && endParam) {
      try {
        const startDate = new Date(startParam);
        const endDate = new Date(endParam);
        
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          return {
            startISO: startOfDay(startDate).toISOString(),
            endISO: endOfDay(endDate).toISOString(),
            preset: 'custom'
          };
        }
      } catch {
        // Fall through to default
      }
    }
    
    // Default to last 7 days
    const endDate = new Date();
    const startDate = subDays(endDate, 6);
    return {
      startISO: startOfDay(startDate).toISOString(),
      endISO: endOfDay(endDate).toISOString(),
      preset: 'last7'
    };
  });
  
  // AbortController ref for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle preset changes
  const handlePresetChange = useCallback((preset: DateRangeState['preset']) => {
    let newRange: DateRangeState;
    
    if (preset === 'today') {
      const { startISO, endISO } = getLocalTodayUtcRangeISO();
      newRange = { startISO, endISO, preset: 'today' };
    } else if (preset === 'last7') {
      const endDate = new Date();
      const startDate = subDays(endDate, 6);
      newRange = {
        startISO: startOfDay(startDate).toISOString(),
        endISO: endOfDay(endDate).toISOString(),
        preset: 'last7'
      };
    } else if (preset === 'last30') {
      const endDate = new Date();
      const startDate = subDays(endDate, 29);
      newRange = {
        startISO: startOfDay(startDate).toISOString(),
        endISO: endOfDay(endDate).toISOString(),
        preset: 'last30'
      };
    } else if (preset === 'last60') {
      const endDate = new Date();
      const startDate = subDays(endDate, 59);
      newRange = {
        startISO: startOfDay(startDate).toISOString(),
        endISO: endOfDay(endDate).toISOString(),
        preset: 'last60'
      };
    } else if (preset === 'last90') {
      const endDate = new Date();
      const startDate = subDays(endDate, 89);
      newRange = {
        startISO: startOfDay(startDate).toISOString(),
        endISO: endOfDay(endDate).toISOString(),
        preset: 'last90'
      };
    } else {
      return; // Custom handled separately
    }
    
    setRange(newRange);
    
    // Clear URL params and push clean route
    navigate('/insights', { replace: true });
  }, [navigate]);

  // Handle custom date range changes
  const handleCustomDateChange = useCallback((dateRange: DateRange | undefined) => {
    if (dateRange?.from && dateRange?.to) {
      const newRange: DateRangeState = {
        startISO: startOfDay(dateRange.from).toISOString(),
        endISO: endOfDay(dateRange.to).toISOString(),
        preset: 'custom'
      };
      setRange(newRange);
      
      // Clear URL params and push clean route
      navigate('/insights', { replace: true });
    }
  }, [navigate]);

  // Data fetching with AbortController
  const fetchPainData = useCallback(async (startISO: string, endISO: string, userId: string) => {
    try {
      setIsLoading(true);
      
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new AbortController
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      console.debug('[Insights] user', userId, 'range', startISO, endISO);

      const { data, error } = await supabase
        .from('pain_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', startISO)
        .lt('logged_at', endISO)
        .order('logged_at', { ascending: true })
        .abortSignal(abortController.signal);

      if (error) throw error;

      const transformedData = (data || []).map(log => ({
        id: parseInt(log.id) || 0,
        logged_at: log.logged_at,
        pain_level: log.pain_level,
        location: log.pain_locations || [],
        triggers: log.triggers || [],
        medications: log.medications || [],
        notes: log.notes || '',
        symptoms: [],
        status: 'active'
      }));

      setPainData(transformedData);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Error loading pain data:', error);
      setPainData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to fetch data when range or user changes
  useEffect(() => {
    // Auth-ready guard
    if (!user?.id) {
      console.debug('[Insights] Waiting for user auth...');
      return;
    }

    fetchPainData(range.startISO, range.endISO, user.id);

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [range.startISO, range.endISO, user?.id, fetchPainData]);

  // Real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('pain_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pain_logs'
        },
        () => {
          fetchPainData(range.startISO, range.endISO, user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [range.startISO, range.endISO, user?.id, fetchPainData]);

  // Auth loading state
  if (!user?.id) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Convert date range for DateRangePicker
  const datePickerValue = {
    from: new Date(range.startISO),
    to: new Date(range.endISO)
  };

  // Prepare data for chart - handle single-day vs multi-day
  const chartData = (() => {
    if (painData.length === 0) return [];
    
    const startDate = new Date(range.startISO);
    const endDate = new Date(range.endISO);
    
    if (isSingleDay(startDate, endDate)) {
      // Single-day: per-log series { x: HH:mm, y: pain_level }
      return painData.map(entry => ({
        x: format(new Date(entry.logged_at), 'HH:mm'),
        y: entry.pain_level
      }));
    } else {
      // Multi-day: daily averages
      const dailyGroups = painData.reduce((acc, entry) => {
        const date = format(new Date(entry.logged_at), 'yyyy-MM-dd');
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry.pain_level);
        return acc;
      }, {} as Record<string, (number | null)[]>);

      return Object.entries(dailyGroups).map(([date, levels]) => {
        const validLevels = levels.filter(level => level !== null) as number[];
        const avg = validLevels.length > 0 
          ? validLevels.reduce((sum, level) => sum + level, 0) / validLevels.length 
          : 0;
        return {
          x: format(new Date(date), 'MMM d'),
          y: Math.round(avg * 10) / 10 // Round to 1 decimal
        };
      });
    }
  })();

  // Handle edit operations
  const handleEditEntry = (entry: PainEntry) => {
    setEditingEntry({ ...entry });
    setIsEditDialogOpen(true);
  };

  const handleSaveEntry = async () => {
    if (!editingEntry) return;

    const updates = {
      pain_level: editingEntry.pain_level,
      pain_locations: editingEntry.location,
      triggers: editingEntry.triggers,
      medications: editingEntry.medications,
      notes: editingEntry.notes
    };

    const success = await updatePainLog(editingEntry.id.toString(), updates);
    
    if (success) {
      const updatedData = painData.map(entry => 
        entry.id === editingEntry.id ? editingEntry : entry
      );
      setPainData(updatedData);
      setIsEditDialogOpen(false);
      setEditingEntry(null);

      toast({
        title: "Entry Updated",
        description: "Your pain entry has been successfully updated.",
      });
    }
  };

  const handleEditInputChange = (field: keyof PainEntry, value: any) => {
    if (editingEntry) {
      setEditingEntry({ ...editingEntry, [field]: value });
    }
  };

  const handleAddArrayItem = (field: 'location' | 'triggers' | 'symptoms', value: string) => {
    if (editingEntry && value.trim()) {
      const currentArray = editingEntry[field] as string[];
      const updatedArray = [...currentArray, value.trim()];
      setEditingEntry({ ...editingEntry, [field]: updatedArray });
    }
  };

  const handleRemoveArrayItem = (field: 'location' | 'triggers' | 'symptoms', index: number) => {
    if (editingEntry) {
      const currentArray = editingEntry[field] as string[];
      const updatedArray = currentArray.filter((_, i) => i !== index);
      setEditingEntry({ ...editingEntry, [field]: updatedArray });
    }
  };

  // Transform data for legacy components
  const transformToLegacyFormat = (data: PainEntry[]): any[] => {
    return data.map(entry => ({
      id: entry.id,
      date: entry.logged_at.split('T')[0],
      timestamp: entry.logged_at,
      painLevel: entry.pain_level,
      location: entry.location || [],
      triggers: entry.triggers || [],
      medications: entry.medications || [],
      notes: entry.notes || '',
      symptoms: entry.symptoms || [],
      status: entry.status || 'active'
    }));
  };

  if (painData.length === 0 && !isLoading) {
    return (
      <div className="flex-1 bg-background page-padding py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h1 style={{ fontSize: 'clamp(18px, 4.8vw, 22px)', fontWeight: 500 }} className="text-foreground">Insights</h1>
            </div>
          </div>
            
          <p className="text-sm text-muted-foreground mb-6" aria-live="polite">
            Showing {format(new Date(range.startISO), 'MMM d, yyyy')} → {format(new Date(range.endISO), 'MMM d, yyyy')}
          </p>
            
          {/* Date Range Picker */}
          <div className="mb-6 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div style={{ whiteSpace: 'nowrap', gap: '8px' }}>
              <DateRangePicker
                value={datePickerValue}
                onChange={handleCustomDateChange}
              />
            </div>
          </div>
            
          <EmptyState 
            icon={<FileText className="h-12 w-12 text-muted-foreground" />}
            title="No Entries in Selected Range"
            description="Try adjusting your date range to see insights."
            actions={
              <div className="flex gap-2 justify-center overflow-x-auto scrollbar-hide lg:justify-center lg:overflow-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
                <Button onClick={() => handlePresetChange('last7')} variant="outline" className="min-h-[44px] min-w-[44px] whitespace-nowrap flex-shrink-0">
                  Use Last 7 days
                </Button>
                <Button onClick={() => handlePresetChange('today')} variant="outline" className="min-h-[44px] min-w-[44px] whitespace-nowrap flex-shrink-0">
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
    <div className="flex-1 bg-background page-padding py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 style={{ fontSize: 'clamp(18px, 4.8vw, 22px)', fontWeight: 500 }} className="text-foreground">Insights</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => navigate('/records')}
              variant="ghost" 
              size="sm"
              className="text-primary hover:text-primary"
            >
              View records <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button 
              onClick={() => setIsDoctorSummaryOpen(true)}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <Stethoscope className="h-4 w-4" />
              <span className="hidden sm:inline">Doctor Summary</span>
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-6" aria-live="polite">
          Showing {format(new Date(range.startISO), 'MMM d, yyyy')} → {format(new Date(range.endISO), 'MMM d, yyyy')}
        </p>
        
        {/* Date Range Picker */}
        <div className="mb-6 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div style={{ whiteSpace: 'nowrap', gap: '8px' }}>
            <DateRangePicker
              value={datePickerValue}
              onChange={handleCustomDateChange}
            />
          </div>
        </div>
        
        {/* Pain Chart */}
        <div className="mb-6">
          <ChartCard 
            title="Pain Levels Over Time"
            heightSm={120}
            heightMd={160}
            heightLg={200}
            chartType="line"
          >
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-full h-8 bg-muted rounded animate-pulse" />
              </div>
            ) : (
              <PainChart 
                painData={painData}
                startDate={new Date(range.startISO)}
                endDate={new Date(range.endISO)}
                isCompact={false}
              />
            )}
          </ChartCard>
        </div>
        
        {/* Pain Patterns */}
        <PainPatternsCard 
          painData={transformToLegacyFormat(painData)}
          onUseLast7Days={() => handlePresetChange('last7')}
          onJumpToToday={() => handlePresetChange('today')}
        />
        
        {/* Functional Impact & Context */}
        <FunctionalImpactCard 
          painData={transformToLegacyFormat(painData)}
          onUseLast7Days={() => handlePresetChange('last7')}
          onJumpToToday={() => handlePresetChange('today')}
        />
        
        {/* Medications */}
        <MedicationsCard 
          painData={transformToLegacyFormat(painData)}
          onUseLast7Days={() => handlePresetChange('last7')}
          onJumpToToday={() => handlePresetChange('today')}
        />
      </div>

      {/* Edit Drawer */}
      <DrawerSheet
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Edit Pain Entry"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEntry}>
              Save Changes
            </Button>
          </div>
        }
      >
        {editingEntry && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pain_level">Pain Level (0-10)</Label>
              <Input
                id="pain_level"
                type="number"
                min="0"
                max="10"
                value={editingEntry.pain_level || ''}
                onChange={(e) => handleEditInputChange('pain_level', e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editingEntry.notes}
                onChange={(e) => handleEditInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label>Pain Locations</Label>
              <div className="space-y-2">
                {editingEntry.location?.map((location, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="secondary">{location}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveArrayItem('location', index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Triggers</Label>
              <div className="space-y-2">
                {editingEntry.triggers?.map((trigger, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="secondary">{trigger}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveArrayItem('triggers', index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Medications</Label>
              <div className="space-y-2">
                {editingEntry.medications?.map((med, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="secondary">{typeof med === 'string' ? med : med.name || 'Unknown'}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DrawerSheet>

      {/* Doctor Summary Drawer */}
      <DoctorSummaryDrawer
        open={isDoctorSummaryOpen}
        onOpenChange={setIsDoctorSummaryOpen}
        painData={transformToLegacyFormat(painData)}
        startDate={new Date(range.startISO)}
        endDate={new Date(range.endISO)}
      />
    </div>
  );
};