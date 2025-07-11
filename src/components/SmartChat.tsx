import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Mic, MicOff, Volume2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PatternEngine } from "./PatternEngine";

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

export function SmartChat({ onPainDataExtracted, onNavigationRequest, painHistory = [] }: SmartChatProps) {
  const { user } = useAuth();
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

    // Extract locations
    if (msg.includes('head') || msg.includes('forehead')) painData.location.push('forehead');
    if (msg.includes('temples')) painData.location.push('temples');
    if (msg.includes('behind') && msg.includes('eyes')) painData.location.push('behind eyes');

    // Extract triggers
    if (msg.includes('stress')) painData.triggers.push('stress');
    if (msg.includes('tired') || msg.includes('sleep')) painData.triggers.push('poor sleep');

    // Extract medications
    if (msg.includes('ibuprofen') || msg.includes('advil')) {
      painData.medications.push({ name: 'ibuprofen', effective: true });
    }

    return painData;
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
    <div className="flex flex-col h-full">

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-2 max-w-xs sm:max-w-md lg:max-w-lg ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {message.sender === 'ai' && (
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm">
                    🤖
                  </div>
                )}
                <div className="flex flex-col">
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
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
            
            {/* AI Suggestions */}
            {message.sender === 'ai' && message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 justify-start">
                {message.suggestions.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm">
                🤖
              </div>
              <div className="bg-muted text-foreground px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me about your pain or ask a question..."
            className="flex-1"
            disabled={isProcessing}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={toggleListening}
            className={isListening ? 'bg-primary text-primary-foreground' : ''}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button 
            onClick={() => handleSendMessage()}
            size="icon"
            disabled={!inputValue.trim() || isProcessing}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}