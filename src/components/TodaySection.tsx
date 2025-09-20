import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Clock, Edit, BarChart3, TrendingUp } from "lucide-react";
import { PainEntryForm } from "@/components/PainEntryForm";
import { PainChart } from "@/components/PainChart";
import { usePainLogs } from "@/hooks/usePainLogs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
  const { user } = useAuth();
  const [painData, setPainData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('today');
  const [lastPainLevel, setLastPainLevel] = useState<number | null>(null);
  const [lastEntryInfo, setLastEntryInfo] = useState<string | null>(null);
  const [userGreeting, setUserGreeting] = useState<string>('');

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
    loadData();
    loadUserLifecycleInfo();
  }, [getPainLogs]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('pain_logs_today')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pain_logs'
        },
        () => {
          loadData();
          loadUserLifecycleInfo();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    try {
      const logs = await getPainLogs();
      const transformed = transformForChart(logs);
      setPainData(transformed);
    } catch (error) {
      console.error('Error loading pain data:', error);
    }
  };

  const loadUserLifecycleInfo = async () => {
    if (!user) return;
    
    try {
      // Get user's display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      const userName = profile?.display_name || 'there';
      
      // Get current time for greeting
      const hour = new Date().getHours();
      let timeGreeting = 'Good morning';
      if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
      else if (hour >= 17) timeGreeting = 'Good evening';

      // Get today's entries
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = await getPainLogs(today, today);
      
      if (todayLogs.length === 0) {
        // First visit of the day - get yesterday's summary
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const yesterdayLogs = await getPainLogs(yesterdayStr, yesterdayStr);
        
        if (yesterdayLogs.length > 0) {
          const painLevels = yesterdayLogs.map(log => log.pain_level).filter(Boolean);
          const maxPain = Math.max(...painLevels);
          const minPain = Math.min(...painLevels);
          
          setUserGreeting(`${timeGreeting}, ${userName}! Yesterday your pain ranged from ${minPain} to ${maxPain}. Keep tracking your pain and strategies to help us analyze your patterns and improve your quality of life.`);
        } else {
          setUserGreeting(`${timeGreeting}, ${userName}! Ready to start tracking your pain today?`);
        }
      } else {
        // Return visit - show last entry info
        const sortedEntries = todayLogs.sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
        const lastEntry = sortedEntries[0];
        const lastEntryTime = new Date(lastEntry.logged_at);
        const hoursAgo = Math.floor((Date.now() - lastEntryTime.getTime()) / (1000 * 60 * 60));
        const minutesAgo = Math.floor((Date.now() - lastEntryTime.getTime()) / (1000 * 60));
        
        let timeAgoText = '';
        if (hoursAgo > 0) {
          timeAgoText = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
        } else {
          timeAgoText = `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`;
        }
        
        setLastPainLevel(lastEntry.pain_level);
        setLastEntryInfo(`Last entry: ${timeAgoText} - Pain Level ${lastEntry.pain_level}`);
        
        // Evening check for journal prompt
        if (hour >= 18 && sortedEntries.some(entry => entry.pain_level >= lastEntry.pain_level)) {
          setUserGreeting(`${timeGreeting}, ${userName}! Your pain hasn't decreased much today. Consider adding a journal entry about what happened today.`);
        } else {
          setUserGreeting(`${timeGreeting}, ${userName}!`);
        }
      }
    } catch (error) {
      console.error('Error loading user lifecycle info:', error);
      setUserGreeting('Welcome back!');
    }
  };

  const handlePainDataSaved = (painData: any) => {
    loadData();
    loadUserLifecycleInfo();
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
    <div className="flex-1 bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Track</h1>
        </div>

        {/* User Greeting */}
        {userGreeting && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <p className="text-sm text-foreground">{userGreeting}</p>
              {lastEntryInfo && (
                <p className="text-xs text-muted-foreground mt-2">{lastEntryInfo}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pain Chart with Time Period Toggle */}
        <Card>
          <CardHeader>
            <CardTitle>Pain Levels Over Time</CardTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="lila-tab-container w-full p-1 bg-transparent">
                <TabsTrigger value="today" className="lila-tab data-[state=active]:lila-tab-active flex-1">Today</TabsTrigger>
                <TabsTrigger value="week" className="lila-tab data-[state=active]:lila-tab-active flex-1">This Week</TabsTrigger>
                <TabsTrigger value="month" className="lila-tab data-[state=active]:lila-tab-active flex-1">This Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <PainChart 
                painData={painData}
                viewMode={activeTab as 'today' | 'week' | 'month'}
                isCompact={false}
              />
            </div>
            <div className="flex justify-end mt-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onNavigateToInsights}
                className="text-muted-foreground hover:text-foreground"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View Tracking Log →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pain Entry Form */}
        <PainEntryForm 
          onPainDataSaved={handlePainDataSaved} 
          defaultPainLevel={lastPainLevel}
        />
      </div>
    </div>
  );
}