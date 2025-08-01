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
  conversationId?: string;
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

    const { message, userId, conversationId } = await req.json() as ChatRequest;

    console.log('Processing chat request:', { userId, conversationId, messageLength: message.length });

    // Fetch comprehensive user context
    const [profileResponse, painHistoryResponse, conversationHistoryResponse, preferencesResponse] = await Promise.all([
      // User profile
      supabase
        .from('profiles')
        .select('diagnosis, default_pain_locations, pain_is_consistent, current_medications, common_triggers')
        .eq('id', userId)
        .single(),
      
      // Recent pain history (last 30 days)
      supabase
        .from('pain_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('logged_at', { ascending: false })
        .limit(50),
      
      // Recent conversation history
      conversationId ? supabase
        .from('ai_conversations')
        .select('message_type, content, created_at')
        .eq('user_id', userId)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(20) : { data: [] },
      
      // User AI preferences
      supabase
        .from('user_ai_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()
    ]);

    const profile = profileResponse.data;
    const painHistory = painHistoryResponse.data || [];
    const conversationHistory = conversationHistoryResponse.data || [];
    const preferences = preferencesResponse.data;

    console.log('Context gathered:', {
      hasProfile: !!profile,
      painHistoryCount: painHistory.length,
      conversationHistoryCount: conversationHistory.length,
      hasPreferences: !!preferences
    });

    // Analyze pain patterns
    const painAnalysis = analyzePainPatterns(painHistory);
    console.log('Pain analysis:', painAnalysis);

    // Build comprehensive AI context
    let systemPrompt = `You are PainPal, an advanced AI pain companion that provides personalized support for pain management. You are empathetic, knowledgeable, supportive, and remember previous conversations.

CORE PERSONALITY:
- Warm, understanding, and non-judgmental
- Medically informed but never replace professional medical advice
- Proactive in offering insights and suggestions
- Remember and reference previous conversations naturally

CAPABILITIES:
- Analyze pain patterns and trends
- Provide personalized suggestions based on user history
- Offer evidence-based pain management strategies
- Support medication tracking and effectiveness analysis
- Detect concerning patterns and recommend professional consultation`;
    
    if (profile) {
      systemPrompt += `\n\nUSER PROFILE:`;
      
      if (profile.diagnosis) {
        systemPrompt += `\n- Condition: ${profile.diagnosis}`;
      }
      
      if (profile.default_pain_locations?.length > 0) {
        systemPrompt += `\n- Typical pain areas: ${profile.default_pain_locations.join(', ')}`;
        systemPrompt += `\n- Pain pattern: ${profile.pain_is_consistent ? 'Usually consistent in these areas' : 'Pain varies in location'}`;
      }
      
      if (profile.current_medications?.length > 0) {
        systemPrompt += `\n- Current medications: ${profile.current_medications.map(med => `${med.name}${med.dosage ? ` (${med.dosage})` : ''}${med.frequency ? ` - ${med.frequency}` : ''}`).join(', ')}`;
      }

      if (profile.common_triggers?.length > 0) {
        systemPrompt += `\n- Known triggers: ${profile.common_triggers.join(', ')}`;
      }
    }

    // Add pain pattern analysis
    if (painAnalysis.hasData) {
      systemPrompt += `\n\nRECENT PAIN PATTERNS (Last 30 days):
- Average pain level: ${painAnalysis.averagePain.toFixed(1)}/10
- Most affected areas: ${painAnalysis.topLocations.join(', ')}
- Common triggers: ${painAnalysis.commonTriggers.join(', ')}
- Trend: ${painAnalysis.trend}`;

      if (painAnalysis.insights.length > 0) {
        systemPrompt += `\n- Key insights: ${painAnalysis.insights.join('; ')}`;
      }
    }

    // Add conversation context
    if (conversationHistory.length > 0) {
      systemPrompt += `\n\nRECENT CONVERSATION CONTEXT:`;
      conversationHistory.slice(-6).forEach(msg => {
        const truncated = msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;
        systemPrompt += `\n${msg.message_type}: ${truncated}`;
      });
    }

    // Add AI preferences
    if (preferences) {
      systemPrompt += `\n\nUSER PREFERENCES:
- Communication style: ${preferences.preferred_communication_style}
- AI personality: ${preferences.ai_personality}`;
    }

    systemPrompt += `\n\nIMPORTANT GUIDELINES:
- Reference previous conversations naturally when relevant
- Provide specific, actionable advice based on their condition and history
- Suggest logging pain when appropriate
- Alert to concerning patterns (e.g., sudden increases, new symptoms)
- Always remind that you don't replace professional medical advice
- Be proactive in offering relevant insights from their pain history`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: message 
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      console.error('OpenAI API Key present:', !!openAIApiKey);
      console.error('OpenAI API Key length:', openAIApiKey?.length || 0);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Store conversation in database
    const newConversationId = conversationId || crypto.randomUUID();
    
    try {
      // Store user message and AI response
      await Promise.all([
        supabase.from('ai_conversations').insert({
          user_id: userId,
          conversation_id: newConversationId,
          message_type: 'user',
          content: message,
          metadata: { timestamp: new Date().toISOString() }
        }),
        supabase.from('ai_conversations').insert({
          user_id: userId,
          conversation_id: newConversationId,
          message_type: 'assistant',
          content: aiResponse,
          metadata: { 
            model: 'gpt-4.1-2025-04-14',
            timestamp: new Date().toISOString(),
            pain_analysis: painAnalysis
          }
        })
      ]);

      // Update user preferences with last interaction
      if (preferences) {
        await supabase
          .from('user_ai_preferences')
          .update({ last_interaction: new Date().toISOString() })
          .eq('user_id', userId);
      } else {
        // Create default preferences if they don't exist
        await supabase
          .from('user_ai_preferences')
          .insert({
            user_id: userId,
            last_interaction: new Date().toISOString()
          });
      }

      console.log('Conversation stored successfully');
    } catch (dbError) {
      console.error('Database storage error:', dbError);
      // Continue even if storage fails
    }

    // Generate intelligent suggestions based on context
    const suggestions = generateContextualSuggestions(message, profile, painAnalysis, conversationHistory);

    return new Response(JSON.stringify({ 
      content: aiResponse,
      suggestions,
      conversationId: newConversationId,
      insights: painAnalysis.insights
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred processing your request',
      suggestions: [
        "How is my pain today?",
        "Log a pain entry", 
        "Show my pain patterns",
        "Tell me about my medication effectiveness"
      ]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Pain pattern analysis function
function analyzePainPatterns(painHistory: any[]) {
  if (!painHistory || painHistory.length === 0) {
    return {
      hasData: false,
      averagePain: 0,
      topLocations: [],
      commonTriggers: [],
      trend: 'No data available',
      insights: []
    };
  }

  const recentLogs = painHistory.slice(0, 30);
  const averagePain = recentLogs.reduce((sum, log) => sum + log.pain_level, 0) / recentLogs.length;

  // Analyze locations
  const locationFreq = {};
  const triggerFreq = {};
  
  recentLogs.forEach(log => {
    if (log.pain_locations) {
      log.pain_locations.forEach(loc => {
        locationFreq[loc] = (locationFreq[loc] || 0) + 1;
      });
    }
    if (log.triggers) {
      log.triggers.forEach(trigger => {
        triggerFreq[trigger] = (triggerFreq[trigger] || 0) + 1;
      });
    }
  });

  const topLocations = Object.entries(locationFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([location]) => location);

  const commonTriggers = Object.entries(triggerFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([trigger]) => trigger);

  // Analyze trend
  const recentAvg = recentLogs.slice(0, 7).reduce((sum, log) => sum + log.pain_level, 0) / Math.min(7, recentLogs.length);
  const olderAvg = recentLogs.slice(7, 14).reduce((sum, log) => sum + log.pain_level, 0) / Math.min(7, recentLogs.slice(7, 14).length);
  
  let trend = 'Stable';
  if (recentAvg > olderAvg + 0.5) trend = 'Increasing';
  else if (recentAvg < olderAvg - 0.5) trend = 'Decreasing';

  // Generate insights
  const insights = [];
  if (averagePain > 7) insights.push('High pain levels detected');
  if (trend === 'Increasing') insights.push('Pain levels trending upward');
  if (trend === 'Decreasing') insights.push('Pain levels improving');
  if (topLocations.length > 0) insights.push(`Most affected: ${topLocations[0]}`);

  return {
    hasData: true,
    averagePain,
    topLocations,
    commonTriggers,
    trend,
    insights
  };
}

// Generate contextual suggestions
function generateContextualSuggestions(message: string, profile: any, painAnalysis: any, conversationHistory: any[]) {
  const suggestions = [];
  const msgLower = message.toLowerCase();

  // Pain logging suggestions
  if (msgLower.includes('pain') && !msgLower.includes('log')) {
    suggestions.push("Log my current pain level");
  }

  // Pattern analysis suggestions
  if (painAnalysis.hasData) {
    if (painAnalysis.trend === 'Increasing') {
      suggestions.push("What's causing my pain to increase?");
    }
    if (painAnalysis.commonTriggers.length > 0) {
      suggestions.push(`Tell me about my ${painAnalysis.commonTriggers[0]} trigger`);
    }
  }

  // Medication suggestions
  if (profile?.current_medications?.length > 0) {
    suggestions.push("How effective are my medications?");
  }

  // Condition-specific suggestions
  if (profile?.diagnosis) {
    suggestions.push(`Tips for managing ${profile.diagnosis}`);
  }

  // Default suggestions if none generated
  if (suggestions.length === 0) {
    suggestions.push(
      "How is my pain today?",
      "Log a pain entry",
      "Show my pain patterns",
      "Medication effectiveness review"
    );
  }

  return suggestions.slice(0, 4); // Limit to 4 suggestions
}