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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_login_logs: {
        Row: {
          created_at: string
          email: string | null
          id: string
          ip_address: string | null
          reason: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          success: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_user_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json | null
          reason: string | null
          target_user_id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_user_id: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_user_id?: string
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked: string
          blocker: string
          created_at: string
          id: string
        }
        Insert: {
          blocked: string
          blocker: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked?: string
          blocker?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          from_user: string
          id: string
          is_like: boolean
          to_user: string
        }
        Insert: {
          created_at?: string
          from_user: string
          id?: string
          is_like?: boolean
          to_user: string
        }
        Update: {
          created_at?: string
          from_user?: string
          id?: string
          is_like?: boolean
          to_user?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          id: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          created_at: string
          duration_ms: number | null
          height: number | null
          id: string
          match_id: string
          media_type: string | null
          media_url: string | null
          read_at: string | null
          sender_id: string
          width: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          duration_ms?: number | null
          height?: number | null
          id?: string
          match_id: string
          media_type?: string | null
          media_url?: string | null
          read_at?: string | null
          sender_id: string
          width?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string
          duration_ms?: number | null
          height?: number | null
          id?: string
          match_id?: string
          media_type?: string | null
          media_url?: string | null
          read_at?: string | null
          sender_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed: boolean
          created_at: string
          expires_at: string
          id: string
          phone: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed?: boolean
          created_at?: string
          expires_at: string
          id?: string
          phone: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          display_name: string
          gender: string | null
          id: string
          interests: string[] | null
          is_premium: boolean
          is_verified: boolean
          last_seen: string | null
          looking_for: string | null
          moderation_note: string | null
          onboarding_completed: boolean
          photos: string[] | null
          status: Database["public"]["Enums"]["profile_status"]
          suspended_until: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name: string
          gender?: string | null
          id: string
          interests?: string[] | null
          is_premium?: boolean
          is_verified?: boolean
          last_seen?: string | null
          looking_for?: string | null
          moderation_note?: string | null
          onboarding_completed?: boolean
          photos?: string[] | null
          status?: Database["public"]["Enums"]["profile_status"]
          suspended_until?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_premium?: boolean
          is_verified?: boolean
          last_seen?: string | null
          looking_for?: string | null
          moderation_note?: string | null
          onboarding_completed?: boolean
          photos?: string[] | null
          status?: Database["public"]["Enums"]["profile_status"]
          suspended_until?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          match_id: string | null
          reason: string
          reported: string
          reporter: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          match_id?: string | null
          reason: string
          reported: string
          reporter: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          match_id?: string | null
          reason?: string
          reported?: string
          reporter?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_matched_whatsapp: { Args: { _other: string }; Returns: string }
      get_my_whatsapp: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "moderator" | "support"
      profile_status: "active" | "suspended" | "banned"
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
      app_role: ["super_admin", "admin", "moderator", "support"],
      profile_status: ["active", "suspended", "banned"],
    },
  },
} as const
