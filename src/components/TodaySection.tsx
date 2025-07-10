import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Clock, Edit } from "lucide-react";
import { PainChart } from "@/components/PainChart";
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


const MiniInsightsCard = () => {
  const [painHistory, setPainHistory] = useState([]);
  const [isCompact, setIsCompact] = useState(false);

  // SIMPLIFIED scroll behavior - no sticky positioning
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY > 150;
          setIsCompact(scrolled);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadPainData = () => {
    const storedData = JSON.parse(localStorage.getItem('painTrackingData') || '[]');
    setPainHistory(storedData);
  };

  useEffect(() => {
    loadPainData();
    
    const handleDataUpdate = () => {
      console.log('Pain data updated, refreshing insights...');
      loadPainData();
    };
    
    window.addEventListener('painDataUpdated', handleDataUpdate);
    return () => window.removeEventListener('painDataUpdated', handleDataUpdate);
  }, []);

  // Get today's data - sorted by timestamp to show progression
  const getTodayData = () => {
    const today = new Date().toISOString().split('T')[0];
    return painHistory
      .filter((e: any) => e.date === today)
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const todayEntries = getTodayData();
  const painLevels = todayEntries.filter((e: any) => e.painLevel && e.painLevel > 0).map((e: any) => e.painLevel);
  const currentPain = painLevels.length > 0 ? painLevels[painLevels.length - 1] : 0;
  const firstPain = painLevels.length > 0 ? painLevels[0] : 0;
  const earliestEntry = todayEntries.length > 0 ? todayEntries[0] : null;
  
  // No data state
  if (painHistory.length === 0 || todayEntries.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 mb-6 mx-4 sm:mx-6 lg:mx-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Today's Pain</h3>
          <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">
            Start Tracking
          </button>
        </div>
        <div className="text-slate-400 text-sm">
          No pain data tracked today. Start a conversation to begin tracking.
        </div>
      </div>
    );
  }

  // Create progress bar data
  const progressData = painLevels.map((level, index) => ({
    level,
    position: (index / Math.max(painLevels.length - 1, 1)) * 100
  }));

  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-6 mx-4 sm:mx-6 lg:mx-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Today's Pain</h3>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md">
            Stop Tracking
          </button>
          <span className="text-2xl font-bold text-white">{currentPain}/10</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-slate-400" />
          <span className="text-white">{painLevels.length} pain {painLevels.length === 1 ? 'entry' : 'entries'} today</span>
        </div>
        
        {earliestEntry && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-slate-300">
              Tracking since {new Date(earliestEntry.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}
        
        {painLevels.length > 1 && (
          <div className="text-sm text-slate-300">
            Pain levels: {firstPain} → {currentPain}
          </div>
        )}
        
        {/* Progress Bar */}
        <div className="relative">
          <div className="h-2 bg-gradient-to-r from-green-500 via-yellow-500 via-orange-500 to-red-500 rounded-full opacity-30"></div>
          <div className="absolute top-0 h-2 rounded-full overflow-hidden">
            {progressData.map((point, index) => (
              <div
                key={index}
                className="absolute w-3 h-3 bg-white rounded-full border-2 border-slate-800 transform -translate-y-0.5"
                style={{ 
                  left: `${point.position}%`,
                  transform: 'translateX(-50%) translateY(-25%)'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export function TodaySection() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Good afternoon! How are you feeling today? 😊',
      sender: 'ai',
      timestamp: new Date()
    },
    {
      id: '2',
      content: "I'm here to help track your pain and symptoms. Just tell me what's going on.",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [painData, setPainData] = useState([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');

    // Generate AI response after a short delay
    setTimeout(() => {
      const conversationHistory = messages.map(msg => msg.content);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateSmartResponse(inputValue, conversationHistory),
        sender: 'ai',
        timestamp: new Date()
      };
      
      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);
      
      // Extract and save pain data if relevant
      const extractedData = extractPainDataFromMessages(finalMessages);
      
      // Only save if we have a valid pain level and it's different from the last entry
      if (extractedData && extractedData.painLevel !== null) {
        const existingData = JSON.parse(localStorage.getItem('painTrackingData') || '[]');
        const today = new Date().toISOString().split('T')[0];
        const todayEntries = existingData.filter((entry: any) => entry.date === today);
        
        // Check if this is a new pain level (different from the last entry)
        const lastPainLevel = todayEntries.length > 0 ? todayEntries[todayEntries.length - 1].painLevel : null;
        
        if (lastPainLevel !== extractedData.painLevel) {
          const savedData = savePainData(extractedData);
          console.log('Pain data saved:', extractedData);
          
          // Optional: Show subtle confirmation
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: (Date.now() + 2).toString(),
              content: '✅ Pain level tracked',
              sender: 'ai',
              timestamp: new Date()
            }]);
          }, 1500);
        }
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 bg-background flex flex-col h-full">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Mini Insights Card */}
        <MiniInsightsCard />
        
        {/* Daily Pain Chart */}
        <div className="px-4 sm:px-6 lg:px-8 mb-6">
          <div className="bg-card rounded-lg border p-4">
            <h3 className="text-lg font-semibold mb-4">Today's Pain Levels</h3>
            <PainChart 
              painData={painData}
              viewMode="today"
              isCompact={false}
            />
          </div>
        </div>
        
        {/* Pain Entry Editor */}
        <div className="px-4 sm:px-6 lg:px-8 mb-6">
          <PainEntryEditor 
            entries={JSON.parse(localStorage.getItem('painTrackingData') || '[]')} 
            onUpdate={(entries) => {
              // Update will be handled by the component itself
            }} 
          />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-xs sm:max-w-md lg:max-w-lg ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {message.sender === 'ai' && (
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm">
                      🤖
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                    <span className={`text-xs text-muted-foreground mt-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 sm:p-6">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tell me about your pain or symptoms..."
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              size="icon"
              disabled={!inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}