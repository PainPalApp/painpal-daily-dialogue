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
      const conversationHistory = messages.map(msg => msg.content);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateSmartResponse(inputValue, conversationHistory),
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