import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Mic, MicOff } from "lucide-react";
import { usePainLogs } from "@/hooks/usePainLogs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PainEntryFormProps {
  onPainDataSaved?: (data: any) => void;
  defaultPainLevel?: number | null;
}

interface UserProfile {
  current_medications?: any;
  diagnosis?: string;
}

const painLevels = [
  { level: 0, description: "NO PAIN", color: "bg-green-500", emoji: "😊" },
  { level: 1, description: "VERY MILD", color: "bg-green-400", emoji: "🙂" },
  { level: 2, description: "MILD", color: "bg-green-300", emoji: "🙂" },
  { level: 3, description: "MILD", color: "bg-yellow-400", emoji: "😐" },
  { level: 4, description: "MODERATE", color: "bg-yellow-500", emoji: "😐" },
  { level: 5, description: "MODERATE", color: "bg-orange-400", emoji: "😕" },
  { level: 6, description: "MODERATE", color: "bg-orange-500", emoji: "😕" },
  { level: 7, description: "SEVERE", color: "bg-red-400", emoji: "😣" },
  { level: 8, description: "SEVERE", color: "bg-red-500", emoji: "😣" },
  { level: 9, description: "VERY SEVERE", color: "bg-red-600", emoji: "😢" },
  { level: 10, description: "WORST POSSIBLE", color: "bg-red-700", emoji: "😢" },
];

const getCommonStrategies = (diagnosis?: string) => {
  const baseStrategies = [
    "Rest", "Ice", "Heat", "Gentle movement", "Deep breathing",
    "Meditation", "Distraction", "Position change"
  ];
  
  // Add diagnosis-specific strategies
  const diagnosisStrategies: Record<string, string[]> = {
    'migraine': ["Dark room", "Avoid triggers", "Neck massage"],
    'arthritis': ["Gentle exercise", "Anti-inflammatory", "Joint support"],
    'back pain': ["Stretching", "Posture check", "Support pillow"],
    'fibromyalgia': ["Warm bath", "Gentle yoga", "Sleep routine"]
  };
  
  const specific = diagnosis ? diagnosisStrategies[diagnosis.toLowerCase()] || [] : [];
  return [...baseStrategies, ...specific];
};

