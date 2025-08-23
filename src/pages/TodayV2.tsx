import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTodayQueries } from "@/hooks/useTodayQueries";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TodayV2Sparkline } from "@/components/TodayV2Sparkline";
import { supabase } from "@/integrations/supabase/client";

const TodayV2 = () => {
  const { user } = useAuth();
  const { todayLogs, last3Logs, activeSession, lastLog, refetchAll } = useTodayQueries();
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

  // Check if yesterday's pain is still ongoing
  const shouldShowUnresolvedCard = useMemo(() => {
    if (!lastLog || !activeSession) return false;
    const lastLogDate = new Date(lastLog.ts).toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    return lastLogDate === yesterday && showUnresolvedCard;
  }, [lastLog, activeSession, showUnresolvedCard]);

  const painEmojis = ['😊', '😊', '😐', '😐', '😟', '😟', '😣', '😫', '😰', '😱', '😭'];
  const medOptions = ['Ibuprofen', 'Acetaminophen', 'Aspirin', 'Naproxen', 'Prescribed Medication'];

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
    if (!user?.id || painLevel === null) return;

    try {
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

      // Insert pain log
      const { error: logError } = await supabase
        .from('pain_logs')
        .insert({
          user_id: user.id,
          pain_level: painLevel,
          activity: selectedActivity || null,
          medications: selectedMeds,
          notes: notes || null
        });

      if (logError) throw logError;

      // Reset state
      setPainLevel(null);
      setSelectedActivity("");
      setSelectedMeds([]);
      setPreviewPoints([]);
      setMedsSheetOpen(false);
      setNotes("");

      refetchAll();
      toast({ description: "Logged." });
    } catch (error) {
      console.error('Error saving check-in:', error);
      toast({ description: "Failed to save check-in", variant: "destructive" });
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F1020' }}>
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Header */}
        <h1 className="text-[22px] leading-7 font-medium" style={{ color: '#E9E7FF' }}>
          Today
        </h1>

        {/* Unresolved Pain Card */}
        {shouldShowUnresolvedCard && (
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#17182B', borderColor: '#232445', border: '1px solid' }}>
            <p className="text-[15px] leading-[22px] mb-3" style={{ color: '#E9E7FF' }}>
              Yesterday's pain still ongoing?
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setShowUnresolvedCard(false)}
                className="bg-transparent border" 
                style={{ borderColor: '#232445', color: '#BDB8E6' }}
              >
                Still ongoing
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="sm" style={{ backgroundColor: '#A78BFA', color: '#0F1020' }}>
                    Resolve now
                  </Button>
                </SheetTrigger>
                <SheetContent className="p-6" style={{ backgroundColor: '#17182B', borderColor: '#232445' }}>
                  <SheetHeader>
                    <SheetTitle style={{ color: '#E9E7FF' }}>End Pain Level</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-6 gap-2">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                        <Button
                          key={level}
                          variant="outline"
                          size="sm"
                          className={`min-h-11 flex-col text-xs p-1 ${
                            endLevel === level ? '' : ''
                          }`}
                          style={{
                            borderColor: endLevel === level ? '#A78BFA' : '#232445',
                            backgroundColor: 'transparent',
                            color: '#E9E7FF'
                          }}
                          onClick={() => setEndLevel(level)}
                        >
                          <span className="text-lg">{painEmojis[level]}</span>
                          <span>{level}</span>
                        </Button>
                      ))}
                    </div>
                    <Button 
                      onClick={handleResolveSession}
                      className="w-full"
                      style={{ backgroundColor: '#A78BFA', color: '#0F1020' }}
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
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#17182B', borderColor: '#232445', border: '1px solid' }}>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-[18px] leading-6 font-medium" style={{ color: '#E9E7FF' }}>
              Today
            </h2>
            <a href="/insights" className="text-sm" style={{ color: '#A78BFA' }}>
              View full log →
            </a>
          </div>
          <TodayV2Sparkline savedData={todayLogs} previewPoints={previewPoints} />
        </div>

        {/* NRS-11 Emoji Grid */}
        <div className="space-y-4">
          <h2 className="text-[18px] leading-6 font-medium" style={{ color: '#E9E7FF' }}>
            How's your pain right now?
          </h2>
          
          <div className="grid grid-cols-5 gap-x-2 gap-y-1.5 auto-rows-min">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <button
                key={level}
                className={`min-w-11 min-h-11 flex flex-col items-center justify-center p-1 rounded border bg-transparent transition-all ${
                  painLevel === level 
                    ? 'ring-2 ring-offset-2 ring-offset-transparent ring-purple-400' 
                    : ''
                }`}
                style={{
                  borderColor: painLevel === level ? '#A78BFA' : '#232445',
                  color: '#E9E7FF'
                }}
                onClick={() => handlePainLevelSelect(level)}
                aria-label={`Pain level ${level}`}
              >
                <span className="leading-none" style={{ fontSize: '22px' }}>{painEmojis[level]}</span>
                <span className="leading-none mt-0.5" style={{ fontSize: '10px', lineHeight: '1' }}>{level}</span>
              </button>
            ))}
          </div>
          
          {painLevel !== null && (
            <p className="text-center text-sm" style={{ color: '#BDB8E6' }}>
              {getPainLevelLabel(painLevel)}
            </p>
          )}
        </div>

        {/* Sticky Save Bar */}
        {painLevel !== null && (
          <div className="fixed bottom-0 left-0 right-0 p-4" style={{ backgroundColor: '#17182B', borderTop: '1px solid #232445' }}>
            <div className="max-w-md mx-auto flex justify-between items-center">
              <div>
                <p className="font-medium" style={{ color: '#E9E7FF' }}>
                  Pain {painLevel}/10
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMedsSheetOpen(true)}
                  style={{ color: '#A78BFA' }}
                >
                  + Add meds/notes
                </Button>
                <Button
                  onClick={handleSaveCheckin}
                  style={{ backgroundColor: '#A78BFA', color: '#0F1020' }}
                >
                  Save check-in
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Meds/Notes Sheet */}
        <Sheet open={medsSheetOpen} onOpenChange={setMedsSheetOpen}>
          <SheetContent className="p-6" style={{ backgroundColor: '#17182B', borderColor: '#232445' }} aria-describedby="medsDesc">
            <div id="medsDesc" className="sr-only">
              Select your medications and optionally add notes.
            </div>
            <SheetHeader>
              <SheetTitle style={{ color: '#E9E7FF' }}>Medications & Notes</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div>
                <Label className="text-sm font-medium mb-3 block" style={{ color: '#E9E7FF' }}>
                  Medications taken
                </Label>
                <div className="flex flex-wrap gap-2">
                  {medOptions.map((med) => (
                    <Button
                      key={med}
                      variant="outline"
                      size="sm"
                      className={`text-xs ${
                        selectedMeds.includes(med) ? 'border-2' : ''
                      }`}
                      style={{
                        borderColor: selectedMeds.includes(med) ? '#A78BFA' : '#232445',
                        backgroundColor: selectedMeds.includes(med) ? '#A78BFA' : 'transparent',
                        color: selectedMeds.includes(med) ? '#0F1020' : '#E9E7FF'
                      }}
                      onClick={() => {
                        setSelectedMeds(prev =>
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
              
              <div>
                <Label htmlFor="notes" className="text-sm font-medium mb-3 block" style={{ color: '#E9E7FF' }}>
                  Notes (optional)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How are you feeling? What might have triggered this pain?"
                  className="min-h-24"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: '#232445',
                    color: '#E9E7FF'
                  }}
                />
              </div>

              <Button
                onClick={() => setMedsSheetOpen(false)}
                className="w-full"
                style={{ backgroundColor: '#A78BFA', color: '#0F1020' }}
              >
                Done
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Last 3 Entries */}
        <div className="space-y-3 pb-20">
          <h2 className="text-[18px] leading-6 font-medium" style={{ color: '#E9E7FF' }}>
            Recent entries
          </h2>
          {last3Logs.length === 0 ? (
            <p className="text-[15px] leading-[22px]" style={{ color: '#BDB8E6' }}>
              No entries today yet
            </p>
          ) : (
            last3Logs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-lg"
                style={{ backgroundColor: '#17182B', borderColor: '#232445', border: '1px solid' }}
              >
                <p className="text-[15px] leading-[22px]" style={{ color: '#E9E7FF' }}>
                  {formatTime(log.ts)} — Pain {log.pain_level}/10 · {log.activity || '—'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TodayV2;