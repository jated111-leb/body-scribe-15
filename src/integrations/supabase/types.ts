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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievement_notifications: {
        Row: {
          achievement_id: string | null
          created_at: string | null
          id: string
          message: string
          notification_type: string
          read: boolean | null
          user_id: string
        }
        Insert: {
          achievement_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          notification_type: string
          read?: boolean | null
          user_id: string
        }
        Update: {
          achievement_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          notification_type?: string
          read?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_notifications_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_progress: {
        Row: {
          category: string
          created_at: string | null
          current_count: number
          id: string
          last_updated: string | null
          progress_message: string
          required_count: number
          type: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          current_count?: number
          id?: string
          last_updated?: string | null
          progress_message: string
          required_count: number
          type: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          current_count?: number
          id?: string
          last_updated?: string | null
          progress_message?: string
          required_count?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          category: string | null
          created_at: string | null
          current_streak: number | null
          id: string
          insight_text: string | null
          last_event_date: string | null
          metadata: Json | null
          start_date: string
          status: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          insight_text?: string | null
          last_event_date?: string | null
          metadata?: Json | null
          start_date: string
          status?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          insight_text?: string | null
          last_event_date?: string | null
          metadata?: Json | null
          start_date?: string
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      client_invitations: {
        Row: {
          accepted_at: string | null
          client_email: string
          created_at: string
          dietician_id: string
          expires_at: string
          id: string
          invitation_token: string
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          client_email: string
          created_at?: string
          dietician_id: string
          expires_at?: string
          id?: string
          invitation_token?: string
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          client_email?: string
          created_at?: string
          dietician_id?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          status?: string | null
        }
        Relationships: []
      }
      dietician_clients: {
        Row: {
          client_id: string
          created_at: string | null
          dietician_id: string
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          dietician_id: string
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          dietician_id?: string
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inferred_patterns: {
        Row: {
          confirmation_shown: boolean | null
          created_at: string | null
          detection_count: number
          first_detected: string
          id: string
          last_detected: string
          metadata: Json | null
          pattern_type: string
          user_id: string
          user_response: string | null
        }
        Insert: {
          confirmation_shown?: boolean | null
          created_at?: string | null
          detection_count?: number
          first_detected?: string
          id?: string
          last_detected?: string
          metadata?: Json | null
          pattern_type: string
          user_id: string
          user_response?: string | null
        }
        Update: {
          confirmation_shown?: boolean | null
          created_at?: string | null
          detection_count?: number
          first_detected?: string
          id?: string
          last_detected?: string
          metadata?: Json | null
          pattern_type?: string
          user_id?: string
          user_response?: string | null
        }
        Relationships: []
      }
      lifestyle_achievements: {
        Row: {
          achievement_type: string
          confidence: number | null
          created_at: string | null
          date_triggered: string
          focus_id: string | null
          id: string
          insight_text: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          achievement_type: string
          confidence?: number | null
          created_at?: string | null
          date_triggered?: string
          focus_id?: string | null
          id?: string
          insight_text: string
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          achievement_type?: string
          confidence?: number | null
          created_at?: string | null
          date_triggered?: string
          focus_id?: string | null
          id?: string
          insight_text?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lifestyle_achievements_focus_id_fkey"
            columns: ["focus_id"]
            isOneToOne: false
            referencedRelation: "lifestyle_focus"
            referencedColumns: ["id"]
          },
        ]
      }
      lifestyle_focus: {
        Row: {
          confidence: number | null
          created_at: string | null
          focus_type: string
          id: string
          insight_reference: string | null
          last_detected: string | null
          start_date: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          focus_type: string
          id?: string
          insight_reference?: string | null
          last_detected?: string | null
          start_date?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          focus_type?: string
          id?: string
          insight_reference?: string | null
          last_detected?: string | null
          start_date?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          allergies: string[] | null
          avatar_url: string | null
          bmr: number | null
          created_at: string | null
          full_name: string | null
          goals: string[] | null
          health_conditions: string[] | null
          height: number | null
          id: string
          medications: string[] | null
          role_selected: boolean | null
          sex: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          allergies?: string[] | null
          avatar_url?: string | null
          bmr?: number | null
          created_at?: string | null
          full_name?: string | null
          goals?: string[] | null
          health_conditions?: string[] | null
          height?: number | null
          id: string
          medications?: string[] | null
          role_selected?: boolean | null
          sex?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          allergies?: string[] | null
          avatar_url?: string | null
          bmr?: number | null
          created_at?: string | null
          full_name?: string | null
          goals?: string[] | null
          health_conditions?: string[] | null
          height?: number | null
          id?: string
          medications?: string[] | null
          role_selected?: boolean | null
          sex?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      timeline_events: {
        Row: {
          activity_type: string | null
          attachment_urls: string[] | null
          calories: number | null
          calories_burned: number | null
          carbs: number | null
          created_at: string | null
          description: string | null
          diagnosis: string | null
          doctor_name: string | null
          dosage: string | null
          duration: number | null
          event_date: string
          event_type: string
          fats: number | null
          id: string
          intensity: string | null
          meal_type: string | null
          medication_name: string | null
          prescription_end: string | null
          prescription_start: string | null
          protein: number | null
          severity: string | null
          source: string | null
          structured_data: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_type?: string | null
          attachment_urls?: string[] | null
          calories?: number | null
          calories_burned?: number | null
          carbs?: number | null
          created_at?: string | null
          description?: string | null
          diagnosis?: string | null
          doctor_name?: string | null
          dosage?: string | null
          duration?: number | null
          event_date?: string
          event_type: string
          fats?: number | null
          id?: string
          intensity?: string | null
          meal_type?: string | null
          medication_name?: string | null
          prescription_end?: string | null
          prescription_start?: string | null
          protein?: number | null
          severity?: string | null
          source?: string | null
          structured_data?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string | null
          attachment_urls?: string[] | null
          calories?: number | null
          calories_burned?: number | null
          carbs?: number | null
          created_at?: string | null
          description?: string | null
          diagnosis?: string | null
          doctor_name?: string | null
          dosage?: string | null
          duration?: number | null
          event_date?: string
          event_type?: string
          fats?: number | null
          id?: string
          intensity?: string | null
          meal_type?: string | null
          medication_name?: string | null
          prescription_end?: string | null
          prescription_start?: string | null
          protein?: number | null
          severity?: string | null
          source?: string | null
          structured_data?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_achievement_preferences: {
        Row: {
          created_at: string | null
          id: string
          notification_frequency: string | null
          notifications_enabled: boolean | null
          progressive_complexity: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_frequency?: string | null
          notifications_enabled?: boolean | null
          progressive_complexity?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_frequency?: string | null
          notifications_enabled?: boolean | null
          progressive_complexity?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_summaries: {
        Row: {
          created_at: string
          generated_at: string
          health_notes: string | null
          id: string
          meal_count: number | null
          medication_count: number | null
          summary_text: string
          total_events: number | null
          user_id: string
          week_end_date: string
          week_start_date: string
          workout_count: number | null
        }
        Insert: {
          created_at?: string
          generated_at?: string
          health_notes?: string | null
          id?: string
          meal_count?: number | null
          medication_count?: number | null
          summary_text: string
          total_events?: number | null
          user_id: string
          week_end_date: string
          week_start_date: string
          workout_count?: number | null
        }
        Update: {
          created_at?: string
          generated_at?: string
          health_notes?: string | null
          id?: string
          meal_count?: number | null
          medication_count?: number | null
          summary_text?: string
          total_events?: number | null
          user_id?: string
          week_end_date?: string
          week_start_date?: string
          workout_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "dietician" | "client"
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
    Enums: {
      app_role: ["admin", "dietician", "client"],
    },
  },
} as const
