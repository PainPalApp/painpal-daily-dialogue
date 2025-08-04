import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Clock, Edit, BarChart3, TrendingUp } from "lucide-react";
import { SimplePainChat } from "@/components/SimplePainChat";
import { PainChart } from "@/components/PainChart";
import { usePainLogs } from "@/hooks/usePainLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


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



interface TodaySectionProps {
  onNavigateToInsights?: () => void;
}

export function TodaySection({ onNavigateToInsights }: TodaySectionProps) {
  const { getPainLogs } = usePainLogs();
  const [painData, setPainData] = useState<any[]>([]);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  // Transform Supabase data to PainEntry format for chart
  const transformForChart = (supabaseData: any[]) => {
    return supabaseData.map((entry) => ({
      id: entry.id,
      date: entry.logged_at.split('T')[0],
      timestamp: entry.logged_at,
      painLevel: entry.pain_level,
      location: entry.pain_locations || [],
      triggers: entry.triggers || [],
      medications: entry.medications || [],
      notes: entry.notes || '',
      symptoms: [],
      status: 'active'
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const logs = await getPainLogs();
        const transformed = transformForChart(logs);
        setPainData(transformed);
        
        // Get last 3 entries for display
        const recent = logs
          .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
          .slice(0, 3);
        setRecentEntries(recent);
      } catch (error) {
        console.error('Error loading pain data:', error);
      }
    };

    loadData();
  }, [getPainLogs]);

  const handlePainDataSaved = (painData: any) => {
    // Refresh data when new pain entry is saved
    const loadData = async () => {
      try {
        const logs = await getPainLogs();
        const transformed = transformForChart(logs);
        setPainData(transformed);
        
        const recent = logs
          .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
          .slice(0, 3);
        setRecentEntries(recent);
      } catch (error) {
        console.error('Error loading pain data:', error);
      }
    };
    loadData();
  };

  const handleNavigationRequest = (destination: string) => {
    if (destination === 'insights' && onNavigateToInsights) {
      onNavigateToInsights();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 bg-background flex flex-col h-full">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Header Card */}
        
        
        {/* Pain Chart with Recent Entries */}
        <div className="mx-4 sm:mx-6 lg:mx-8 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Today's Pain Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-4">
                <PainChart 
                  painData={painData}
                  viewMode="today"
                  isCompact={false}
                />
              </div>
              
              {/* Recent Entries */}
              {recentEntries.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent Entries</h4>
                  <div className="space-y-2">
                    {recentEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{formatTime(entry.logged_at)}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Pain: {entry.pain_level}/10</span>
                          {entry.pain_locations && entry.pain_locations.length > 0 && (
                            <span className="text-muted-foreground">
                              • {entry.pain_locations.slice(0, 2).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Simplified Chat Interface */}
        <div className="flex-1 flex flex-col mx-4 sm:mx-6 lg:mx-8 mb-6">
          <div className="card-clean flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border bg-card/50">
              <h3 className="text-lg font-semibold text-foreground">Track Your Pain</h3>
              <p className="text-sm text-muted-foreground">Chat naturally or tap the easy buttons to log your symptoms</p>
            </div>
            <SimplePainChat 
              onPainDataSaved={handlePainDataSaved}
              onNavigateToInsights={() => handleNavigationRequest('insights')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}