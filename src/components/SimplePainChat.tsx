import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PainLocationSelector } from "./PainLocationSelector";
import { usePainLogs } from "@/hooks/usePainLogs";
import { supabase } from "@/integrations/supabase/client";

// Speech Recognition type definitions
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  pills?: string[];
}

interface SimplePainChatProps {
  onPainDataSaved?: (data: any) => void;
  onNavigateToInsights?: () => void;
}

interface UserProfile {
  pain_is_consistent?: boolean;
  default_pain_locations?: string[];
}

export function SimplePainChat({ onPainDataSaved, onNavigateToInsights }: SimplePainChatProps) {
  const { user } = useAuth();
  const { savePainLog } = usePainLogs();
  const { toast } = useToast();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [currentPainData, setCurrentPainData] = useState<any>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [waitingForInfo, setWaitingForInfo] = useState<string>('');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'How are you feeling today?',
      sender: 'ai',
      timestamp: new Date(),
      pills: ['I\'m in pain', 'Feeling good', 'Moderate discomfort', 'Severe pain']
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('pain_is_consistent, default_pain_locations')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        setUserProfile(data);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  // Speech recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript.trim()) {
          setInputValue(finalTranscript.trim());
        }
      };

      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          toast({
            title: "Voice input error",
            description: "Could not process voice input. Please try again.",
            variant: "destructive"
          });
        }
      };

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const extractPainData = (message: string) => {
    const msg = message.toLowerCase();
    
    // Extract pain level
    let painLevel = null;
    const painMatch = msg.match(/\b([0-9]|10)\b/);
    if (painMatch) {
      painLevel = parseInt(painMatch[0]);
    } else if (msg.includes('severe') || msg.includes('terrible') || msg.includes('horrible')) {
      painLevel = 8;
    } else if (msg.includes('moderate') || msg.includes('bothersome')) {
      painLevel = 5;
    } else if (msg.includes('mild') || msg.includes('slight')) {
      painLevel = 3;
    }

    // Extract locations
    const locations = [];
    const locationMap = {
      'head': ['head', 'headache'],
      'forehead': ['forehead'],
      'temples': ['temples', 'temple'],
      'behind eyes': ['behind eyes', 'eye pain'],
      'back of head': ['back of head', 'base of skull'],
      'neck': ['neck'],
      'shoulders': ['shoulder', 'shoulders'],
      'back': ['back'],
      'abdomen': ['stomach', 'abdomen', 'belly'],
      'chest': ['chest']
    };

    Object.entries(locationMap).forEach(([location, keywords]) => {
      if (keywords.some(keyword => msg.includes(keyword))) {
        locations.push(location);
      }
    });

    // Extract triggers
    const triggers = [];
    if (msg.includes('stress')) triggers.push('stress');
    if (msg.includes('sleep') || msg.includes('tired')) triggers.push('poor sleep');
    if (msg.includes('screen')) triggers.push('screen time');
    if (msg.includes('weather')) triggers.push('weather');

    // Extract medications
    const medications = [];
    if (msg.includes('ibuprofen') || msg.includes('advil')) {
      medications.push('ibuprofen');
    }
    if (msg.includes('tylenol') || msg.includes('acetaminophen')) {
      medications.push('tylenol');
    }

    return {
      painLevel,
      locations,
      triggers,
      medications,
      notes: message
    };
  };

  const generateResponse = (userMessage: string, extractedData: any) => {
    const msg = userMessage.toLowerCase();
    
    // Check what information we have and what we need
    const needsPainLevel = extractedData.painLevel === null;
    const needsLocation = extractedData.locations.length === 0 && userProfile?.pain_is_consistent === false;
    
    if (msg.includes('good') || msg.includes('fine') || msg.includes('no pain')) {
      return {
        content: "That's wonderful! It's important to track pain-free days too. They help us see what's working well.",
        pills: ['Show my patterns', 'Track something else']
      };
    }

    if (msg.includes('pain') && needsPainLevel) {
      return {
        content: "I understand you're experiencing pain. How would you rate it?",
        pills: ['1-3 (Mild)', '4-6 (Moderate)', '7-8 (Severe)', '9-10 (Extreme)']
      };
    }

    if (extractedData.painLevel !== null && needsLocation) {
      setWaitingForInfo('location');
      return {
        content: `Pain level ${extractedData.painLevel}/10 noted. Where specifically are you feeling this pain?`,
        pills: ['Head', 'Neck', 'Shoulders', 'Back', 'Choose specific areas']
      };
    }

    if (extractedData.painLevel !== null && !needsLocation) {
      // We have enough info, save it
      savePainEntry(extractedData);
      return {
        content: `Got it! I've recorded your pain level ${extractedData.painLevel}/10. What might have triggered this?`,
        pills: ['Stress', 'Poor sleep', 'Screen time', 'Weather', 'Not sure']
      };
    }

    // Default responses for specific severity levels
    if (extractedData.painLevel >= 7) {
      return {
        content: `That's severe pain at ${extractedData.painLevel}/10. Have you taken anything for it?`,
        pills: ['Took medication', 'Nothing yet', 'Resting', 'Applied heat/ice']
      };
    }

    if (extractedData.painLevel >= 4) {
      return {
        content: `${extractedData.painLevel}/10 is definitely affecting your day. When did this start?`,
        pills: ['Just now', 'This morning', 'A few hours ago', 'Yesterday']
      };
    }

    return {
      content: "Thanks for sharing that. Is there anything else about your pain I should know?",
      pills: ['Add more details', 'That\'s all for now', 'Show my progress']
    };
  };

  const savePainEntry = async (data: any) => {
    if (!data.painLevel) return;

    const painLogData = {
      pain_level: data.painLevel,
      pain_locations: data.locations,
      triggers: data.triggers,
      medications: data.medications?.map((med: string) => ({ name: med, effective: true })) || [],
      notes: data.notes || ''
    };

    const success = await savePainLog(painLogData);
    
    if (success) {
      onPainDataSaved?.(painLogData);
      toast({
        title: "Pain recorded",
        description: `Pain level ${data.painLevel}/10 has been saved.`,
      });
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Extract pain data
    const extractedData = extractPainData(textToSend);
    
    // Handle location selection
    if (waitingForInfo === 'location' && textToSend.toLowerCase() === 'choose specific areas') {
      setCurrentPainData(extractedData);
      setShowLocationSelector(true);
      return;
    }

    // Handle quick location selections
    if (waitingForInfo === 'location') {
      const quickLocations = ['head', 'neck', 'shoulders', 'back'];
      const selectedQuickLocation = quickLocations.find(loc => 
        textToSend.toLowerCase().includes(loc)
      );
      
      if (selectedQuickLocation) {
        extractedData.locations = [selectedQuickLocation];
        setWaitingForInfo('');
      }
    }

    // Generate AI response
    const responseData = generateResponse(textToSend, extractedData);
    
    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      content: responseData.content,
      sender: 'ai',
      timestamp: new Date(),
      pills: responseData.pills
    };

    setMessages(prev => [...prev, aiResponse]);
  };

  const handleLocationConfirm = async () => {
    if (currentPainData && selectedLocations.length > 0) {
      const finalData = {
        ...currentPainData,
        locations: selectedLocations
      };
      
      await savePainEntry(finalData);
      
      const confirmMessage: Message = {
        id: Date.now().toString(),
        content: `Perfect! I've recorded your pain level ${finalData.painLevel}/10 in: ${selectedLocations.join(', ')}.`,
        sender: 'ai',
        timestamp: new Date(),
        pills: ['What triggered this?', 'Show my progress', 'Track medication']
      };
      
      setMessages(prev => [...prev, confirmMessage]);
    }
    
    setShowLocationSelector(false);
    setCurrentPainData(null);
    setSelectedLocations([]);
    setWaitingForInfo('');
  };

  const handlePillClick = (pill: string) => {
    if (pill === 'Show my progress' && onNavigateToInsights) {
      onNavigateToInsights();
      return;
    }
    handleSendMessage(pill);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice input.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        toast({
          title: "Voice input error",
          description: "Could not start voice input. Please try again.",
          variant: "destructive"
        });
      }
    }
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
    <div className="flex flex-col h-full">
      {/* Location Selector Modal */}
      {showLocationSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full">
            <PainLocationSelector
              commonLocations={userProfile?.default_pain_locations || []}
              selectedLocations={selectedLocations}
              onLocationChange={setSelectedLocations}
              onConfirm={handleLocationConfirm}
              isVariable={true}
            />
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="animate-fade-in">
            <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                {message.sender === 'ai' && (
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs shrink-0 mt-1">
                    <span className="text-primary-foreground font-medium">AI</span>
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.sender === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-foreground'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  
                  <span className={`text-xs text-muted-foreground px-2 ${
                    message.sender === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Interactive Pills */}
            {message.sender === 'ai' && message.pills && (
              <div className="flex flex-wrap gap-2 mt-3 ml-11">
                {message.pills.map((pill, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handlePillClick(pill)}
                  >
                    {pill}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="pr-12 rounded-full"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
              onClick={toggleListening}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim()}
            className="rounded-full h-10 w-10 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}