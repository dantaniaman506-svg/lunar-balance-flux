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
      daily_checklist: {
        Row: {
          checked_at: string
          date: string
          id: string
          rule_id: string
          user_id: string
        }
        Insert: {
          checked_at?: string
          date?: string
          id?: string
          rule_id: string
          user_id: string
        }
        Update: {
          checked_at?: string
          date?: string
          id?: string
          rule_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_checklist_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "strategy_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          bias: string | null
          close_time: string | null
          created_at: string
          date: string
          day: string | null
          direction: string | null
          entry_price: number | null
          entry_time: string | null
          exit_price: number | null
          hold_time: string | null
          id: string
          lessons: string | null
          lot_size: number | null
          market_structure: string | null
          mistakes: string | null
          pair: string | null
          pnl_usd: number
          psych_after: string | null
          psych_before: string | null
          psych_during: string | null
          result: string | null
          rr: string | null
          screenshot_after_url: string | null
          screenshot_before_url: string | null
          session: string | null
          setup_type: string | null
          sl_pips: number | null
          target_pips: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bias?: string | null
          close_time?: string | null
          created_at?: string
          date?: string
          day?: string | null
          direction?: string | null
          entry_price?: number | null
          entry_time?: string | null
          exit_price?: number | null
          hold_time?: string | null
          id?: string
          lessons?: string | null
          lot_size?: number | null
          market_structure?: string | null
          mistakes?: string | null
          pair?: string | null
          pnl_usd?: number
          psych_after?: string | null
          psych_before?: string | null
          psych_during?: string | null
          result?: string | null
          rr?: string | null
          screenshot_after_url?: string | null
          screenshot_before_url?: string | null
          session?: string | null
          setup_type?: string | null
          sl_pips?: number | null
          target_pips?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bias?: string | null
          close_time?: string | null
          created_at?: string
          date?: string
          day?: string | null
          direction?: string | null
          entry_price?: number | null
          entry_time?: string | null
          exit_price?: number | null
          hold_time?: string | null
          id?: string
          lessons?: string | null
          lot_size?: number | null
          market_structure?: string | null
          mistakes?: string | null
          pair?: string | null
          pnl_usd?: number
          psych_after?: string | null
          psych_before?: string | null
          psych_during?: string | null
          result?: string | null
          rr?: string | null
          screenshot_after_url?: string | null
          screenshot_before_url?: string | null
          session?: string | null
          setup_type?: string | null
          sl_pips?: number | null
          target_pips?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_balance_usd: number
          created_at: string
          experience: string | null
          id: string
          name: string | null
          onboarded: boolean
          updated_at: string
        }
        Insert: {
          account_balance_usd?: number
          created_at?: string
          experience?: string | null
          id: string
          name?: string | null
          onboarded?: boolean
          updated_at?: string
        }
        Update: {
          account_balance_usd?: number
          created_at?: string
          experience?: string | null
          id?: string
          name?: string | null
          onboarded?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      strategy_rules: {
        Row: {
          created_at: string
          id: string
          rule_text: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rule_text: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rule_text?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          currency_display: string
          updated_at: string
          usd_to_inr_rate: number
          user_id: string
        }
        Insert: {
          currency_display?: string
          updated_at?: string
          usd_to_inr_rate?: number
          user_id: string
        }
        Update: {
          currency_display?: string
          updated_at?: string
          usd_to_inr_rate?: number
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
