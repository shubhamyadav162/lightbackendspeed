// @generated via Supabase CLI on 2025-06-12 – DO NOT EDIT MANUALLY

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          is_resolved: boolean | null
          message: string
          resolved_at: string | null
          severity: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          is_resolved?: boolean | null
          message: string
          resolved_at?: string | null
          severity: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          is_resolved?: boolean | null
          message?: string
          resolved_at?: string | null
          severity?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          is_deleted: boolean | null
          merchant_id: string
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_deleted?: boolean | null
          merchant_id: string
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_deleted?: boolean | null
          merchant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_wallets_merchant_id_fkey",
            columns: ["merchant_id"],
            isOneToOne: false,
            referencedRelation: "merchants",
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_gateway_preferences: {
        Row: {
          created_at: string
          gateway_code: string
          id: string
          merchant_id: string
          preference_level: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          gateway_code: string
          id?: string
          merchant_id: string
          preference_level?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          gateway_code?: string
          id?: string
          merchant_id?: string
          preference_level?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_gateway_preferences_gateway_code_fkey",
            columns: ["gateway_code"],
            isOneToOne: false,
            referencedRelation: "payment_gateways",
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "merchant_gateway_preferences_merchant_id_fkey",
            columns: ["merchant_id"],
            isOneToOne: false,
            referencedRelation: "merchants",
            referencedColumns: ["id"]
          }
        ]
      }
      merchant_pg_credentials: {
        Row: {
          created_at: string | null
          credentials: Json
          gateway_id: string
          id: string
          is_active: boolean | null
          merchant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credentials: Json
          gateway_id: string
          id?: string
          is_active?: boolean | null
          merchant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credentials?: Json
          gateway_id?: string
          id?: string
          is_active?: boolean | null
          merchant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_pg_credentials_gateway_id_fkey",
            columns: ["gateway_id"],
            isOneToOne: false,
            referencedRelation: "payment_gateways",
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_pg_credentials_merchant_id_fkey",
            columns: ["merchant_id"],
            isOneToOne: false,
            referencedRelation: "merchants",
            referencedColumns: ["id"]
          }
        ]
      }
      merchants: {
        Row: {
          api_key: string
          api_salt: string
          business_type: string | null
          callback_url: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string | null
          webhook_url: string | null
          website: string | null
        }
        Insert: {
          api_key: string
          api_salt: string
          business_type?: string | null
          callback_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string | null
          webhook_url?: string | null
          website?: string | null
        }
        Update: {
          api_key?: string
          api_salt?: string
          business_type?: string | null
          callback_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string | null
          webhook_url?: string | null
          website?: string | null
        }
        Relationships: []
      }
      payment_gateways: {
        Row: {
          api_endpoint: string
          avg_response_time: number | null
          code: string
          created_at: string | null
          credentials: Json | null
          currency_codes: string[] | null
          failure_count: number | null
          health_score: number | null
          id: string
          is_active: boolean | null
          last_failure_time: string | null
          max_transaction_amount: number | null
          merchant_category_codes: string[] | null
          min_transaction_amount: number | null
          name: string
          priority: number | null
          success_rate: number | null
          supported_methods: Json | null
          unavailable_until: string | null
          updated_at: string | null
          webhook_endpoint: string | null
        }
        Insert: {
          api_endpoint: string
          avg_response_time?: number | null
          code: string
          created_at?: string | null
          credentials?: Json | null
          currency_codes?: string[] | null
          failure_count?: number | null
          health_score?: number | null
          id?: string
          is_active?: boolean | null
          last_failure_time?: string | null
          max_transaction_amount?: number | null
          merchant_category_codes?: string[] | null
          min_transaction_amount?: number | null
          name: string
          priority?: number | null
          success_rate?: number | null
          supported_methods?: Json | null
          unavailable_until?: string | null
          updated_at?: string | null
          webhook_endpoint?: string | null
        }
        Update: {
          api_endpoint?: string
          avg_response_time?: number | null
          code?: string
          created_at?: string | null
          credentials?: Json | null
          currency_codes?: string[] | null
          failure_count?: number | null
          health_score?: number | null
          id?: string
          is_active?: boolean | null
          last_failure_time?: string | null
          max_transaction_amount?: number | null
          merchant_category_codes?: string[] | null
          min_transaction_amount?: number | null
          name?: string
          priority?: number | null
          success_rate?: number | null
          supported_methods?: Json | null
          unavailable_until?: string | null
          updated_at?: string | null
          webhook_endpoint?: string | null
        }
        Relationships: []
      }
      settlements: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          merchant_id: string
          settlement_date: string | null
          settlement_ref: string | null
          status: string | null
          transaction_ids: Json | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          merchant_id: string
          settlement_date?: string | null
          settlement_ref?: string | null
          status?: string | null
          transaction_ids?: Json | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          merchant_id?: string
          settlement_date?: string | null
          settlement_ref?: string | null
          status?: string | null
          transaction_ids?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlements_merchant_id_fkey",
            columns: ["merchant_id"],
            isOneToOne: false,
            referencedRelation: "merchants",
            referencedColumns: ["id"]
          }
        ]
      }
      system_status: {
        Row: {
          component: string
          created_at: string
          id: string
          message: string | null
          response_time_ms: number | null
          status: string
          updated_at: string
        }
        Insert: {
          component: string
          created_at?: string
          id?: string
          message?: string | null
          response_time_ms?: number | null
          status: string
          updated_at?: string
        }
        Update: {
          component?: string
          created_at?: string
          id?: string
          message?: string | null
          response_time_ms?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          customer_email: string | null
          customer_phone: string | null
          description: string | null
          gateway_id: string | null
          gateway_response: Json | null
          gateway_txn_id: string | null
          id: string
          merchant_id: string
          metadata: Json | null
          payment_method: string | null
          status: string | null
          txn_id: string
          updated_at: string | null
          user_details: Json | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          description?: string | null
          gateway_id?: string | null
          gateway_response?: Json | null
          gateway_txn_id?: string | null
          id?: string
          merchant_id: string
          metadata?: Json | null
          payment_method?: string | null
          status?: string | null
          txn_id: string
          updated_at?: string | null
          user_details?: Json | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          description?: string | null
          gateway_id?: string | null
          gateway_response?: Json | null
          gateway_txn_id?: string | null
          id?: string
          merchant_id?: string
          metadata?: Json | null
          payment_method?: string | null
          status?: string | null
          txn_id?: string
          updated_at?: string | null
          user_details?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_gateway_id_fkey",
            columns: ["gateway_id"],
            isOneToOne: false,
            referencedRelation: "payment_gateways",
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_merchant_id_fkey",
            columns: ["merchant_id"],
            isOneToOne: false,
            referencedRelation: "merchants",
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          created_at: string | null
          id: string
          merchant_id: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          merchant_id?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [        
          {
            foreignKeyName: "users_merchant_id_fkey",
            columns: ["merchant_id"],
            isOneToOne: false,
            referencedRelation: "merchants",
            referencedColumns: ["id"]
          }
        ]
      }
      webhook_events: {
        Row: {
          attempts: number
          created_at: string
          event_type: string
          id: string
          last_attempt_at: string | null
          payload: Json
          status: string
          updated_at: string
          webhook_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          event_type: string
          id?: string
          last_attempt_at?: string | null
          payload: Json
          status: string
          updated_at?: string
          webhook_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          event_type?: string
          id?: string
          last_attempt_at?: string | null
          payload?: Json
          status?: string
          updated_at?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_webhook_id_fkey",
            columns: ["webhook_id"],
            isOneToOne: false,
            referencedRelation: "webhooks",
            referencedColumns: ["id"]
          }
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          event_types: string[]
          id: string
          is_active: boolean
          merchant_id: string
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          event_types: string[]
          id?: string
          is_active?: boolean
          merchant_id: string
          secret: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          event_types?: string[]
          id?: string
          is_active?: boolean
          merchant_id?: string
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_merchant_id_fkey",
            columns: ["merchant_id"],
            isOneToOne: false,
            referencedRelation: "merchants",
            referencedColumns: ["id"]
          }
        ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const 