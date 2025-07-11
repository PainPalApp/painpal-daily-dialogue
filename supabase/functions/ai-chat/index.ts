import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  userId: string;
}

interface UserProfile {
  diagnosis?: string;
  default_pain_locations?: string[];
  pain_is_consistent?: boolean;
  current_medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { message, userId } = await req.json() as ChatRequest;

    // Fetch user profile for personalized context
    const { data: profile } = await supabase
      .from('profiles')
      .select('diagnosis, default_pain_locations, pain_is_consistent, current_medications')
      .eq('id', userId)
      .single();

    // Build personalized context
    let personalizedContext = "You are PainPal, an AI assistant that helps users track and manage their pain. You are empathetic, knowledgeable, and supportive.";
    
    if (profile) {
      personalizedContext += "\n\nUser's Profile:";
      
      if (profile.diagnosis) {
        personalizedContext += `\n- Condition: ${profile.diagnosis}`;
      }
      
      if (profile.default_pain_locations?.length > 0) {
        personalizedContext += `\n- Typical pain areas: ${profile.default_pain_locations.join(', ')}`;
        personalizedContext += `\n- Pain pattern: ${profile.pain_is_consistent ? 'Usually consistent in these areas' : 'Pain varies in location'}`;
      }
      
      if (profile.current_medications?.length > 0) {
        personalizedContext += `\n- Current medications: ${profile.current_medications.map(med => `${med.name}${med.dosage ? ` (${med.dosage})` : ''}${med.frequency ? ` - ${med.frequency}` : ''}`).join(', ')}`;
      }
      
      personalizedContext += "\n\nUse this information to provide personalized, relevant responses. Don't repeatedly ask for information you already know about the user.";
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: personalizedContext
          },
          { 
            role: 'user', 
            content: message 
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      content: aiResponse,
      suggestions: [
        "How is my pain today?",
        "Log a pain entry",
        "Show my pain patterns",
        "How are my medications working?"
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred processing your request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});