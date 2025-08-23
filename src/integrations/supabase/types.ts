export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type: string
          metadata?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          confidence_score: number | null
          created_at: string
          data_sources: Json | null
          description: string
          id: string
          insight_type: string
          is_dismissed: boolean | null
          metadata: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          data_sources?: Json | null
          description: string
          id?: string
          insight_type: string
          is_dismissed?: boolean | null
          metadata?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          data_sources?: Json | null
          description?: string
          id?: string
          insight_type?: string
          is_dismissed?: boolean | null
          metadata?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pain_logs: {
        Row: {
          activity: string | null
          created_at: string
          id: string
          journal_entry: string | null
          logged_at: string
          medications: string[] | null
          mood: string | null
          notes: string | null
          pain_level: number
          pain_locations: string[] | null
          pain_strategies: string[] | null
          strategy_effectiveness_score: number | null
          triggers: string[] | null
          updated_at: string
          user_id: string
          weather: string | null
        }
        Insert: {
          activity?: string | null
          created_at?: string
          id?: string
          journal_entry?: string | null
          logged_at?: string
          medications?: string[] | null
          mood?: string | null
          notes?: string | null
          pain_level: number
          pain_locations?: string[] | null
          pain_strategies?: string[] | null
          strategy_effectiveness_score?: number | null
          triggers?: string[] | null
          updated_at?: string
          user_id: string
          weather?: string | null
        }
        Update: {
          activity?: string | null
          created_at?: string
          id?: string
          journal_entry?: string | null
          logged_at?: string
          medications?: string[] | null
          mood?: string | null
          notes?: string | null
          pain_level?: number
          pain_locations?: string[] | null
          pain_strategies?: string[] | null
          strategy_effectiveness_score?: number | null
          triggers?: string[] | null
          updated_at?: string
          user_id?: string
          weather?: string | null
        }
        Relationships: []
      }
      pain_sessions: {
        Row: {
          end_level: number | null
          id: string
          resolved_at: string | null
          start_level: number
          started_at: string
          user_id: string
        }
        Insert: {
          end_level?: number | null
          id?: string
          resolved_at?: string | null
          start_level: number
          started_at?: string
          user_id: string
        }
        Update: {
          end_level?: number | null
          id?: string
          resolved_at?: string | null
          start_level?: number
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          common_triggers: string[] | null
          created_at: string | null
          current_medications: Json | null
          default_pain_locations: string[] | null
          diagnosis: string | null
          display_name: string | null
          email: string | null
          id: string
          onboarding_completed: boolean | null
          pain_is_consistent: boolean | null
          updated_at: string | null
        }
        Insert: {
          common_triggers?: string[] | null
          created_at?: string | null
          current_medications?: Json | null
          default_pain_locations?: string[] | null
          diagnosis?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          onboarding_completed?: boolean | null
          pain_is_consistent?: boolean | null
          updated_at?: string | null
        }
        Update: {
          common_triggers?: string[] | null
          created_at?: string | null
          current_medications?: Json | null
          default_pain_locations?: string[] | null
          diagnosis?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          onboarding_completed?: boolean | null
          pain_is_consistent?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_ai_preferences: {
        Row: {
          ai_personality: string | null
          conversation_context: Json | null
          created_at: string
          id: string
          last_interaction: string | null
          learned_patterns: Json | null
          notification_preferences: Json | null
          preferred_communication_style: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_personality?: string | null
          conversation_context?: Json | null
          created_at?: string
          id?: string
          last_interaction?: string | null
          learned_patterns?: Json | null
          notification_preferences?: Json | null
          preferred_communication_style?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_personality?: string | null
          conversation_context?: Json | null
          created_at?: string
          id?: string
          last_interaction?: string | null
          learned_patterns?: Json | null
          notification_preferences?: Json | null
          preferred_communication_style?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
