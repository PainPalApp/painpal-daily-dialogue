import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AIConfig {
  apiKey: string;
  model: string;
  provider: 'anthropic' | 'openai';
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Hook for AI API management
export function useAI() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Try to load config from localStorage
    const savedConfig = localStorage.getItem('aiConfig');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(parsed);
      setIsConnected(true);
    }
  }, []);

  const setupAI = (apiKey: string, provider: 'anthropic' | 'openai' = 'anthropic') => {
    const newConfig: AIConfig = {
      apiKey,
      provider,
      model: provider === 'anthropic' ? 'claude-3-sonnet-20240229' : 'gpt-4'
    };
    
    setConfig(newConfig);
    setIsConnected(true);
    localStorage.setItem('aiConfig', JSON.stringify(newConfig));
    
    toast({
      title: "AI Connected",
      description: `Connected to ${provider === 'anthropic' ? 'Claude' : 'OpenAI'} successfully!`
    });
  };

  const generateResponse = async (messages: Message[], userHistory: any[] = []): Promise<string> => {
    if (!config) {
      throw new Error('AI not configured');
    }

    try {
      const systemPrompt = `You are a compassionate AI pain companion. Your role is to:
1. Help users track their pain levels, symptoms, triggers, and medications
2. Provide empathetic, personalized responses based on their history
3. Ask relevant follow-up questions to gather comprehensive pain data
4. Suggest helpful actions when appropriate
5. Remember their patterns and preferences

User's pain history: ${JSON.stringify(userHistory.slice(-10))}

Be conversational, caring, and focus on practical pain management support.`;

      if (config.provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: config.model,
            max_tokens: 300,
            messages: [
              { role: 'user', content: systemPrompt },
              ...messages
            ]
          })
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.content[0].text;
      } else {
        // OpenAI implementation
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: JSON.stringify({
            model: config.model,
            max_tokens: 300,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages
            ]
          })
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      }
    } catch (error) {
      console.error('AI API Error:', error);
      throw error;
    }
  };

  return {
    isConnected,
    config,
    setupAI,
    generateResponse
  };
}

// AI Setup Component
export function AISetup({ onSetup }: { onSetup: (apiKey: string, provider: 'anthropic' | 'openai') => void }) {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'anthropic' | 'openai'>('anthropic');

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <h4 className="font-medium mb-3">Connect to AI for Personalized Responses</h4>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Provider</label>
          <select 
            value={provider} 
            onChange={(e) => setProvider(e.target.value as 'anthropic' | 'openai')}
            className="w-full mt-1 p-2 border rounded-md bg-background"
          >
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="openai">OpenAI (GPT-4)</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`Enter your ${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key`}
            className="w-full mt-1 p-2 border rounded-md bg-background"
          />
        </div>
        <button
          onClick={() => onSetup(apiKey, provider)}
          disabled={!apiKey.trim()}
          className="w-full bg-primary text-primary-foreground p-2 rounded-md disabled:opacity-50"
        >
          Connect AI
        </button>
      </div>
    </div>
  );
}