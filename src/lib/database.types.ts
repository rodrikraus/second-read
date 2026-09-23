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
      brand_memberships: {
        Row: {
          brand_id: string
          created_at: string
          person_id: string
          role: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          person_id: string
          role: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          person_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_memberships_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_memberships_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          name: string
          procedures: string
          sample_rate: number
          slug: string
          voice: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          procedures: string
          sample_rate?: number
          slug: string
          voice: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          procedures?: string
          sample_rate?: number
          slug?: string
          voice?: string
        }
        Relationships: []
      }
      criteria: {
        Row: {
          brand_id: string
          category: string
          created_at: string
          guidance: string
          id: string
          label: string
          position: number
          retired_at: string | null
          severity: string
        }
        Insert: {
          brand_id: string
          category: string
          created_at?: string
          guidance?: string
          id?: string
          label: string
          position?: number
          retired_at?: string | null
          severity: string
        }
        Update: {
          brand_id?: string
          category?: string
          created_at?: string
          guidance?: string
          id?: string
          label?: string
          position?: number
          retired_at?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "criteria_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      replies: {
        Row: {
          body: string
          brand_id: string
          created_at: string
          customer_message: string
          customer_name: string
          customer_wrote_at: string
          external_id: string
          id: string
          sample_bucket: number
          sent_at: string
          source: string
          specialist_id: string
          subject: string
          ticket_ref: string
        }
        Insert: {
          body: string
          brand_id: string
          created_at?: string
          customer_message: string
          customer_name: string
          customer_wrote_at: string
          external_id: string
          id?: string
          sample_bucket?: number
          sent_at: string
          source: string
          specialist_id: string
          subject: string
          ticket_ref: string
        }
        Update: {
          body?: string
          brand_id?: string
          created_at?: string
          customer_message?: string
          customer_name?: string
          customer_wrote_at?: string
          external_id?: string
          id?: string
          sample_bucket?: number
          sent_at?: string
          source?: string
          specialist_id?: string
          subject?: string
          ticket_ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "replies_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replies_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      review_flags: {
        Row: {
          brand_id: string
          criterion_id: string
          review_id: string
        }
        Insert: {
          brand_id: string
          criterion_id: string
          review_id: string
        }
        Update: {
          brand_id?: string
          criterion_id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_flags_criterion_id_brand_id_fkey"
            columns: ["criterion_id", "brand_id"]
            isOneToOne: false
            referencedRelation: "criteria"
            referencedColumns: ["id", "brand_id"]
          },
          {
            foreignKeyName: "review_flags_review_id_brand_id_fkey"
            columns: ["review_id", "brand_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id", "brand_id"]
          },
        ]
      }
      reviews: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          note: string
          reply_id: string
          reviewer_id: string
          score: number
          selection: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          note?: string
          reply_id: string
          reviewer_id?: string
          score: number
          selection: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          note?: string
          reply_id?: string
          reviewer_id?: string
          score?: number
          selection?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reply_id_brand_id_fkey"
            columns: ["reply_id", "brand_id"]
            isOneToOne: false
            referencedRelation: "replies"
            referencedColumns: ["id", "brand_id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

