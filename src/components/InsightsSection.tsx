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
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

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

export const InsightsSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updatePainLog } = usePainLogs();
  const { toast } = useToast();
  const [painData, setPainData] = useState<PainEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<PainEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDoctorSummaryOpen, setIsDoctorSummaryOpen] = useState(false);
  
  // AbortController ref for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Page state for date range
  const [state, setState] = useState<{
    startDate: Date;
    endDate: Date;
  }>(() => {
    // Initialize with URL params if available
    const urlParams = new URLSearchParams(window.location.search);
    const startParam = urlParams.get('start');
    const endParam = urlParams.get('end');
    
    let initialStartDate: Date;
    let initialEndDate: Date;
    
    if (startParam && endParam) {
      try {
        initialStartDate = new Date(startParam);
        initialEndDate = new Date(endParam);
        
        // Validate the dates
        if (isNaN(initialStartDate.getTime()) || isNaN(initialEndDate.getTime())) {
          throw new Error('Invalid dates');
        }
      } catch {
        // Fall back to last 7 days if URL params are invalid
        initialEndDate = new Date();
        initialStartDate = subDays(initialEndDate, 6);
      }
    } else {
      // Default to last 7 days
      initialEndDate = new Date();
      initialStartDate = subDays(initialEndDate, 6);
    }
    
    return {
      startDate: initialStartDate,
      endDate: initialEndDate
    };
  });
  
  // Validation function for date ranges
  const validateAndSetDateRange = useCallback((startDate: Date | null, endDate: Date | null) => {
    let validStartDate: Date;
    let validEndDate: Date;
    
    if (!startDate || !endDate || startDate > endDate) {
      // Fall back to last 7 days if invalid range
      validEndDate = new Date();
      validStartDate = subDays(validEndDate, 6);
    } else {
      validStartDate = startOfDay(startDate);
      validEndDate = endOfDay(endDate);
    }
    
    const newState = {
      startDate: validStartDate,
      endDate: validEndDate
    };
    
    setState(newState);
    return newState;
  }, []);
  
  // Handle date range changes from DateRangePicker
  const handleCustomDateChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      validateAndSetDateRange(range.from, range.to);
    } else if (range?.from || range?.to) {
      // Partial range - fall back to Last 7 days
      validateAndSetDateRange(null, null);
    }
  };
  
  // Function to update URL without page reload
  const updateURL = (startDate: Date, endDate: Date) => {
    const url = new URL(window.location.href);
    url.searchParams.set('start', format(startDate, 'yyyy-MM-dd'));
    url.searchParams.set('end', format(endDate, 'yyyy-MM-dd'));
    window.history.replaceState({}, '', url.toString());
  };

  // Function to jump to today's date
  const handleJumpToToday = () => {
    const today = new Date();
    const newState = validateAndSetDateRange(today, today);
    updateURL(newState.startDate, newState.endDate);
  };

  // Function to use last 7 days
  const handleUseLast7Days = () => {
    const endDate = new Date();
    const startDate = subDays(endDate, 6); // 7 days inclusive
    const newState = validateAndSetDateRange(startDate, endDate);
    updateURL(newState.startDate, newState.endDate);
  };

  // Debounced data loading function with AbortController
  const debouncedLoadPainData = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      let abortController: AbortController | null = null;
      
      return async (startDate: Date, endDate: Date) => {
        clearTimeout(timeoutId);
        
        timeoutId = setTimeout(async () => {
          if (!user?.id) return;
          
          try {
            setIsLoading(true);
            
            // Cancel previous request
            if (abortController) {
              abortController.abort();
            }
            abortController = new AbortController();
            abortControllerRef.current = abortController;

            const { data, error } = await supabase
              .from('pain_logs')
              .select('*')
              .eq('user_id', user.id)
              .gte('logged_at', startDate.toISOString())
              .lt('logged_at', endDate.toISOString()) // Use lt for [start, end) range
              .order('logged_at', { ascending: true })
              .abortSignal(abortController.signal);

            if (error) throw error;

            const transformedData = (data || []).map(log => ({
              id: parseInt(log.id) || 0, // Convert to number
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
        }, 200); // 200ms debounce
      };
    })(),
    [user]
  );

  useEffect(() => {
    // Validate current date range on mount and state changes
    const validatedState = validateAndSetDateRange(state.startDate, state.endDate);
    
    // Load data with debouncing
    debouncedLoadPainData(validatedState.startDate, validatedState.endDate);

    // Listen for real-time updates
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
          // Reload data when changes occur (without debouncing for real-time updates)
          debouncedLoadPainData(state.startDate, state.endDate);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.startDate, state.endDate, debouncedLoadPainData, validateAndSetDateRange]); // Reload when date range changes

  // Since we're now filtering at the database level, use all loaded data
  const filteredPainData = painData;

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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Transform data for components that still expect old interface
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

  if (filteredPainData.length === 0 && !isLoading) {
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
              Showing {format(state.startDate, 'MMM d, yyyy')} → {format(state.endDate, 'MMM d, yyyy')}
            </p>
            
            {/* Date Range Picker */}
            <div className="mb-6 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div style={{ whiteSpace: 'nowrap', gap: '8px' }}>
                <DateRangePicker
                  value={{ from: state.startDate, to: state.endDate }}
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
                  <Button onClick={handleUseLast7Days} variant="outline" className="min-h-[44px] min-w-[44px] whitespace-nowrap flex-shrink-0">
                    Use Last 7 days
                  </Button>
                  <Button onClick={handleJumpToToday} variant="outline" className="min-h-[44px] min-w-[44px] whitespace-nowrap flex-shrink-0">
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
          Showing {format(state.startDate, 'MMM d, yyyy')} → {format(state.endDate, 'MMM d, yyyy')}
        </p>
        
        {/* Date Range Picker */}
        <div className="mb-6 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div style={{ whiteSpace: 'nowrap', gap: '8px' }}>
            <DateRangePicker
              value={{ from: state.startDate, to: state.endDate }}
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
                painData={filteredPainData}
                startDate={state.startDate}
                endDate={state.endDate}
                isCompact={false}
              />
            )}
          </ChartCard>
        </div>
        
        {/* Pain Patterns */}
        <PainPatternsCard 
          painData={transformToLegacyFormat(filteredPainData)}
          onUseLast7Days={handleUseLast7Days}
          onJumpToToday={handleJumpToToday}
        />
        
        {/* Functional Impact & Context */}
        <FunctionalImpactCard 
          painData={transformToLegacyFormat(filteredPainData)}
          onUseLast7Days={handleUseLast7Days}
          onJumpToToday={handleJumpToToday}
        />
        
        {/* Medications */}
        <MedicationsCard 
          painData={transformToLegacyFormat(filteredPainData)}
          onUseLast7Days={handleUseLast7Days}
          onJumpToToday={handleJumpToToday}
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
              <div className="flex flex-wrap gap-1 mb-2">
                {editingEntry.location.map((loc, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {loc}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleRemoveArrayItem('location', index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add location..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddArrayItem('location', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <Label>Triggers</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {editingEntry.triggers.map((trigger, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {trigger}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleRemoveArrayItem('triggers', index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add trigger..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddArrayItem('triggers', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <Label>Symptoms</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {editingEntry.symptoms.map((symptom, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {symptom}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => handleRemoveArrayItem('symptoms', index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add symptom..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddArrayItem('symptoms', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </DrawerSheet>
      
      {/* Doctor Summary Drawer */}
      <DoctorSummaryDrawer
        open={isDoctorSummaryOpen}
        onOpenChange={setIsDoctorSummaryOpen}
        painData={transformToLegacyFormat(filteredPainData)}
        startDate={state.startDate}
        endDate={state.endDate}
      />
    </div>
  );
};