export function PainEntryForm({ onPainDataSaved, defaultPainLevel }: PainEntryFormProps) {
  const [selectedPainLevel, setSelectedPainLevel] = useState<number | null>(defaultPainLevel || null);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const [journalEntry, setJournalEntry] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [newStrategy, setNewStrategy] = useState("");
  const [newMedication, setNewMedication] = useState("");
  
  const { savePainLog } = usePainLogs();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('current_medications, diagnosis')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const commonStrategies = getCommonStrategies(userProfile.diagnosis);

  const toggleStrategy = (strategy: string) => {
    setSelectedStrategies(prev => 
      prev.includes(strategy) 
        ? prev.filter(s => s !== strategy)
        : [...prev, strategy]
    );
  };

  const toggleMedication = (medication: string) => {
    setSelectedMedications(prev => 
      prev.includes(medication) 
        ? prev.filter(m => m !== medication)
        : [...prev, medication]
    );
  };

  const addNewStrategy = () => {
    if (newStrategy.trim() && !selectedStrategies.includes(newStrategy.trim())) {
      setSelectedStrategies(prev => [...prev, newStrategy.trim()]);
      setNewStrategy("");
    }
  };

  const addNewMedication = () => {
    if (newMedication.trim() && !selectedMedications.includes(newMedication.trim())) {
      setSelectedMedications(prev => [...prev, newMedication.trim()]);
      setNewMedication("");
    }
  };

  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setJournalEntry(prev => prev + (prev ? ' ' : '') + transcript);
      };

      recognition.start();
    }
  };

  const handleSubmit = async () => {
    if (selectedPainLevel === null) {
      toast({
        title: "Pain level required",
        description: "Please select your current pain level",
        variant: "destructive"
      });
      return;
    }

    const painData = {
      pain_level: selectedPainLevel,
      pain_locations: [], // Keep for compatibility
      pain_strategies: selectedStrategies,
      medications: selectedMedications,
      journal_entry: journalEntry || undefined,
      notes: "", // Keep for compatibility
      triggers: [], // Keep for compatibility
    };

    const success = await savePainLog(painData);
    
    if (success) {
      toast({
        title: "Pain entry saved",
        description: "Your pain level and management strategies have been recorded"
      });
      
      // Reset form
      setSelectedPainLevel(null);
      setSelectedStrategies([]);
      setSelectedMedications([]);
      setJournalEntry("");
      
      onPainDataSaved?.(painData);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">How is your pain today?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pain Level Selector */}
        <div className="space-y-3">
          <div className="grid grid-cols-6 sm:grid-cols-11 gap-2">
            {painLevels.map((pain) => (
              <button
                key={pain.level}
                onClick={() => setSelectedPainLevel(pain.level)}
                className={`
                  relative p-2 rounded-lg border-2 transition-all duration-200
                  ${selectedPainLevel === pain.level 
                    ? 'border-foreground scale-105 shadow-lg' 
                    : 'border-border hover:border-muted-foreground hover:scale-102'
                  }
                  ${pain.color} text-white font-semibold
                  min-h-[60px] flex flex-col items-center justify-center
                  hover:shadow-md active:scale-95
                `}
              >
                <div className="text-lg mb-1">{pain.emoji}</div>
                <div className="text-sm font-bold">{pain.level}</div>
              </button>
            ))}
          </div>
          
          {selectedPainLevel !== null && (
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="font-semibold">Pain Level {selectedPainLevel}/10</div>
              <div className="text-sm text-muted-foreground">
                {painLevels[selectedPainLevel].description}
              </div>
            </div>
          )}
        </div>

        {/* Pain Management Strategies */}
        <div className="space-y-3">
          <h3 className="font-semibold">What are you doing for your pain? (Optional)</h3>
          
            <div className="flex flex-wrap gap-2">
            {commonStrategies.map((strategy) => (
              <button
                key={strategy}
                onClick={() => toggleStrategy(strategy)}
                className={`chat-suggestion-pill transition-colors ${
                  selectedStrategies.includes(strategy)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : ''
                }`}
              >
                {strategy}
              </button>
            ))}
          </div>

          {/* Add new strategy */}
          <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom strategy..."
                value={newStrategy}
                onChange={(e) => setNewStrategy(e.target.value)}
                className="chat-suggestion-pill bg-background text-foreground border-border flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addNewStrategy()}
              />
            <Button size="sm" onClick={addNewStrategy} disabled={!newStrategy.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Medications */}
        {userProfile.current_medications && userProfile.current_medications.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Medications taken:</h3>
            
            <div className="flex flex-wrap gap-2">
              {userProfile.current_medications.map((med) => (
                <button
                  key={med.name}
                  onClick={() => toggleMedication(med.name)}
                  className={`chat-suggestion-pill transition-colors ${
                    selectedMedications.includes(med.name)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : ''
                  }`}
                >
                  {med.name} {med.dosage && `(${med.dosage})`}
                </button>
              ))}
            </div>

            {/* Add new medication */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add other medication..."
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                className="chat-suggestion-pill bg-background text-foreground border-border flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addNewMedication()}
              />
              <Button size="sm" onClick={addNewMedication} disabled={!newMedication.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Journal Entry */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Journal about your pain (Optional)</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={startVoiceInput}
              disabled={isListening}
            >
              {isListening ? (
                <MicOff className="h-4 w-4 text-red-500" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <Textarea
            placeholder="Write about your pain experience, what might have triggered it, how you're feeling..."
            value={journalEntry}
            onChange={(e) => setJournalEntry(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={selectedPainLevel === null}
          className="w-full"
          size="lg"
        >
          Record Pain Entry
        </Button>
      </CardContent>
    </Card>
  );
}