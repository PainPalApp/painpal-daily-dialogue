import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePainLogs } from "@/hooks/usePainLogs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, 
  AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CalendarDays, Edit3, Trash2, Filter } from "lucide-react";
import { format, startOfWeek, startOfMonth, endOfMonth, isSameDay, getDay, addDays, parseISO } from "date-fns";
import { PainIndicator } from './PainIndicator';

interface PainLog {
  id: string;
  user_id: string;
  pain_level: number;
  logged_at: string;
  activity?: string;
  medications?: string[];
  notes?: string;
  functional_impact?: string;
  impact_tags?: string[];
  rx_taken?: boolean;
  side_effects?: string;
}

export function RecordsSection() {
  const { user } = useAuth();
  const { updatePainLog, deletePainLog } = usePainLogs();
  const { toast } = useToast();
  
  const [painLogs, setPainLogs] = useState<PainLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"timeline" | "calendar">("timeline");
  const [filterPeriod, setFilterPeriod] = useState<"week" | "month" | "custom">("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEntry, setEditingEntry] = useState<PainLog | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [daySheetOpen, setDaySheetOpen] = useState(false);

  // Edit form state
  const [editPainLevel, setEditPainLevel] = useState(0);
  const [editActivity, setEditActivity] = useState("");
  const [editMeds, setEditMeds] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [editFunctionalImpact, setEditFunctionalImpact] = useState("none");
  const [editImpactTags, setEditImpactTags] = useState<string[]>([]);
  const [editRxTaken, setEditRxTaken] = useState(false);
  const [editSideEffects, setEditSideEffects] = useState("");

  const availableMedications = ["Ibuprofen", "Acetaminophen", "Aspirin", "Naproxen", "Prescription pain medication"];
  const functionalImpactOptions = ["none", "work", "driving", "sleep", "exercise", "household", "mood", "other"];

  useEffect(() => {
    if (user) {
      fetchPainLogs();
    }
  }, [user, filterPeriod, customStartDate, customEndDate]);

  const fetchPainLogs = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('pain_logs')
        .select('*')
        .eq('user_id', user.id);

      // Apply date filters
      const now = new Date();
      let startDate: Date;
      let endDate = new Date();

      if (filterPeriod === "week") {
        startDate = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
      } else if (filterPeriod === "month") {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      } else if (filterPeriod === "custom" && customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
      } else {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      }

      query = query
        .gte('logged_at', startDate.toISOString())
        .lte('logged_at', endDate.toISOString())
        .order('logged_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      setPainLogs(data || []);
    } catch (error) {
      console.error('Error fetching pain logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pain logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (log: PainLog) => {
    setEditingEntry(log);
    setEditPainLevel(log.pain_level);
    setEditActivity(log.activity || "");
    setEditMeds(log.medications || []);
    setEditNotes(log.notes || "");
    setEditFunctionalImpact(log.functional_impact || "none");
    setEditImpactTags(log.impact_tags || []);
    setEditRxTaken(log.rx_taken || false);
    setEditSideEffects(log.side_effects || "");
    setEditSheetOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    try {
      await updatePainLog(editingEntry.id, {
        pain_level: editPainLevel,
        activity: editActivity,
        medications: editMeds,
        notes: editNotes,
        functional_impact: editFunctionalImpact,
        impact_tags: editImpactTags,
        rx_taken: editRxTaken,
        side_effects: editSideEffects,
      });

      toast({
        title: "Success",
        description: "Pain log updated successfully",
      });

      setEditSheetOpen(false);
      fetchPainLogs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update pain log",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (logId: string) => {
    try {
      await deletePainLog(logId);
      toast({
        title: "Success",
        description: "Pain log deleted successfully",
      });
      fetchPainLogs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete pain log",
        variant: "destructive"
      });
    }
  };

  const toggleMedication = (med: string) => {
    setEditMeds(prev => 
      prev.includes(med) 
        ? prev.filter(m => m !== med)
        : [...prev, med]
    );
  };

  const toggleImpactTag = (tag: string) => {
    setEditImpactTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Calendar helpers
  const getCurrentMonth = () => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth()
    };
  };

  const getDaysInMonth = () => {
    const { year, month } = getCurrentMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = startOfWeek(firstDay, { weekStartsOn: 0 });
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      days.push(addDays(startDate, i));
    }
    return days;
  };

  const getDayPainLevel = (date: Date) => {
    const dayLogs = painLogs.filter(log => 
      isSameDay(parseISO(log.logged_at), date)
    );
    if (dayLogs.length === 0) return null;
    return Math.max(...dayLogs.map(log => log.pain_level));
  };

  const getDayLogs = (date: Date) => {
    return painLogs.filter(log => 
      isSameDay(parseISO(log.logged_at), date)
    );
  };

  const handleDayClick = (date: Date) => {
    const dayLogs = getDayLogs(date);
    if (dayLogs.length > 0) {
      setSelectedDate(date);
      setDaySheetOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Pain Records</h1>
          <p className="text-muted-foreground">Track and review your pain history</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div className="lila-tab-container">
            <button
              className={`lila-tab ${filterPeriod === "week" ? "lila-tab-active" : ""}`}
              onClick={() => setFilterPeriod("week")}
            >
              This Week
            </button>
            <button
              className={`lila-tab ${filterPeriod === "month" ? "lila-tab-active" : ""}`}
              onClick={() => setFilterPeriod("month")}
            >
              This Month
            </button>
            <button
              className={`lila-tab ${filterPeriod === "custom" ? "lila-tab-active" : ""}`}
              onClick={() => setFilterPeriod("custom")}
            >
              Custom Range
            </button>
          </div>
          
          {filterPeriod === "custom" && (
            <div className="flex gap-2 items-center">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-40"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-40"
              />
            </div>
          )}
        </div>

        {/* View Toggle */}
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "timeline" | "calendar")}>
          <TabsList className="lila-tab-container mb-6 p-1 bg-transparent">
            <TabsTrigger 
              value="timeline" 
              className="lila-tab data-[state=active]:lila-tab-active flex items-center gap-2"
            >
              <CalendarDays className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger 
              value="calendar" 
              className="lila-tab data-[state=active]:lila-tab-active flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            {/* Timeline View */}
            <div className="space-y-4">
              {painLogs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No pain logs found for the selected period.</p>
                </div>
              ) : (
                painLogs.map((log) => (
                  <div key={log.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-sm text-muted-foreground">
                            {format(parseISO(log.logged_at), 'MMM d, yyyy h:mm a')}
                          </span>
                          <Badge variant={log.pain_level >= 7 ? "destructive" : log.pain_level >= 4 ? "default" : "secondary"}>
                            Pain Level {log.pain_level}/10
                          </Badge>
                        </div>
                        
                        {log.activity && (
                          <p className="text-sm mb-1">
                            <span className="text-muted-foreground">Activity:</span> {log.activity}
                          </p>
                        )}
                        
                        {log.medications && log.medications.length > 0 && (
                          <div className="mb-2">
                            <span className="text-sm text-muted-foreground">Medications:</span>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {log.medications.map((med, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {med}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {log.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{log.notes}</p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(log)}
                          className="text-icon-default hover:text-icon-active"
                        >
                          <Edit3 className="h-4 w-4 icon-default" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-icon-default hover:text-icon-active">
                              <Trash2 className="h-4 w-4 icon-default" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Pain Log</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this pain log? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(log.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            {/* Calendar View */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium">
                  {format(new Date(getCurrentMonth().year, getCurrentMonth().month), 'MMMM yyyy')}
                </h3>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Header */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                
                {/* Days */}
                {getDaysInMonth().map(date => {
                  const painLevel = getDayPainLevel(date);
                  const isCurrentMonth = date.getMonth() === getCurrentMonth().month;
                  const hasLogs = getDayLogs(date).length > 0;
                  
                  return (
                    <div
                      key={date.toString()}
                      className={`
                        p-2 h-12 border border-border cursor-pointer transition-colors
                        ${!isCurrentMonth ? 'text-muted-foreground bg-muted/30' : ''}
                        ${hasLogs ? 'hover:bg-accent' : ''}
                      `}
                      onClick={() => handleDayClick(date)}
                    >
                       <div className="text-sm">{date.getDate()}</div>
                       {painLevel !== null && (
                         <PainIndicator painLevel={painLevel} />
                       )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Sheet */}
        <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit Pain Log</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              {/* Pain Level */}
              <div className="space-y-2">
                <Label>Pain Level (0-10)</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={editPainLevel}
                  onChange={(e) => setEditPainLevel(parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Activity */}
              <div className="space-y-2">
                <Label>Activity</Label>
                <Input
                  value={editActivity}
                  onChange={(e) => setEditActivity(e.target.value)}
                  placeholder="What were you doing?"
                />
              </div>

              {/* Functional Impact */}
              <div className="space-y-2">
                <Label>Functional Impact</Label>
                <Select value={editFunctionalImpact} onValueChange={setEditFunctionalImpact}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {functionalImpactOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Impact Tags */}
              {editFunctionalImpact !== "none" && (
                <div className="space-y-2">
                  <Label>Affected Areas</Label>
                  <div className="flex flex-wrap gap-2">
                    {functionalImpactOptions.slice(1).map(tag => (
                      <Badge
                        key={tag}
                        variant={editImpactTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleImpactTag(tag)}
                      >
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications */}
              <div className="space-y-2">
                <Label>Medications Taken</Label>
                <div className="flex flex-wrap gap-2">
                  {availableMedications.map(med => (
                    <Badge
                      key={med}
                      variant={editMeds.includes(med) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleMedication(med)}
                    >
                      {med}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Side Effects */}
              {editMeds.length > 0 && (
                <div className="space-y-2">
                  <Label>Side Effects (optional)</Label>
                  <Textarea
                    value={editSideEffects}
                    onChange={(e) => setEditSideEffects(e.target.value)}
                    placeholder="Any side effects from medications?"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Additional notes about this pain episode..."
                />
              </div>

              <Button onClick={handleSaveEdit} className="w-full">
                Save Changes
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Day Details Sheet */}
        <Sheet open={daySheetOpen} onOpenChange={setDaySheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-6">
              {selectedDate && getDayLogs(selectedDate).map((log) => (
                <div key={log.id} className="bg-background border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-sm text-muted-foreground">
                          {format(parseISO(log.logged_at), 'h:mm a')}
                        </span>
                        <Badge variant={log.pain_level >= 7 ? "destructive" : log.pain_level >= 4 ? "default" : "secondary"}>
                          Pain Level {log.pain_level}/10
                        </Badge>
                      </div>
                      
                      {log.activity && (
                        <p className="text-sm mb-1">
                          <span className="text-muted-foreground">Activity:</span> {log.activity}
                        </p>
                      )}
                      
                      {log.medications && log.medications.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm text-muted-foreground">Medications:</span>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {log.medications.map((med, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {med}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {log.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{log.notes}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDaySheetOpen(false);
                          handleEdit(log);
                        }}
                        className="text-icon-default hover:text-icon-active"
                      >
                        <Edit3 className="h-4 w-4 icon-default" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-icon-default hover:text-icon-active">
                            <Trash2 className="h-4 w-4 icon-default" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Pain Log</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this pain log? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => {
                              handleDelete(log.id);
                              setDaySheetOpen(false);
                            }}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}