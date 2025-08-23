import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useTodayQueries = () => {
  const { user } = useAuth();

  // Q1_TodayLogs
  const todayLogs = useQuery({
    queryKey: ["today-logs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pain_logs")
        .select("id, logged_at, pain_level, activity")
        .eq("user_id", user!.id)
        .gte("logged_at", new Date().toISOString().split('T')[0])
        .lt("logged_at", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order("logged_at", { ascending: true });
      
      if (error) throw error;
      return data?.map(log => ({ ...log, ts: log.logged_at })) || [];
    },
    enabled: !!user?.id,
  });

  // Q2_Last3
  const last3Logs = useQuery({
    queryKey: ["last-3-logs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pain_logs")
        .select("id, logged_at, pain_level, activity")
        .eq("user_id", user!.id)
        .gte("logged_at", new Date().toISOString().split('T')[0])
        .lt("logged_at", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order("logged_at", { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data?.map(log => ({ ...log, ts: log.logged_at })) || [];
    },
    enabled: !!user?.id,
  });

  // Q3_ActiveSession
  const activeSession = useQuery({
    queryKey: ["active-session", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pain_sessions")
        .select("id")
        .eq("user_id", user!.id)
        .is("resolved_at", null)
        .order("started_at", { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!user?.id,
  });

  // Q4_LastLog
  const lastLog = useQuery({
    queryKey: ["last-log", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pain_logs")
        .select("id, logged_at, pain_level")
        .eq("user_id", user!.id)
        .order("logged_at", { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data?.[0] ? { ...data[0], ts: data[0].logged_at } : null;
    },
    enabled: !!user?.id,
  });

  // Q_Profile
  const profile = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const refetchAll = () => {
    todayLogs.refetch();
    last3Logs.refetch();
    activeSession.refetch();
    lastLog.refetch();
    profile.refetch();
  };

  return {
    todayLogs: todayLogs.data || [],
    last3Logs: last3Logs.data || [],
    activeSession: activeSession.data,
    lastLog: lastLog.data,
    profile: profile.data,
    isLoading: todayLogs.isLoading || last3Logs.isLoading || activeSession.isLoading || lastLog.isLoading || profile.isLoading,
    refetchAll,
  };
};