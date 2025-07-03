import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const generateSmartResponse = (userMessage: string): string => {
  const msg = userMessage.toLowerCase().trim();
  
  // Headache/Migraine responses
  if (msg.includes('headache') || msg.includes('migraine')) {
    return "I'm sorry you're dealing with head pain. On a scale of 0-10, how severe is it right now?";
  }
  
  // Severe pain indicators
  if (msg.includes('terrible') || msg.includes('awful') || msg.includes('unbearable') || msg.includes('killing me')) {
    return "That sounds really intense. Let me help you track this properly. Can you rate the pain from 0-10?";
  }
  
  // Mild pain indicators
  if (msg.includes('little') || msg.includes('slight') || msg.includes('minor') || msg.includes('bit')) {
    return "I understand it's bothering you. Even mild pain is worth tracking. What number would you give it from 0-10?";
  }
  
  // Pain level numbers mentioned
  if (msg.match(/\b([0-9]|10)\b/)) {
    const painLevel = msg.match(/\b([0-9]|10)\b/)![0];
    return `Got it, pain level ${painLevel}/10. When did this pain start? Was it gradual or sudden?`;
  }
  
  // Location mentions
  if (msg.includes('forehead') || msg.includes('temples') || msg.includes('behind my eyes')) {
    return "Thank you for the details about the location. That helps a lot. How long has it been bothering you?";
  }
  
  // Time-related
  if (msg.includes('started') || msg.includes('began') || msg.includes('morning') || msg.includes('afternoon')) {
    return "Thanks for that timing information. Have you noticed any triggers? Things like stress, lack of sleep, or certain foods?";
  }
  
  // Medication mentions
  if (msg.includes('took') || msg.includes('medication') || msg.includes('pill') || msg.includes('ibuprofen') || msg.includes('tylenol')) {
    return "Good to know about the medication. Has it helped reduce the pain at all?";
  }
  
  // Trigger mentions
  if (msg.includes('stress') || msg.includes('tired') || msg.includes('dehydrated') || msg.includes('bright lights')) {
    return "That's a helpful insight about potential triggers. I'll note that down. How are you feeling now compared to when it started?";
  }
  
  // Default supportive responses
  const defaultResponses = [
    "I'm here to help. Can you tell me more about what you're experiencing?",
    "Thank you for sharing that. What else can you tell me about how you're feeling?",
    "I understand. Every detail helps me track your pain better. What would you like to add?"
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
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

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Generate AI response after a short delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateSmartResponse(inputValue),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
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