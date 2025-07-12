import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Mic, MicOff, Volume2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PatternEngine } from "./PatternEngine";
import { PainLocationSelector } from "./PainLocationSelector";
import { usePainLogs } from "@/hooks/usePainLogs";

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
  suggestions?: string[];
}

interface SmartChatProps {
  onPainDataExtracted?: (data: any) => void;
  onNavigationRequest?: (destination: string) => void;
  painHistory?: any[];
}

interface UserProfile {
  pain_is_consistent?: boolean;
  default_pain_locations?: string[];
}

export function SmartChat({ onPainDataExtracted, onNavigationRequest, painHistory = [] }: SmartChatProps) {
  const { user } = useAuth();
  const { savePainLog } = usePainLogs();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [pendingPainData, setPendingPainData] = useState<any>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hi! I\'m your pain companion. How are you feeling today?',
      sender: 'ai',
      timestamp: new Date(),
      suggestions: ['I have a headache', 'Pain level 7', 'Feeling better today', 'Show my insights']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch user profile for pain consistency setting
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

  // Initialize speech recognition once
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Set to false to prevent session conflicts
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript.trim()) {
          setInputValue(prev => prev + finalTranscript.trim() + ' ');
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'aborted' || event.error === 'no-speech') {
          // Don't show error for aborted or no-speech, just stop
          return;
        }
        
        toast({
          title: "Voice input error",
          description: `Could not process voice input: ${event.error}. Please try again.`,
          variant: "destructive"
        });
      };

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [toast]);

  const generateSmartSuggestions = (userMessage: string, conversationHistory: Message[]): string[] => {
    // Use pattern engine for personalized suggestions
    const contextualMessages = conversationHistory.map(m => m.content);
    return PatternEngine.generateContextualSuggestions(
      userMessage, 
      painHistory, 
      contextualMessages
    );
  };

  // generateAIResponse calls the real AI service with user context
  const generateAIResponse = async (userMessage: string): Promise<{ content: string; suggestions: string[] }> => {
    // Show thinking state
    const thinkingMessage: Message = {
      id: Date.now().toString() + '-thinking',
      content: "thinking...",
      sender: 'ai',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      // Call the Supabase edge function for AI chat
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userMessage,
          userId: user?.id
        }
      });

      // Remove thinking message
      setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id));

      if (error) {
        console.error('AI chat error:', error);
        return {
          content: "I'm sorry, I'm having trouble connecting to my AI brain right now. But I can still help you log pain entries and track patterns!",
          suggestions: generateSmartSuggestions(userMessage, messages)
        };
      }

      return {
        content: data.content,
        suggestions: data.suggestions || generateSmartSuggestions(userMessage, messages)
      };
    } catch (error) {
      console.error('Error calling AI service:', error);
      
      // Remove thinking message
      setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id));
      
      return {
        content: "I'm experiencing some technical difficulties, but I'm still here to help you track your pain. Feel free to log your pain levels and I'll help you spot patterns!",
        suggestions: generateSmartSuggestions(userMessage, messages)
      };
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

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');

    // Extract pain data if relevant
    const extractedData = extractPainData(textToSend);
    if (extractedData && extractedData.painLevel !== null) {
      // Check if user has variable pain and needs location selection
      if (userProfile?.pain_is_consistent === false && extractedData.location.length === 0) {
        setPendingPainData(extractedData);
        setSelectedLocations([]);
        setShowLocationSelector(true);
        
        // Add AI message asking for location
        const locationRequest: Message = {
          id: (Date.now() + 0.5).toString(),
          content: "I see you're experiencing pain. Since your pain tends to move around, could you tell me where specifically you're feeling pain right now?",
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, locationRequest]);
        return; // Don't extract data yet, wait for location
      } else if (userProfile?.pain_is_consistent === true && extractedData.location.length === 0) {
        // For consistent pain users, use their default locations
        extractedData.location = userProfile.default_pain_locations || [];
      }
      
      onPainDataExtracted?.(extractedData);
    }

    // Generate AI response
    try {
      const aiResponseData = await generateAIResponse(textToSend);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseData.content,
        sender: 'ai',
        timestamp: new Date(),
        suggestions: aiResponseData.suggestions
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive"
      });
    }
  };

  const extractPainData = (message: string) => {
    const msg = message.toLowerCase();
    const painData = {
      painLevel: null as number | null,
      location: [] as string[],
      triggers: [] as string[],
      medications: [] as any[],
      notes: message,
      symptoms: [] as string[]
    };

    // Extract pain level
    const painMatch = msg.match(/\b([0-9]|10)\b/);
    if (painMatch) {
      painData.painLevel = parseInt(painMatch[0]);
    }

    // Enhanced location extraction
    const locationKeywords = {
      'forehead': ['head', 'forehead', 'front of head'],
      'temples': ['temples', 'temple', 'side of head'],
      'behind eyes': ['behind eyes', 'behind eye', 'eye pain'],
      'back of head': ['back of head', 'occipital', 'base of skull'],
      'neck': ['neck', 'cervical'],
      'shoulders': ['shoulder', 'shoulders'],
      'back': ['back', 'spine'],
      'chest': ['chest', 'thoracic'],
      'abdomen': ['stomach', 'abdomen', 'belly'],
      'arms': ['arm', 'arms', 'wrist', 'elbow'],
      'legs': ['leg', 'legs', 'knee', 'ankle', 'foot', 'feet'],
      'jaw': ['jaw', 'tmj', 'face'],
      'joints': ['joint', 'joints', 'arthritis']
    };

    Object.entries(locationKeywords).forEach(([location, keywords]) => {
      if (keywords.some(keyword => msg.includes(keyword))) {
        if (!painData.location.includes(location)) {
          painData.location.push(location);
        }
      }
    });

    // Extract triggers
    if (msg.includes('stress')) painData.triggers.push('stress');
    if (msg.includes('tired') || msg.includes('sleep')) painData.triggers.push('poor sleep');
    if (msg.includes('weather') || msg.includes('barometric')) painData.triggers.push('weather');
    if (msg.includes('screen') || msg.includes('computer')) painData.triggers.push('screen time');

    // Extract medications
    if (msg.includes('ibuprofen') || msg.includes('advil')) {
      painData.medications.push({ name: 'ibuprofen', effective: true });
    }
    if (msg.includes('tylenol') || msg.includes('acetaminophen')) {
      painData.medications.push({ name: 'tylenol', effective: true });
    }

    return painData;
  };

  const handleLocationConfirm = async () => {
    if (pendingPainData && selectedLocations.length > 0) {
      const finalPainData = {
        ...pendingPainData,
        location: selectedLocations
      };
      
      // Save to database
      const success = await savePainLog({
        pain_level: finalPainData.painLevel,
        pain_locations: selectedLocations,
        triggers: finalPainData.triggers,
        medications: finalPainData.medications,
        notes: finalPainData.notes
      });

      if (success) {
        // Also trigger the local callback for immediate UI updates
        onPainDataExtracted?.(finalPainData);
        
        // Add confirmation message
        const confirmMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Got it! I've recorded your pain level ${finalPainData.painLevel} in: ${selectedLocations.join(', ')}. I'll help you track this.`,
          sender: 'ai',
          timestamp: new Date(),
          suggestions: ['How long has this been going on?', 'What might have triggered this?', 'Any medications taken?']
        };
        setMessages(prev => [...prev, confirmMessage]);
      }
    }
    
    setShowLocationSelector(false);
    setPendingPainData(null);
    setSelectedLocations([]);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
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
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Speech recognition start error:', error);
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
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Pain Location Selector Modal */}
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
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className="animate-fade-in">
            <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                {message.sender === 'ai' && (
                  <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
                    <span className="text-accent-foreground font-medium">AI</span>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <div className={message.sender === 'user' ? 'chat-message-user' : 'chat-message-ai'}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <span className={`text-xs text-muted-foreground px-2 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* AI Suggestions - ChatGPT style pills */}
            {message.sender === 'ai' && message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 animate-fade-in">
                {message.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="chat-suggestion-pill"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
                <span className="text-accent-foreground font-medium">AI</span>
              </div>
              <div className="chat-message-ai">
                <div className="loading-dots">
                  <div className="loading-dot"></div>
                  <div className="loading-dot" style={{ animationDelay: '0.1s' }}></div>
                  <div className="loading-dot" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - ChatGPT style */}
      <div className="chat-input-area">
        <div className="relative">
          <div className="flex items-end gap-3 bg-background border border-border rounded-2xl p-3">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Message PainPal..."
              className="chat-input border-0 bg-transparent resize-none min-h-[20px] max-h-32 leading-relaxed"
              disabled={isProcessing}
              rows={1}
              style={{
                height: 'auto',
                overflowY: inputValue.split('\n').length > 3 ? 'auto' : 'hidden'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleListening}
                className={`h-8 w-8 p-0 rounded-lg ${isListening ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'}`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button 
                onClick={() => handleSendMessage()}
                size="sm"
                disabled={!inputValue.trim() || isProcessing}
                className="chat-send-button"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}