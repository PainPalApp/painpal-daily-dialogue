import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Clock, Edit, BarChart3, TrendingUp } from "lucide-react";
import { SmartChat } from "@/components/SmartChat";
import { PainEntryEditor } from "@/components/PainEntryEditor";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

// Data structure for pain entries
const createPainEntry = (data: any = {}) => ({
  id: Date.now(),
  date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  timestamp: new Date().toISOString(),
  painLevel: data.painLevel || null,
  location: data.location || [],
  triggers: data.triggers || [],
  medications: data.medications || [],
  notes: data.notes || '',
  symptoms: data.symptoms || [],
  status: 'active'
});

// Save pain data to localStorage - Always create new entries for pain level changes
const savePainData = (extractedData: any) => {
  const existingData = JSON.parse(localStorage.getItem('painTrackingData') || '[]');
  
  // Always create a new entry for each pain update to track multiple levels per day
  const newEntry = createPainEntry(extractedData);
  existingData.push(newEntry);
  
  localStorage.setItem('painTrackingData', JSON.stringify(existingData));
  
  // Trigger insights update
  const event = new CustomEvent('painDataUpdated', { detail: existingData });
  window.dispatchEvent(event);
  
  return existingData;
};

// Extract pain data from chat messages - focus on latest message
const extractPainDataFromMessages = (messages: Message[]) => {
  const userMessages = messages.filter(msg => msg.sender === 'user');
  if (userMessages.length === 0) return null;
  
  // Focus on the most recent user message for pain level
  const latestMessage = userMessages[userMessages.length - 1].content?.toLowerCase() || '';
  const allText = userMessages.map(msg => msg.content || '').join(' ').toLowerCase();
  
  const painData = {
    painLevel: null as number | null,
    location: [] as string[],
    triggers: [] as string[],
    medications: [] as any[],
    notes: userMessages[userMessages.length - 1].content || '',
    symptoms: [] as string[]
  };
  
  // Extract pain level from latest message (look for numbers 0-10)
  const painMatch = latestMessage.match(/\b([0-9]|10)\b/);
  if (painMatch) {
    painData.painLevel = parseInt(painMatch[0]);
  }
  
  // Extract locations
  if (allText.includes('forehead')) painData.location.push('forehead');
  if (allText.includes('temples')) painData.location.push('temples');
  if (allText.includes('behind') && allText.includes('eyes')) painData.location.push('behind eyes');
  if (allText.includes('back of head')) painData.location.push('back of head');
  if (allText.includes('neck')) painData.location.push('neck');
  if (allText.includes('whole head')) painData.location.push('whole head');
  
  // Extract triggers
  if (allText.includes('stress')) painData.triggers.push('stress');
  if (allText.includes('sleep') || allText.includes('tired')) painData.triggers.push('poor sleep');
  if (allText.includes('dehydrat')) painData.triggers.push('dehydration');
  if (allText.includes('bright light')) painData.triggers.push('bright lights');
  if (allText.includes('screen')) painData.triggers.push('screen time');
  if (allText.includes('food') || allText.includes('skipped meal')) painData.triggers.push('diet');
  if (allText.includes('weather')) painData.triggers.push('weather');
  if (allText.includes('hormone')) painData.triggers.push('hormones');
  
  // Extract medications
  if (allText.includes('ibuprofen') || allText.includes('advil')) {
    painData.medications.push({
      name: 'ibuprofen',
      effective: !allText.includes('still') && !allText.includes('not helping')
    });
  }
  if (allText.includes('tylenol') || allText.includes('acetaminophen')) {
    painData.medications.push({
      name: 'tylenol',
      effective: !allText.includes('still') && !allText.includes('not helping')
    });
  }
  if (allText.includes('aspirin')) {
    painData.medications.push({
      name: 'aspirin',
      effective: !allText.includes('still') && !allText.includes('not helping')
    });
  }
  
  // Extract symptoms
  if (allText.includes('nausea')) painData.symptoms.push('nausea');
  if (allText.includes('dizzy')) painData.symptoms.push('dizziness');
  if (allText.includes('sensitive') && allText.includes('light')) painData.symptoms.push('light sensitivity');
  if (allText.includes('sensitive') && allText.includes('sound')) painData.symptoms.push('sound sensitivity');
  
  return painData;
};

// Get pain history for reports/insights
const getPainHistory = (days = 30) => {
  const data = JSON.parse(localStorage.getItem('painTrackingData') || '[]');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return data.filter((entry: any) => new Date(entry.date) >= cutoffDate);
};

// Debug function to check stored data
const debugPainData = () => {
  const data = JSON.parse(localStorage.getItem('painTrackingData') || '[]');
  console.log('Current pain tracking data:', data);
  return data;
};

// Add to window for testing
declare global {
  interface Window {
    debugPainData: () => any;
    clearPainData: () => void;
  }
}

window.debugPainData = debugPainData;
window.clearPainData = () => {
  localStorage.removeItem('painTrackingData');
  window.dispatchEvent(new CustomEvent('painDataUpdated'));
  console.log('Pain data cleared');
};

