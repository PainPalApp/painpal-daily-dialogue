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
import { format, subDays, isWithinInterval } from 'date-fns';

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
  
  // Page state for date range and preset
  const [state, setState] = useState<{
    startDate: Date;
    endDate: Date;
    preset: '30d' | '60d' | '90d' | 'custom';
  }>(() => {
    // Initialize with URL params if available
    const urlParams = new URLSearchParams(window.location.search);
    const startParam = urlParams.get('start');
    const endParam = urlParams.get('end');
    
    if (startParam && endParam) {
      return {
        startDate: new Date(startParam),
        endDate: new Date(endParam),
        preset: 'custom',
      };
    }
    
    // Default to last 30 days
    return {
      startDate: subDays(new Date(), 30),
      endDate: new Date(),
      preset: '30d',
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

  // Handle preset selection
  const handlePresetChange = (preset: '30d' | '60d' | '90d') => {
    const days = parseInt(preset.replace('d', ''));
    const newState = {
      startDate: subDays(new Date(), days),
      endDate: new Date(),
      preset,
    };
    setState(newState);
  };

  // Handle custom date range selection
  const handleCustomDateChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setState({
        startDate: range.from,
        endDate: range.to,
        preset: 'custom',
      });
    }
  };

  // Update URL when state changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('start', format(state.startDate, 'yyyy-MM-dd'));
    url.searchParams.set('end', format(state.endDate, 'yyyy-MM-dd'));
    window.history.replaceState({}, '', url.toString());
  }, [state]);

  useEffect(() => {
    const loadPainData = async () => {
      try {
        const logs = await getPainLogs();
        const transformedData = transformSupabaseData(logs);
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
  }, [getPainLogs]);

  // Filter data based on selected date range
  const filteredPainData = painData.filter(entry => {
    const entryDate = new Date(entry.date);
    return isWithinInterval(entryDate, { start: state.startDate, end: state.endDate });
  });

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

  if (filteredPainData.length === 0) {
    return (
      <div className="flex-1 bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">Insights</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Showing {format(state.startDate, 'MMM d, yyyy')} → {format(state.endDate, 'MMM d, yyyy')}
          </p>
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Entries in Selected Range</h3>
                <p className="text-muted-foreground">Try adjusting your date range to see insights.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Insights</h1>
        </div>
        
        <p className="text-sm text-muted-foreground mb-6">
          Showing {format(state.startDate, 'MMM d, yyyy')} → {format(state.endDate, 'MMM d, yyyy')}
        </p>
        
        {/* Date Range Picker */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            {['30d', '60d', '90d'].map((preset) => (
              <Button
                key={preset}
                variant={state.preset === preset ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetChange(preset as '30d' | '60d' | '90d')}
                className="text-sm"
              >
                Last {preset.replace('d', '')} days
              </Button>
            ))}
            <Button
              variant={state.preset === 'custom' ? "default" : "outline"}
              size="sm"
              onClick={() => {
                // This will be handled by the DateRangePicker component
              }}
              className="text-sm"
            >
              Custom range
            </Button>
          </div>
          {state.preset === 'custom' && (
            <DateRangePicker
              value={{ from: state.startDate, to: state.endDate }}
              onChange={handleCustomDateChange}
              className="mb-4"
            />
          )}
        </div>
        
        {/* Pain Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pain Levels Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
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
              <Card key={date}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {formatDate(date)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-sm">
                        {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                      </Badge>
                      {!isNaN(avgPain) && (
                        <Badge 
                          variant="outline" 
                          className={`text-white ${getPainLevelColor(Math.round(avgPain))}`}
                        >
                          Avg: {avgPain.toFixed(1)}/10
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
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
                                    className={`text-white ${getPainLevelColor(entry.painLevel)}`}
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
                                    <Badge key={i} variant="secondary" className="text-xs">
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
                                    <Badge key={i} variant="outline" className="text-xs">
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
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {typeof med === 'string' ? med : med.name || 'Medication'}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {entry.notes && (
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-sm text-foreground">{entry.notes}</p>
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