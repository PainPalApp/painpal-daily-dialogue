import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, Pill, FileText, AlertTriangle, Edit, Save, X, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PainChart } from '@/components/PainChart';
import { DateRangePicker } from '@/components/DateRangePicker';
import { usePainLogs } from '@/hooks/usePainLogs';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from 'react-day-picker';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

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

export const InsightsSection = () => {
  const [painData, setPainData] = useState<PainEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<PainEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Page state for date range
  const [state, setState] = useState<{
    startDate: Date;
    endDate: Date;
  }>(() => {
    // Initialize with URL params if available
    const urlParams = new URLSearchParams(window.location.search);
    const startParam = urlParams.get('start');
    const endParam = urlParams.get('end');
    
    if (startParam && endParam) {
      try {
        const startDate = new Date(startParam);
        const endDate = new Date(endParam);
        
        // Validate dates
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          return {
            startDate,
            endDate,
          };
        }
      } catch (error) {
        console.warn('Invalid date parameters in URL:', error);
      }
    }
    
    // Default to last 7 days
    return {
      startDate: subDays(new Date(), 7),
      endDate: new Date(),
    };
  });

  const { toast } = useToast();
  const { getPainLogs, updatePainLog, deletePainLog } = usePainLogs();

  // Transform Supabase data to PainEntry format
  const transformSupabaseData = (supabaseData: any[]): PainEntry[] => {
    return supabaseData.map((entry) => ({
      id: entry.id,
      date: entry.logged_at.split('T')[0], // Extract date part
      timestamp: entry.logged_at,
      painLevel: entry.pain_level,
      location: entry.pain_locations || [],
      triggers: entry.triggers || [],
      medications: entry.medications || [],
      notes: entry.notes || '',
      symptoms: [], // Not currently used in Supabase schema
      status: 'active'
    }));
  };

  // Handle date range selection
  const handleCustomDateChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      const newState = {
        startDate: range.from,
        endDate: range.to,
      };
      setState(newState);
      
      // Update URL
      updateURL(newState.startDate, newState.endDate);
    }
  };
  
  // Function to update URL without page reload
  const updateURL = (startDate: Date, endDate: Date) => {
    const url = new URL(window.location.href);
    url.searchParams.set('start', format(startDate, 'yyyy-MM-dd'));
    url.searchParams.set('end', format(endDate, 'yyyy-MM-dd'));
    window.history.replaceState({}, '', url.toString());
  };


  useEffect(() => {
    const loadPainData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setPainData([]);
          return;
        }

        // Query pain logs filtered by user and date range
        const { data: logs, error } = await supabase
          .from('pain_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('logged_at', state.startDate.toISOString())
          .lte('logged_at', state.endDate.toISOString())
          .order('logged_at', { ascending: true });

        if (error) {
          console.error('Error loading pain data:', error);
          setPainData([]);
          return;
        }

        const transformedData = transformSupabaseData(logs || []);
        setPainData(transformedData);
      } catch (error) {
        console.error('Error loading pain data:', error);
        setPainData([]);
      }
    };

    loadPainData();

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
          loadPainData(); // Reload data when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.startDate, state.endDate]); // Reload when date range changes

  // Since we're now filtering at the database level, use all loaded data
  const filteredPainData = painData;

  // Group entries by date
  const groupedEntries = filteredPainData.reduce((groups, entry) => {
    const date = entry.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, PainEntry[]>);

  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(groupedEntries).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPainLevelColor = (level: number | null) => {
    if (level === null) return 'bg-muted';
    if (level <= 3) return 'bg-green-500';
    if (level <= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleEditEntry = (entry: PainEntry) => {
    setEditingEntry({ ...entry });
    setIsEditDialogOpen(true);
  };

  const handleSaveEntry = async () => {
    if (!editingEntry) return;

    const updates = {
      pain_level: editingEntry.painLevel,
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
    if (!editingEntry) return;
    setEditingEntry(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleAddArrayItem = (field: 'location' | 'triggers' | 'symptoms', value: string) => {
    if (!editingEntry || !value.trim()) return;
    const currentArray = editingEntry[field] as string[];
    if (!currentArray.includes(value.trim())) {
      handleEditInputChange(field, [...currentArray, value.trim()]);
    }
  };

  const handleRemoveArrayItem = (field: 'location' | 'triggers' | 'symptoms', index: number) => {
    if (!editingEntry) return;
    const currentArray = editingEntry[field] as string[];
    handleEditInputChange(field, currentArray.filter((_, i) => i !== index));
  };

  // Handle empty state button actions
  const handleUseLast7Days = () => {
    const last7Range = {
      from: subDays(new Date(), 7),
      to: new Date(),
    };
    handleCustomDateChange(last7Range);
  };

  const handleJumpToToday = () => {
    const todayRange = {
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    };
    handleCustomDateChange(todayRange);
  };

  if (filteredPainData.length === 0) {
    return (
    <div className="flex-1 bg-background page-padding py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 style={{ fontSize: 'clamp(18px, 4.8vw, 22px)', fontWeight: 500 }} className="text-foreground">Insights</h1>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6" aria-live="polite">
            Showing {format(state.startDate, 'MMM d, yyyy')} → {format(state.endDate, 'MMM d, yyyy')}
          </p>
          
          {/* Date Range Picker */}
          <div className="mb-6">
            <DateRangePicker
              value={{ from: state.startDate, to: state.endDate }}
              onChange={handleCustomDateChange}
            />
          </div>
          
          <Card className="insights-card">
            <CardContent style={{ padding: 'clamp(12px, 2vw, 20px)' }} className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-section mb-2">No Entries in Selected Range</h3>
                <p className="text-body text-muted-foreground mb-6">Try adjusting your date range to see insights.</p>
                <div className="flex gap-2 justify-center overflow-x-auto scrollbar-hide lg:justify-center lg:overflow-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <Button onClick={handleUseLast7Days} variant="outline" className="min-h-[44px] min-w-[44px] whitespace-nowrap flex-shrink-0">
                    Use Last 7 days
                  </Button>
                  <Button onClick={handleJumpToToday} variant="outline" className="min-h-[44px] min-w-[44px] whitespace-nowrap flex-shrink-0">
                    Jump to Today
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background page-padding py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 style={{ fontSize: 'clamp(18px, 4.8vw, 22px)', fontWeight: 500 }} className="text-foreground">Insights</h1>
        </div>
        
        <p className="text-sm text-muted-foreground mb-6" aria-live="polite">
          Showing {format(state.startDate, 'MMM d, yyyy')} → {format(state.endDate, 'MMM d, yyyy')}
        </p>
        
        {/* Date Range Picker */}
        <div className="mb-6">
          <DateRangePicker
            value={{ from: state.startDate, to: state.endDate }}
            onChange={handleCustomDateChange}
          />
        </div>
        
        {/* Pain Chart */}
        <Card className="insights-card mb-6">
          <CardHeader style={{ padding: 'clamp(12px, 2vw, 20px) clamp(12px, 2vw, 20px) 0' }}>
            <CardTitle className="text-section">Pain Levels Over Time</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: '0 clamp(12px, 2vw, 20px) clamp(12px, 2vw, 20px)' }}>
            <div className="h-20 sm:h-48 md:h-64">
              <PainChart 
                painData={filteredPainData}
                viewMode="custom"
                isCompact={false}
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const entries = groupedEntries[date];
            const avgPain = entries
              .filter(e => e.painLevel !== null)
              .reduce((sum, e) => sum + (e.painLevel || 0), 0) / 
              entries.filter(e => e.painLevel !== null).length;

            return (
              <Card key={date} className="insights-card">
                <CardHeader style={{ padding: 'clamp(12px, 2vw, 20px) clamp(12px, 2vw, 20px) 0' }}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-section flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {formatDate(date)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="badge-responsive">
                        {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                      </Badge>
                      {!isNaN(avgPain) && (
                        <Badge 
                          variant="outline" 
                          className={`text-white badge-responsive ${getPainLevelColor(Math.round(avgPain))}`}
                        >
                          Avg: {avgPain.toFixed(1)}/10
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent style={{ padding: '0 clamp(12px, 2vw, 20px) clamp(12px, 2vw, 20px)' }}>
                  <div className="space-y-4">
                    {entries
                      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                      .map((entry, index) => (
                        <div key={entry.id}>
                          {index > 0 && <Separator className="my-4" />}
                          <div className="grid gap-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                  {formatTime(entry.timestamp)}
                                </span>
                                {entry.painLevel !== null && (
                                  <Badge 
                                    variant="outline"
                                    className={`text-white badge-responsive ${getPainLevelColor(entry.painLevel)}`}
                                  >
                                    Pain: {entry.painLevel}/10
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditEntry(entry)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {entry.location && entry.location.length > 0 && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-wrap gap-1">
                                  {entry.location.map((loc, i) => (
                                    <Badge key={i} variant="secondary" className="badge-responsive">
                                      {loc}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {entry.triggers && entry.triggers.length > 0 && (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-wrap gap-1">
                                  {entry.triggers.map((trigger, i) => (
                                    <Badge key={i} variant="outline" className="badge-responsive">
                                      {trigger}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {entry.medications && entry.medications.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Pill className="h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-wrap gap-1">
                                  {entry.medications.map((med, i) => (
                                    <Badge key={i} variant="secondary" className="badge-responsive">
                                      {typeof med === 'string' ? med : med.name || 'Medication'}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {entry.notes && (
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-body text-foreground">{entry.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pain Entry</DialogTitle>
          </DialogHeader>
          
          {editingEntry && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="painLevel">Pain Level (0-10)</Label>
                <Input
                  id="painLevel"
                  type="number"
                  min="0"
                  max="10"
                  value={editingEntry.painLevel || ''}
                  onChange={(e) => handleEditInputChange('painLevel', e.target.value ? parseInt(e.target.value) : null)}
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

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEntry}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};