const generateSmartResponse = (userMessage: string, conversationHistory: string[] = []): string => {
  const msg = userMessage.toLowerCase().trim();
  const previousMessages = conversationHistory.join(' ').toLowerCase();
  
  // CONTEXTUAL PAIN LEVEL SUGGESTIONS
  // Suggest specific pain levels based on severity words
  if (msg.includes('horrible') || msg.includes('excruciating') || msg.includes('worst')) {
    return "That sounds like severe pain - probably around 8 or 9 out of 10. Does that sound right? Just say the number.";
  }
  
  if (msg.includes('killing me') || msg.includes('unbearable')) {
    return "That sounds extremely painful - likely a 9 or 10. What number would you give it?";
  }
  
  if (msg.includes('awful') || msg.includes('terrible')) {
    return "That sounds quite severe - maybe a 7 or 8? What number feels right to you?";
  }
  
  if (msg.includes('moderate') || msg.includes('annoying') || msg.includes('bothersome')) {
    return "Sounds like moderate pain - perhaps around 4-6? What number would you say?";
  }
  
  if (msg.includes('slight') || msg.includes('minor') || msg.includes('little bit')) {
    return "Even mild pain is worth tracking. Maybe around 2-3? What number feels right?";
  }
  
  // SMART TIMING RECOGNITION
  // Don't ask "when did it start" if timing already mentioned
  if (msg.match(/(\d+)\s*(hour|minute|day)s?\s*ago/) || 
      msg.includes('this morning') || msg.includes('last night') || 
      msg.includes('started') || msg.includes('woke me up')) {
    
    if (!previousMessages.includes('trigger')) {
      return "Thanks for the timing info. Have you noticed what might have triggered this? Stress, lack of sleep, dehydration, bright lights?";
    } else {
      return "Got it. How are you managing the pain right now?";
    }
  }
  
  // MEDICATION INTELLIGENCE
  // If they say medication isn't helping, don't ask if it helped
  if ((msg.includes('took') || msg.includes('had')) && 
      (msg.includes('but') || msg.includes('still') || msg.includes("doesn't") || msg.includes("not helping"))) {
    return "I'll note that the medication isn't providing relief. Do you have other medications your doctor has prescribed for situations like this?";
  }
  
  // If medication mentioned without "but still hurts"
  if (msg.includes('took') || msg.includes('medication') || msg.includes('advil') || msg.includes('tylenol') || msg.includes('ibuprofen')) {
    return "Good to know about the medication. Has it started to help reduce the pain?";
  }
  
  // PAIN LEVEL NUMBER RESPONSES
  if (msg.match(/\b([7-9]|10)\b/)) {
    const painLevel = msg.match(/\b([7-9]|10)\b/)![0];
    return `Pain level ${painLevel}/10 - that's quite severe. When did this level of pain start? Was it sudden or gradual?`;
  }
  
  if (msg.match(/\b([4-6])\b/)) {
    const painLevel = msg.match(/\b([4-6])\b/)![0];
    return `${painLevel}/10 - moderate pain that's definitely impacting your day. How long has it been at this level?`;
  }
  
  if (msg.match(/\b([1-3])\b/)) {
    const painLevel = msg.match(/\b([1-3])\b/)![0];
    return `${painLevel}/10 - thankful it's on the milder side. Is this typical for you or unusual?`;
  }
  
  // TRIGGER RESPONSES
  if (msg.includes('stress') || msg.includes('work') || msg.includes('anxiety')) {
    return "Stress is a common trigger. I'll note that. Are you able to do any relaxation techniques right now, or do you need to focus on the pain first?";
  }
  
  if (msg.includes('sleep') || msg.includes('tired') || msg.includes('insomnia')) {
    return "Poor sleep often triggers headaches. How many hours did you get last night? Rest might help if you can manage it.";
  }
  
  if (msg.includes('dehydrated') || msg.includes('water') || msg.includes('thirsty')) {
    return "Dehydration is a big trigger. If you can, try sipping some water slowly. Sometimes that helps more than we expect.";
  }
  
  // RELIEF AND POSITIVE RESPONSES
  if (msg.includes('better') || msg.includes('improving') || msg.includes('helping')) {
    return "That's great to hear! Are you doing anything specific that seems to be helping? Worth noting for future episodes.";
  }
  
  if (msg.includes('fine') || msg.includes('good') || msg.includes('no pain')) {
    return "Wonderful! It's just as important to track pain-free days. They help us see patterns and what's working well.";
  }
  
  // HEADACHE/MIGRAINE INITIAL RESPONSE
  if (msg.includes('headache') || msg.includes('migraine')) {
    return "I'm sorry you're dealing with head pain. Can you describe the intensity? Use words like mild, moderate, severe, or give me a number 0-10?";
  }
  
  // ENHANCED DEFAULT RESPONSES
  const contextualDefaults = [
    "I want to make sure I capture this properly. Can you tell me more about the pain you're experiencing?",
    "Every detail helps create a better picture. What else is important for me to know?",
    "Thank you for sharing that. How would you describe what you're feeling right now?"
  ];
  
  return contextualDefaults[Math.floor(Math.random() * contextualDefaults.length)];
};


