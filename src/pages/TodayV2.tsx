import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTodayQueries } from "@/hooks/useTodayQueries";
import { usePainLogs } from "@/hooks/usePainLogs";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { TodayV2Sparkline } from "@/components/TodayV2Sparkline";
import { Edit3, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TodayV2 = () => {
  const { user } = useAuth();
  const { todayLogs, last3Logs, activeSession, lastLog, profile, refetchAll } = useTodayQueries();
  const { updatePainLog, deletePainLog } = usePainLogs();
  const { toast } = useToast();

  // State
  const [painLevel, setPainLevel] = useState<number | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [previewPoints, setPreviewPoints] = useState<{ ts: Date; pain_level: number }[]>([]);
  const [medsSheetOpen, setMedsSheetOpen] = useState<boolean>(false);
  const [endLevel, setEndLevel] = useState<number>(0);
  const [showUnresolvedCard, setShowUnresolvedCard] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>("");
  const [otherMedication, setOtherMedication] = useState<string>("");
  const [showOtherMedInput, setShowOtherMedInput] = useState<boolean>(false);
  
  // New functional impact state
  const [functionalImpact, setFunctionalImpact] = useState<string>("none");
  const [impactTags, setImpactTags] = useState<string[]>([]);
  const [rxTaken, setRxTaken] = useState<boolean>(false);
  const [sideEffects, setSideEffects] = useState<string>("");
  
  // Edit/Delete state
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editSheetOpen, setEditSheetOpen] = useState<boolean>(false);
  const [editPainLevel, setEditPainLevel] = useState<number>(0);
  const [editActivity, setEditActivity] = useState<string>("");
  const [editMeds, setEditMeds] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState<string>("");
  const [editTime, setEditTime] = useState<string>("");
  const [editFunctionalImpact, setEditFunctionalImpact] = useState<string>("none");
  const [editImpactTags, setEditImpactTags] = useState<string[]>([]);
  const [editRxTaken, setEditRxTaken] = useState<boolean>(false);
  const [editSideEffects, setEditSideEffects] = useState<string>("");

  // Check if yesterday's pain is still ongoing
  const shouldShowUnresolvedCard = useMemo(() => {
    if (!lastLog || !activeSession) return false;
    const lastLogDate = new Date(lastLog.ts).toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    return lastLogDate === yesterday && showUnresolvedCard;
  }, [lastLog, activeSession, showUnresolvedCard]);

  const painEmojis = ['😊', '😊', '😐', '😐', '😟', '😟', '😣', '😫', '😰', '😱', '😭'];
  
  // Combine profile medications with default options
  const profileMedications = Array.isArray(profile?.current_medications) 
    ? profile.current_medications.map(med => {
        if (typeof med === 'string') return med;
        if (typeof med === 'object' && med !== null && 'name' in med) {
          return (med as { name: string }).name;
        }
        return '';
      }).filter(Boolean)
    : [];
  const defaultMedOptions = ['Ibuprofen', 'Acetaminofen', 'Aspirin', 'Naproxen'];
  const medOptions = [
    ...profileMedications.filter((med: string) => !defaultMedOptions.includes(med)),
    ...defaultMedOptions,
    'Other'
  ];

  const handlePainLevelSelect = (level: number) => {
    setPainLevel(level);
    const newPoint = { ts: new Date(), pain_level: level };
    setPreviewPoints([...previewPoints, newPoint]);
  };

  const handleResolveSession = async () => {
    if (!activeSession?.id) return;
    
    try {
      const { error } = await supabase
        .from('pain_sessions')
        .update({ resolved_at: new Date().toISOString(), end_level: endLevel })
        .eq('id', activeSession.id);
      
      if (error) throw error;
      setShowUnresolvedCard(false);
      refetchAll();
      toast({ description: "Session resolved successfully" });
    } catch (error) {
      console.error('Error resolving session:', error);
      toast({ description: "Failed to resolve session", variant: "destructive" });
    }
  };

  const handleSaveCheckin = async () => {
    // First check: validate user authentication
    if (!user?.id) {
      toast({ 
        description: "Please sign in to save your check-in.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (painLevel === null) return;

    try {
      // Prepare medications list including other medication if specified
      let finalMedications = [...selectedMeds];
      if (otherMedication.trim()) {
        finalMedications = finalMedications.filter(med => med !== 'Other');
        finalMedications.push(otherMedication.trim());
        
        // Optionally update profile with new medication
        const currentMeds = Array.isArray(profile?.current_medications) ? profile.current_medications : [];
        const medicationNames = currentMeds.map(med => {
          if (typeof med === 'string') return med;
          if (typeof med === 'object' && med !== null && 'name' in med) {
            return (med as { name: string }).name;
          }
          return '';
        }).filter(Boolean);
        
        if (!medicationNames.includes(otherMedication.trim())) {
          const newMedication = { name: otherMedication.trim(), dosage: '', frequency: '' };
          const updatedMeds = [...currentMeds, newMedication];
          await supabase
            .from('profiles')
            .update({ current_medications: updatedMeds })
            .eq('id', user.id);
        }
      } else {
        finalMedications = finalMedications.filter(med => med !== 'Other');
      }

      // Create session if no active session exists
      if (!activeSession) {
        const { error: sessionError } = await supabase
          .from('pain_sessions')
          .insert({
            user_id: user.id,
            start_level: painLevel
          });
        
        if (sessionError) console.error('Error creating session:', sessionError);
      }

      // Prepare payload for logging and insertion
      const painLogPayload = {
        user_id: user.id,
        pain_level: painLevel,
        activity: selectedActivity || null,
        medications: finalMedications,
        notes: notes || null,
        functional_impact: functionalImpact,
        impact_tags: impactTags,
        rx_taken: rxTaken,
        side_effects: sideEffects || null
      };

      console.log('Saving pain log with payload:', painLogPayload);

      // Insert pain log
      const { error: logError } = await supabase
        .from('pain_logs')
        .insert(painLogPayload);

      if (logError) throw logError;

      // Reset state
      setPainLevel(null);
      setSelectedActivity("");
      setSelectedMeds([]);
      setPreviewPoints([]);
      setMedsSheetOpen(false);
      setNotes("");
      setOtherMedication("");
      setShowOtherMedInput(false);
      setFunctionalImpact("none");
      setImpactTags([]);
      setRxTaken(false);
      setSideEffects("");

      refetchAll();
      toast({ description: "Check-in saved" });
    } catch (error: any) {
      console.error('Error saving check-in:', error);
      toast({ 
        description: error.message || "Failed to save check-in", 
        variant: "destructive" 
      });
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getPainLevelLabel = (level: number) => {
    if (level === 0) return "No pain";
    if (level <= 3) return "Mild";
    if (level <= 6) return "Moderate";
    if (level <= 9) return "Severe";
    return "Worst";
  };

  const truncateUserId = (userId: string) => {
    if (userId.length <= 12) return userId;
    return `${userId.slice(0, 6)}...${userId.slice(-6)}`;
  };

  const handleEditEntry = (log: any) => {
    setEditingEntry(log);
    setEditPainLevel(log.pain_level);
    setEditActivity(log.activity || "");
    setEditMeds(log.medications || []);
    setEditNotes(log.notes || "");
    setEditFunctionalImpact(log.functional_impact || "none");
    setEditImpactTags(log.impact_tags || []);
    setEditRxTaken(log.rx_taken || false);
    setEditSideEffects(log.side_effects || "");
    
    // Format datetime-local input value
    const date = new Date(log.logged_at);
    const timeString = date.toISOString().slice(0, 16);
    setEditTime(timeString);
    
    setEditSheetOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    const success = await updatePainLog(editingEntry.id, {
      pain_level: editPainLevel,
      activity: editActivity,
      medications: editMeds,
      notes: editNotes,
      functional_impact: editFunctionalImpact,
      impact_tags: editImpactTags,
      rx_taken: editRxTaken,
      side_effects: editSideEffects || null,
    });

    if (success) {
      setEditSheetOpen(false);
      setEditingEntry(null);
      refetchAll();
    }
  };

  const handleDeleteEntry = async (logId: string) => {
    const success = await deletePainLog(logId);
    if (success) {
      refetchAll();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Header */}
        <h1 className="text-[22px] leading-7 font-medium text-foreground">
          Track your pain
        </h1>
        
        {/* Authentication Status */}
        <p className="text-xs text-muted-foreground -mt-2">
          {user 
            ? `Signed in as ${truncateUserId(user.id)}`
            : "Not signed in — you need to sign in to save check-ins."
          }
        </p>

        {/* Unresolved Pain Card */}
        {shouldShowUnresolvedCard && (
          <div className="p-4 rounded-lg bg-card border border-border">
            <p className="text-[15px] leading-[22px] mb-3 text-foreground">
              Yesterday's pain still ongoing?
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setShowUnresolvedCard(false)}
                variant="outline"
                className="bg-transparent border-border text-muted-foreground"
              >
                Still ongoing
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="sm" className="bg-primary text-primary-foreground">
                    Resolve now
                  </Button>
                </SheetTrigger>
                <SheetContent className="p-6 bg-card border-border" aria-describedby="resolve-pain-desc">
                  <p id="resolve-pain-desc" className="sr-only">End current pain session by logging final pain level</p>
                  <SheetHeader>
                    <SheetTitle className="text-foreground">End Pain Level</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-6">
                    <div className="grid grid-cols-5 gap-x-2 gap-y-1.5">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                        <Button
                          key={level}
                          variant="outline"
                          size="sm"
                          className={`min-w-11 min-h-11 flex-col text-xs p-1 ${
                            endLevel === level ? 'border-primary' : 'border-border'
                          } bg-transparent text-foreground`}
                          onClick={() => setEndLevel(level)}
                        >
                          <span style={{ fontSize: '22px' }}>{painEmojis[level]}</span>
                          <span style={{ fontSize: '10px', lineHeight: '1' }}>{level}</span>
                        </Button>
                      ))}
                    </div>
                    <Button 
                      onClick={handleResolveSession}
                      className="w-full bg-primary text-primary-foreground"
                    >
                      Save Resolution
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        )}

        {/* Mini Sparkline Card */}
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-[18px] leading-6 font-medium text-foreground">
              Today
            </h2>
            <div className="text-right">
              {(() => {
                const latestLog = todayLogs.length > 0 ? todayLogs[todayLogs.length - 1] : lastLog;
                if (!latestLog) {
                  return (
                    <div className="text-sm font-medium text-muted-foreground">No data</div>
                  );
                }
                
                const isToday = new Date(latestLog.ts).toDateString() === new Date().toDateString();
                const timeStr = new Date(latestLog.ts).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                });
                
                return (
                  <div>
                    <div className="text-sm font-medium text-foreground">{latestLog.pain_level}/10</div>
                    <div className="text-xs text-muted-foreground">{isToday ? timeStr : 'Not today'}</div>
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="relative">
            <TodayV2Sparkline savedData={todayLogs} previewPoints={previewPoints} />
            <button 
              onClick={() => window.location.href = '/records'} 
              className="absolute bottom-1 right-2 text-sm hover:underline text-primary bg-card/80 backdrop-blur-sm px-2 py-1 rounded"
            >
              View full log →
            </button>
          </div>
        </div>

        {/* NRS-11 Emoji Grid */}
        <div className="space-y-6 py-2">
          <h2 className="text-[18px] leading-6 font-medium text-foreground">
            How's your pain right now?
          </h2>
          
          <div className="grid grid-cols-5 gap-x-2 gap-y-1.5 auto-rows-min">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <button
                key={level}
                className={`min-w-11 min-h-11 flex flex-col items-center justify-center p-1 rounded border bg-transparent transition-all text-foreground ${
                  painLevel === level 
                    ? 'ring-2 ring-offset-2 ring-offset-transparent ring-primary border-primary' 
                    : 'border-border'
                }`}
                onClick={() => handlePainLevelSelect(level)}
                aria-label={`Pain level ${level}`}
              >
                <span className="leading-none" style={{ fontSize: '22px' }}>{painEmojis[level]}</span>
                <span className="leading-none mt-0.5" style={{ fontSize: '10px', lineHeight: '1' }}>{level}</span>
              </button>
            ))}
          </div>
          
          {painLevel !== null && (
            <p className="text-center text-sm text-muted-foreground">
              {getPainLevelLabel(painLevel)}
            </p>
          )}
        </div>

        {/* Sticky Save Bar */}
        {painLevel !== null && (
          <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-card border-t border-border">
            <div className="max-w-md mx-auto space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm sm:text-base text-foreground">
                    Pain {painLevel}/10
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMedsSheetOpen(true)}
                    className="text-xs sm:text-sm text-primary"
                  >
                    + Add meds/notes
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleSaveCheckin}
                className="w-full text-sm sm:text-base px-4 sm:px-6 bg-primary text-primary-foreground"
              >
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Meds/Notes Sheet */}
        <Sheet open={medsSheetOpen} onOpenChange={setMedsSheetOpen}>
          <SheetContent className="p-6 bg-card border-border" aria-describedby="medsDesc">
            <div id="medsDesc" className="sr-only">
              Select your medications and optionally add notes.
            </div>
            <SheetHeader>
              <SheetTitle className="text-foreground">Medications & Notes</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {/* How is the pain affecting you? */}
              <div>
                <Label className="text-sm font-medium mb-3 block text-foreground">
                  How is the pain affecting you?
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "No impact", value: "none" },
                    { label: "Work", value: "work" },
                    { label: "Driving", value: "driving" },
                    { label: "Sleep", value: "sleep" },
                    { label: "Exercise", value: "exercise" },
                    { label: "Household", value: "household" },
                    { label: "Mood", value: "mood" },
                    { label: "Other", value: "other" }
                  ].map((impact) => (
                    <Button
                      key={impact.value}
                      variant="outline"
                      size="default"
                      className={`text-sm px-4 py-2 ${
                        functionalImpact === impact.value 
                          ? 'font-medium border-primary bg-primary text-primary-foreground' 
                          : 'font-normal border-border bg-transparent text-foreground'
                      }`}
                      onClick={() => setFunctionalImpact(impact.value)}
                    >
                      {impact.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Prescription medication switch */}
              <div className="flex items-center justify-between">
                <Label htmlFor="rxTaken" className="text-sm font-medium text-foreground">
                  Prescription medication taken
                </Label>
                <Switch
                  id="rxTaken"
                  checked={rxTaken}
                  onCheckedChange={(checked) => {
                    setRxTaken(checked);
                    if (!checked) {
                      // Clear medications and side effects when toggle is off
                      setSelectedMeds([]);
                      setSideEffects("");
                      setOtherMedication("");
                      setShowOtherMedInput(false);
                    }
                  }}
                />
              </div>

              {/* Conditionally show medication selection and side effects */}
              {rxTaken && (
                <>
                  <div className="pl-4">
                    <Label className="text-sm font-medium mb-3 block text-foreground">
                      Which medications?
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {medOptions.map((med) => (
                        <Button
                          key={med}
                          variant="outline"
                          size="sm"
                          className={`text-sm ${
                            selectedMeds.includes(med) 
                              ? 'font-medium border-2 border-primary bg-primary text-primary-foreground' 
                              : 'font-normal border-border bg-transparent text-foreground'
                          }`}
                          onClick={() => {
                            if (med === 'Other') {
                              setShowOtherMedInput(!showOtherMedInput);
                              if (showOtherMedInput) {
                                setSelectedMeds(prev => prev.filter(m => m !== 'Other'));
                                setOtherMedication("");
                              } else {
                                setSelectedMeds(prev => [...prev.filter(m => m !== 'Other'), 'Other']);
                              }
                            } else {
                              setSelectedMeds(prev =>
                                prev.includes(med)
                                  ? prev.filter(m => m !== med)
                                  : [...prev, med]
                              );
                            }
                          }}
                        >
                          {med}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Other medication input */}
                    {showOtherMedInput && (
                      <div className="mt-4">
                        <Label htmlFor="otherMed" className="text-sm font-medium mb-2 block text-foreground">
                          Specify other medication
                        </Label>
                        <Input
                          id="otherMed"
                          value={otherMedication}
                          onChange={(e) => setOtherMedication(e.target.value)}
                          placeholder="Enter medication name"
                          className="bg-transparent border-border text-foreground"
                        />
                      </div>
                    )}
                  </div>

                  {/* Side effects */}
                  <div className="pl-4">
                    <Label htmlFor="sideEffects" className="text-sm font-medium mb-3 block text-foreground">
                      Side effects (optional)
                    </Label>
                    <Textarea
                      id="sideEffects"
                      value={sideEffects}
                      onChange={(e) => setSideEffects(e.target.value)}
                      placeholder="Any side effects from medications or treatments?"
                      className="min-h-20 bg-transparent border-border text-foreground"
                    />
                  </div>
                </>
              )}
              
              <div>
                <Label htmlFor="notes" className="text-sm font-medium mb-3 block text-foreground">
                  Notes (optional)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How are you feeling? What might have triggered this pain?"
                  className="min-h-24 bg-transparent border-border text-foreground"
                />
              </div>

              <Button
                onClick={() => setMedsSheetOpen(false)}
                className="w-full bg-primary text-primary-foreground"
              >
                Done
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Last 3 Entries */}
        <div className="space-y-3 pb-20">
          <h2 className="text-[18px] leading-6 font-medium text-foreground">
            Recent entries
          </h2>
          {last3Logs.length === 0 ? (
            <p className="text-[15px] leading-[22px] text-muted-foreground">
              No entries today yet
            </p>
          ) : (
            last3Logs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-lg flex justify-between items-center bg-card border border-border"
              >
                <p className="text-[15px] leading-[22px] text-foreground">
                  {formatTime(log.ts)} — Pain {log.pain_level}/10 · {log.activity || '—'}
                </p>
                <div className="flex gap-2 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditEntry(log)}
                    className="p-2 h-8 w-8 text-icon-default hover:text-icon-active"
                    aria-label="Edit entry"
                  >
                    <Edit3 size={14} className="icon-default" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="p-2 h-8 w-8 text-icon-default hover:text-icon-active"
                        aria-label="Delete entry"
                      >
                        <Trash2 size={14} className="icon-default" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">Delete Entry</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                          Are you sure you want to delete this pain entry? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-border text-muted-foreground">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteEntry(log.id)}
                          className="bg-primary text-primary-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Edit Entry Sheet */}
        <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
          <SheetContent className="p-6 bg-card border-border" aria-describedby="edit-entry-desc">
            <p id="edit-entry-desc" className="sr-only">Edit pain log entry details</p>
            <SheetHeader>
              <SheetTitle className="text-foreground">Edit Entry</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {/* Pain Level */}
              <div className="py-2">
                <Label className="text-sm font-medium mb-3 block" style={{ color: '#E9E7FF' }}>
                  Pain Level
                </Label>
                <div className="grid grid-cols-6 gap-x-2 gap-y-1.5">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <button
                      key={level}
                      className={`min-w-11 min-h-11 flex flex-col items-center justify-center p-1 rounded border bg-transparent transition-all ${
                        editPainLevel === level 
                          ? 'ring-1 ring-offset-2 ring-offset-transparent ring-purple-400' 
                          : ''
                      }`}
                      style={{
                        borderColor: editPainLevel === level ? '#A78BFA' : '#232445',
                        color: '#E9E7FF'
                      }}
                      onClick={() => setEditPainLevel(level)}
                      aria-label={`Pain level ${level}`}
                    >
                      <span className="leading-none" style={{ fontSize: '22px' }}>{painEmojis[level]}</span>
                      <span className="leading-none mt-0.5" style={{ fontSize: '10px', lineHeight: '1' }}>{level}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time */}
              <div>
                <Label htmlFor="editTime" className="text-sm font-medium mb-3 block" style={{ color: '#E9E7FF' }}>
                  Time
                </Label>
                <Input
                  id="editTime"
                  type="datetime-local"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="bg-transparent border-border text-foreground [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:hue-rotate-[240deg] [&::-webkit-calendar-picker-indicator]:saturate-150 [&::-webkit-calendar-picker-indicator]:brightness-150"
                />
              </div>

              {/* Activity */}
              <div>
                <Label htmlFor="editActivity" className="text-sm font-medium mb-3 block" style={{ color: '#E9E7FF' }}>
                  Activity
                </Label>
                <Input
                  id="editActivity"
                  value={editActivity}
                  onChange={(e) => setEditActivity(e.target.value)}
                  placeholder="What were you doing?"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: '#232445',
                    color: '#E9E7FF'
                  }}
                />
              </div>

              {/* Prescription medication switch */}
              <div className="flex items-center justify-between">
                <Label htmlFor="editRxTaken" className="text-sm font-medium" style={{ color: '#E9E7FF' }}>
                  Prescription medication taken
                </Label>
                <Switch
                  id="editRxTaken"
                  checked={editRxTaken}
                  onCheckedChange={(checked) => {
                    setEditRxTaken(checked);
                    if (!checked) {
                      // Clear medications and side effects when toggle is off
                      setEditMeds([]);
                      setEditSideEffects("");
                    }
                  }}
                />
              </div>

              {/* Conditionally show medication selection and side effects */}
              {editRxTaken && (
                <>
                  <div className="pl-4">
                    <Label className="text-sm font-medium mb-3 block text-foreground">
                      Which medications?
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {medOptions.map((med) => (
                        <Button
                          key={med}
                          variant="outline"
                          size="sm"
                          className={`text-xs ${
                            editMeds.includes(med) 
                              ? 'font-medium border-primary bg-primary text-primary-foreground' 
                              : 'font-normal border-border bg-transparent text-foreground'
                          }`}
                          onClick={() => {
                            setEditMeds(prev =>
                              prev.includes(med)
                                ? prev.filter(m => m !== med)
                                : [...prev, med]
                            );
                          }}
                        >
                          {med}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Side effects */}
                  <div className="pl-4">
                    <Label htmlFor="editSideEffects" className="text-sm font-medium mb-3 block text-foreground">
                      Side effects (optional)
                    </Label>
                    <Textarea
                      id="editSideEffects"
                      value={editSideEffects}
                      onChange={(e) => setEditSideEffects(e.target.value)}
                      placeholder="Any side effects from medications or treatments?"
                      className="min-h-20 bg-transparent border-border text-foreground"
                    />
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="editNotes" className="text-sm font-medium mb-3 block text-foreground">
                  Notes
                </Label>
                <Textarea
                  id="editNotes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Additional notes..."
                  className="min-h-24 bg-transparent border-border text-foreground"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditSheetOpen(false)}
                  className="flex-1 bg-transparent border-border text-muted-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-primary text-primary-foreground"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default TodayV2;