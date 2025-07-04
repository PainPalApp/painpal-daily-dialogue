import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

// Chart.js type declarations
declare global {
  interface Window {
    Chart: any;
    painChart: any;
  }
}

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

// Save pain data to localStorage
const savePainData = (extractedData: any) => {
  const existingData = JSON.parse(localStorage.getItem('painTrackingData') || '[]');
  const today = new Date().toISOString().split('T')[0];
  
  // Check if entry for today exists
  const todayIndex = existingData.findIndex((entry: any) => entry.date === today);
  
  if (todayIndex >= 0) {
    // Update today's entry with new information
    existingData[todayIndex] = { 
      ...existingData[todayIndex], 
      ...extractedData,
      timestamp: new Date().toISOString() // Update timestamp
    };
  } else {
    // Create new entry for today
    const newEntry = createPainEntry(extractedData);
    existingData.push(newEntry);
  }
  
  localStorage.setItem('painTrackingData', JSON.stringify(existingData));
  
  // Trigger insights update
  const event = new CustomEvent('painDataUpdated', { detail: existingData });
  window.dispatchEvent(event);
  
  return existingData;
};

// Extract pain data from chat messages
const extractPainDataFromMessages = (messages: Message[]) => {
  const userMessages = messages.filter(msg => msg.sender === 'user');
  const allText = userMessages.map(msg => msg.content || '').join(' ').toLowerCase();
  
  const painData = {
    painLevel: null as number | null,
    location: [] as string[],
    triggers: [] as string[],
    medications: [] as any[],
    notes: userMessages.map(msg => msg.content || '').join('; '),
    symptoms: [] as string[]
  };
  
  // Extract pain level (look for numbers 0-10)
  const painMatch = allText.match(/\b([0-9]|10)\b/);
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
  const [showChart, setShowChart] = useState(false);

  const createMiniChart = (painData: any[]) => {
    const canvas = document.getElementById('painTrendChart') as HTMLCanvasElement;
    if (!canvas || !window.Chart) {
      console.log('Chart canvas not found or Chart.js not loaded');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Prepare last 7 days of data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = painData.find(entry => entry.date === dateStr);
      last7Days.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        pain: dayData?.painLevel || null,
        hasData: !!dayData
      });
    }
    
    console.log('Chart data:', last7Days);
    
    // Destroy existing chart if it exists
    if (window.painChart) {
      window.painChart.destroy();
    }
    
    window.painChart = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: last7Days.map(d => d.date),
        datasets: [{
          data: last7Days.map(d => d.pain),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: last7Days.map(d => d.hasData ? '#3B82F6' : 'transparent'),
          pointBorderColor: '#1E40AF',
          pointRadius: last7Days.map(d => d.hasData ? 4 : 0),
          pointHoverRadius: 6,
          spanGaps: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => context.raw ? `Pain: ${context.raw}/10` : 'No pain recorded'
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 10,
            ticks: { 
              color: '#9CA3AF', 
              font: { size: 10 },
              stepSize: 2
            },
            grid: { color: 'rgba(156, 163, 175, 0.1)' }
          },
          x: {
            ticks: { 
              color: '#9CA3AF', 
              font: { size: 10 }
            },
            grid: { display: false }
          }
        }
      }
    });
  };

  const loadPainData = () => {
    const storedData = JSON.parse(localStorage.getItem('painTrackingData') || '[]');
    setPainHistory(storedData);
    
    // Show chart if we have data
    if (storedData.length > 0) {
      setShowChart(true);
      // Small delay to ensure canvas is rendered
      setTimeout(() => createMiniChart(storedData), 200);
    }
  };

  useEffect(() => {
    loadPainData();
    
    // Listen for data updates
    const handleDataUpdate = (event) => {
      console.log('Pain data updated, refreshing insights...');
      loadPainData();
    };
    
    window.addEventListener('painDataUpdated', handleDataUpdate);
    return () => window.removeEventListener('painDataUpdated', handleDataUpdate);
  }, []);

  // No data state
  if (painHistory.length === 0) {
    return (
      <div className="mini-insights-card">
        <div className="insights-header">
          <h3 className="insights-title">🔍 Start Tracking to See Insights</h3>
        </div>
        <div className="no-data-content">
          <p className="no-data-text">Once you track a few pain episodes, you'll see patterns and trends here.</p>
          <div className="sample-stats">
            <div className="stat-preview">
              <span className="stat-number-preview">--</span>
              <span className="stat-label">Avg Pain</span>
            </div>
            <div className="stat-preview">
              <span className="stat-number-preview">--</span>
              <span className="stat-label">Episodes</span>
            </div>
            <div className="stat-preview">
              <span className="stat-number-preview">--</span>
              <span className="stat-label">Triggers</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats from actual data
  const recentEntries = painHistory.slice(-7);
  const painLevels = recentEntries.filter(e => e.painLevel && e.painLevel > 0).map(e => e.painLevel);
  const avgPain = painLevels.length > 0 ? painLevels.reduce((sum, p) => sum + p, 0) / painLevels.length : 0;
  const totalEpisodes = painLevels.length;
  const allTriggers = recentEntries.flatMap(e => e.triggers || []);
  const uniqueTriggers = [...new Set(allTriggers)].length;

  return (
    <div className="mini-insights-card">
      <div className="insights-header">
        <h3 className="insights-title">📊 Your Recent Pain Tracking</h3>
        <span className="insights-period">Last 7 days</span>
      </div>
      
      {showChart && (
        <div className="mini-chart-container">
          <canvas id="painTrendChart" width="280" height="80"></canvas>
        </div>
      )}
      
      <div className="stats-row">
        <div className="stat-item">
          <span className="stat-number">{avgPain > 0 ? avgPain.toFixed(1) : '0'}</span>
          <span className="stat-label">Avg Pain</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{totalEpisodes}</span>
          <span className="stat-label">Episodes</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{uniqueTriggers}</span>
          <span className="stat-label">Triggers</span>
        </div>
      </div>
      
      <button 
        className="view-insights-btn"
        onClick={() => {/* Navigate to Insights tab */}}
      >
        View Full Insights →
      </button>
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      
      // Save if we extracted meaningful data
      if (extractedData.painLevel !== null || 
          extractedData.triggers.length > 0 || 
          extractedData.medications.length > 0 ||
          inputValue.toLowerCase().includes('headache') ||
          inputValue.toLowerCase().includes('migraine') ||
          inputValue.toLowerCase().includes('pain')) {
        
        const savedData = savePainData(extractedData);
        console.log('Pain data saved:', extractedData);
        
        // Optional: Show subtle confirmation
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: (Date.now() + 2).toString(),
            content: '✅ Data saved to your tracking history',
            sender: 'ai',
            timestamp: new Date()
          }]);
        }, 1500);
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