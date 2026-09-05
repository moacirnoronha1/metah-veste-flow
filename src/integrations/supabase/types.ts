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
      app_settings: {
        Row: {
          banner_subtitle: string
          banner_title: string
          banner_url: string | null
          delivery_text: string
          fulfillment_options: string[]
          id: number
          logo_url: string | null
          order_intro: string
          payment_options: string[]
          show_out_of_stock: boolean
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          banner_subtitle?: string
          banner_title?: string
          banner_url?: string | null
          delivery_text?: string
          fulfillment_options?: string[]
          id?: number
          logo_url?: string | null
          order_intro?: string
          payment_options?: string[]
          show_out_of_stock?: boolean
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          banner_subtitle?: string
          banner_title?: string
          banner_url?: string | null
          delivery_text?: string
          fulfillment_options?: string[]
          id?: number
          logo_url?: string | null
          order_intro?: string
          payment_options?: string[]
          show_out_of_stock?: boolean
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      catalog_order_items: {
        Row: {
          color: string
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          size: string
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          size?: string
          unit_price?: number
          variant_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          size?: string
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "catalog_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_orders: {
        Row: {
          address: string | null
          created_at: string
          customer_name: string
          fulfillment: string
          id: string
          installments: number
          notes: string | null
          number: number
          payment_method: string
          phone: string
          sale_id: string | null
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          customer_name: string
          fulfillment?: string
          id?: string
          installments?: number
          notes?: string | null
          number?: number
          payment_method?: string
          phone: string
          sale_id?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          customer_name?: string
          fulfillment?: string
          id?: string
          installments?: number
          notes?: string | null
          number?: number
          payment_method?: string
          phone?: string
          sale_id?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_orders_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          birthday: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          instagram: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          birthday?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instagram?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          birthday?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instagram?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      exchanges: {
        Row: {
          created_at: string
          customer_id: string | null
          difference: number
          id: string
          new_label: string
          new_variant_id: string | null
          notes: string | null
          returned_label: string
          returned_variant_id: string | null
          sale_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          difference?: number
          id?: string
          new_label?: string
          new_variant_id?: string | null
          notes?: string | null
          returned_label?: string
          returned_variant_id?: string | null
          sale_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          difference?: number
          id?: string
          new_label?: string
          new_variant_id?: string | null
          notes?: string | null
          returned_label?: string
          returned_variant_id?: string | null
          sale_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exchanges_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchanges_new_variant_id_fkey"
            columns: ["new_variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchanges_returned_variant_id_fkey"
            columns: ["returned_variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchanges_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string
          cost: number
          created_at: string
          description: string | null
          featured: boolean
          id: string
          images: string[]
          is_new: boolean
          low_stock_threshold: number
          name: string
          price: number
          show_in_catalog: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          cost?: number
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          is_new?: boolean
          low_stock_threshold?: number
          name: string
          price?: number
          show_in_catalog?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          cost?: number
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          is_new?: boolean
          low_stock_threshold?: number
          name?: string
          price?: number
          show_in_catalog?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          color: string
          created_at: string
          id: string
          product_name: string
          quantity: number
          sale_id: string
          size: string
          unit_cost: number
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          product_name: string
          quantity?: number
          sale_id: string
          size?: string
          unit_cost?: number
          unit_price?: number
          variant_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          product_name?: string
          quantity?: number
          sale_id?: string
          size?: string
          unit_cost?: number
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cost_total: number
          created_at: string
          customer_id: string | null
          discount: number
          id: string
          installments: number
          notes: string | null
          payment_method: string
          status: string
          subtotal: number
          total: number
        }
        Insert: {
          cost_total?: number
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          installments?: number
          notes?: string | null
          payment_method?: string
          status?: string
          subtotal?: number
          total?: number
        }
        Update: {
          cost_total?: number
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          installments?: number
          notes?: string | null
          payment_method?: string
          status?: string
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          color: string
          created_at: string
          id: string
          kind: string
          product_name: string
          quantity: number
          reason: string | null
          size: string
          variant_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          kind?: string
          product_name?: string
          quantity?: number
          reason?: string | null
          size?: string
          variant_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          kind?: string
          product_name?: string
          quantity?: number
          reason?: string | null
          size?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      variants: {
        Row: {
          color: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          size: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          size?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          size?: string
        }
        Relationships: [
          {
            foreignKeyName: "variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
