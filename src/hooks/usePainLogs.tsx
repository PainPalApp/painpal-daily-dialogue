import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PainLogData {
  pain_level: number;
  pain_locations: string[];
  triggers?: string[];
  medications?: any[];
  notes?: string;
  mood?: string;
  activity?: string;
  weather?: string;
}

export function usePainLogs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const savePainLog = async (painData: PainLogData) => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save pain logs.",
        variant: "destructive"
      });
      return false;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('pain_logs')
        .insert({
          user_id: user.id,
          pain_level: painData.pain_level,
          pain_locations: painData.pain_locations,
          triggers: painData.triggers || [],
          medications: painData.medications || [],
          notes: painData.notes || '',
          mood: painData.mood,
          activity: painData.activity,
          weather: painData.weather,
          logged_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving pain log:', error);
        toast({
          title: "Error saving pain log",
          description: "There was an issue saving your pain data. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Pain log saved",
        description: `Recorded pain level ${painData.pain_level} in ${painData.pain_locations.join(', ')}`,
      });
      return true;
    } catch (error) {
      console.error('Error saving pain log:', error);
      toast({
        title: "Error saving pain log",
        description: "There was an unexpected error. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getPainLogs = async (startDate?: string, endDate?: string) => {
    if (!user?.id) return [];

    try {
      let query = supabase
        .from('pain_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });

      if (startDate) {
        query = query.gte('logged_at', startDate);
      }
      if (endDate) {
        query = query.lte('logged_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pain logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching pain logs:', error);
      return [];
    }
  };

  const getTodaysPainLogs = async () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return getPainLogs(today, tomorrow);
  };

  const updatePainLog = async (logId: string, updates: Partial<PainLogData>) => {
    if (!user?.id) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('pain_logs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', logId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating pain log:', error);
        toast({
          title: "Error updating pain log",
          description: "There was an issue updating your pain data.",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Pain log updated",
        description: "Your pain log has been successfully updated.",
      });
      return true;
    } catch (error) {
      console.error('Error updating pain log:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePainLog = async (logId: string) => {
    if (!user?.id) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('pain_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting pain log:', error);
        toast({
          title: "Error deleting pain log",
          description: "There was an issue deleting your pain data.",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Pain log deleted",
        description: "Your pain log has been successfully deleted.",
      });
      return true;
    } catch (error) {
      console.error('Error deleting pain log:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    savePainLog,
    getPainLogs,
    getTodaysPainLogs,
    updatePainLog,
    deletePainLog,
    isLoading
  };
}