const TodaysPainCard = ({ onViewInsights }: { onViewInsights: () => void }) => {
  const [painHistory, setPainHistory] = useState([]);

  const loadPainData = () => {
    const storedData = JSON.parse(localStorage.getItem('painTrackingData') || '[]');
    setPainHistory(storedData);
  };

  useEffect(() => {
    loadPainData();
    
    const handleDataUpdate = () => {
      loadPainData();
    };
    
    window.addEventListener('painDataUpdated', handleDataUpdate);
    return () => window.removeEventListener('painDataUpdated', handleDataUpdate);
  }, []);

  // Get today's data
  const getTodayData = () => {
    const today = new Date().toISOString().split('T')[0];
    return painHistory
      .filter((e: any) => e.date === today)
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const todayEntries = getTodayData();
  const painLevels = todayEntries.filter((e: any) => e.painLevel && e.painLevel > 0).map((e: any) => e.painLevel);
  const currentPain = painLevels.length > 0 ? painLevels[painLevels.length - 1] : 0;
  const earliestEntry = todayEntries.length > 0 ? todayEntries[0] : null;
  
  return (
    <div className="bg-card rounded-lg border p-4 mb-6 mx-4 sm:mx-6 lg:mx-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Today's Overview</h3>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onViewInsights}
            className="text-xs"
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            View Analytics
          </Button>
          {currentPain > 0 && (
            <span className="text-2xl font-bold text-foreground">{currentPain}/10</span>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">
            {painLevels.length > 0 
              ? `${painLevels.length} pain ${painLevels.length === 1 ? 'entry' : 'entries'} today`
              : 'No pain entries today'
            }
          </span>
        </div>
        
        {earliestEntry && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              Tracking since {new Date(earliestEntry.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}
        
        {/* Simplified progress bar for current pain */}
        {currentPain > 0 && (
          <div className="relative">
            <div className="h-2 bg-muted rounded-full"></div>
            <div 
              className="absolute top-0 h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full transition-all duration-500"
              style={{ width: `${(currentPain / 10) * 100}%` }}
            />
          </div>
        )}
        
        {painLevels.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Start a conversation below to begin tracking your pain today.
          </div>
        )}
      </div>
    </div>
  );
};

interface TodaySectionProps {
  onNavigateToInsights?: () => void;
}

export function TodaySection({ onNavigateToInsights }: TodaySectionProps) {
  const [painData, setPainData] = useState([]);

  // Load initial pain data and listen for updates
  useEffect(() => {
    const loadPainData = () => {
      const storedData = JSON.parse(localStorage.getItem('painTrackingData') || '[]');
      setPainData(storedData);
    };

    loadPainData();
    
    const handleDataUpdate = () => {
      loadPainData();
    };
    
    window.addEventListener('painDataUpdated', handleDataUpdate);
    return () => window.removeEventListener('painDataUpdated', handleDataUpdate);
  }, []);

  const handlePainDataExtracted = (extractedData: any) => {
    if (extractedData && extractedData.painLevel !== null) {
      const existingData = JSON.parse(localStorage.getItem('painTrackingData') || '[]');
      const today = new Date().toISOString().split('T')[0];
      const todayEntries = existingData.filter((entry: any) => entry.date === today);
      
      // Check if this is a new pain level (different from the last entry)
      const lastPainLevel = todayEntries.length > 0 ? todayEntries[todayEntries.length - 1].painLevel : null;
      
      if (lastPainLevel !== extractedData.painLevel) {
        savePainData(extractedData);
        console.log('Pain data saved:', extractedData);
      }
    }
  };

  const handleNavigationRequest = (destination: string) => {
    if (destination === 'insights' && onNavigateToInsights) {
      onNavigateToInsights();
    }
  };

  return (
    <div className="flex-1 bg-background flex flex-col h-full">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Today's Pain Overview Card */}
        <TodaysPainCard onViewInsights={() => handleNavigationRequest('insights')} />
        
        {/* Pain Entry Editor - Quick Entry */}
        <div className="px-4 sm:px-6 lg:px-8 mb-6">
          <PainEntryEditor 
            entries={JSON.parse(localStorage.getItem('painTrackingData') || '[]')} 
            onUpdate={(entries) => {
              // Update will be handled by the component itself
            }} 
          />
        </div>

        {/* Smart Chat Interface */}
        <div className="flex-1 flex flex-col mx-4 sm:mx-6 lg:mx-8 mb-6">
          <div className="bg-card rounded-lg border flex-1 flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Your AI Pain Companion</h3>
              <p className="text-sm text-muted-foreground">Chat or speak to track your symptoms and get personalized insights</p>
            </div>
            <SmartChat 
              onPainDataExtracted={handlePainDataExtracted}
              onNavigationRequest={handleNavigationRequest}
            />
          </div>
        </div>
      </div>
    </div>
  );
}