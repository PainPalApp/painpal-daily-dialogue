import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

// Use the exact database types
type AIInsight = Database['public']['Tables']['ai_insights']['Row'];
type AIPreferences = Database['public']['Tables']['user_ai_preferences']['Row'];
type ConversationMessage = Database['public']['Tables']['ai_conversations']['Row'];

export function useAICompanion() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [preferences, setPreferences] = useState<AIPreferences | null>(null);
  const [conversations, setConversations] = useState<{ [key: string]: ConversationMessage[] }>({});

  // Fetch AI insights for the user
  const fetchInsights = async (limit = 10) => {
    if (!user?.id) return [];

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching AI insights:', error);
        return [];
      }

      setInsights(data || []);
      return data || [];
    } catch (error) {
      console.error('Error in fetchInsights:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new AI insight
  const createInsight = async (insightData: Database['public']['Tables']['ai_insights']['Insert']) => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .insert({
          user_id: user.id,
          ...insightData
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating AI insight:', error);
        return false;
      }

      // Update local state
      setInsights(prev => [data, ...prev]);
      
      toast({
        title: "New AI Insight",
        description: insightData.title,
      });

      return true;
    } catch (error) {
      console.error('Error in createInsight:', error);
      return false;
    }
  };

  // Dismiss an AI insight
  const dismissInsight = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_dismissed: true })
        .eq('id', insightId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error dismissing insight:', error);
        return false;
      }

      // Update local state
      setInsights(prev => prev.filter(insight => insight.id !== insightId));
      return true;
    } catch (error) {
      console.error('Error in dismissInsight:', error);
      return false;
    }
  };

  // Fetch or create user AI preferences
  const fetchPreferences = async () => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('user_ai_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching AI preferences:', error);
        return null;
      }

      if (!data) {
        // Create default preferences
        const defaultPreferences: Database['public']['Tables']['user_ai_preferences']['Insert'] = {
          user_id: user.id,
          ai_personality: 'supportive',
          preferred_communication_style: 'conversational',
          notification_preferences: {
            proactive_insights: true,
            medication_reminders: true,
            pattern_alerts: true,
            weekly_summaries: true
          },
          learned_patterns: {},
          conversation_context: {}
        };

        const { data: newData, error: createError } = await supabase
          .from('user_ai_preferences')
          .insert(defaultPreferences)
          .select()
          .single();

        if (createError) {
          console.error('Error creating AI preferences:', createError);
          return null;
        }

        setPreferences(newData);
        return newData;
      }

      setPreferences(data);
      return data;
    } catch (error) {
      console.error('Error in fetchPreferences:', error);
      return null;
    }
  };

  // Update AI preferences
  const updatePreferences = async (updates: Database['public']['Tables']['user_ai_preferences']['Update']) => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase
        .from('user_ai_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating AI preferences:', error);
        return false;
      }

      setPreferences(data);
      
      toast({
        title: "AI Preferences Updated",
        description: "Your AI companion has been customized to your preferences.",
      });

      return true;
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      return false;
    }
  };

  // Fetch conversation history
  const fetchConversationHistory = async (conversationId: string, limit = 50) => {
    if (!user?.id || !conversationId) return [];

    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching conversation history:', error);
        return [];
      }

      // Update local state
      setConversations(prev => ({
        ...prev,
        [conversationId]: data || []
      }));

      return data || [];
    } catch (error) {
      console.error('Error in fetchConversationHistory:', error);
      return [];
    }
  };

  // Get recent conversations
  const getRecentConversations = async (limit = 5) => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('conversation_id, created_at, content')
        .eq('user_id', user.id)
        .eq('message_type', 'user')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent conversations:', error);
        return [];
      }

      // Group by conversation_id and get the latest message from each
      const conversationMap = new Map();
      data?.forEach(msg => {
        if (!conversationMap.has(msg.conversation_id)) {
          conversationMap.set(msg.conversation_id, {
            id: msg.conversation_id,
            lastMessage: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
            timestamp: msg.created_at
          });
        }
      });

      return Array.from(conversationMap.values());
    } catch (error) {
      console.error('Error in getRecentConversations:', error);
      return [];
    }
  };

  // Load initial data when user changes
  useEffect(() => {
    if (user?.id) {
      fetchInsights();
      fetchPreferences();
    }
  }, [user?.id]);

  return {
    // State
    insights,
    preferences,
    conversations,
    isLoading,

    // Actions
    fetchInsights,
    createInsight,
    dismissInsight,
    fetchPreferences,
    updatePreferences,
    fetchConversationHistory,
    getRecentConversations
  };
}