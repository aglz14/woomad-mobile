export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          created_at: string
          name: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string | null
        }
      }
      store_categories: {
        Row: {
          created_at: string
          store_id: string | null
          category_id: string | null
          id: string
        }
        Insert: {
          created_at?: string
          store_id?: string | null
          category_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string
          store_id?: string | null
          category_id?: string | null
          id?: string
        }
      }
      stores: {
        Row: {
          id: string
          created_at: string
          mall_id: string | null
          name: string
          description: string | null
          category: string
          floor: string | null
          location_in_mall: string | null
          contact_number: string | null
          logo_url: string | null
          user_id: string | null
          index: number
          has_promotions: boolean | null
          hours: string | null
          array_categories: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          mall_id?: string | null
          name: string
          description?: string | null
          category: string
          floor?: string | null
          location_in_mall?: string | null
          contact_number?: string | null
          logo_url?: string | null
          user_id?: string | null
          index: number
          has_promotions?: boolean | null
          hours?: string | null
          array_categories?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          mall_id?: string | null
          name?: string
          description?: string | null
          category?: string
          floor?: string | null
          location_in_mall?: string | null
          contact_number?: string | null
          logo_url?: string | null
          user_id?: string | null
          index?: number
          has_promotions?: boolean | null
          hours?: string | null
          array_categories?: string[] | null
        }
      }
      promotions: {
        Row: {
          id: string
          created_at: string
          store_id: string | null
          title: string
          description: string
          type: string | null
          start_date: string | null
          end_date: string
          image: string | null
          user_id: string | null
          favorites: number | null
          promotion_type: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          store_id?: string | null
          title: string
          description: string
          type?: string | null
          start_date?: string | null
          end_date: string
          image?: string | null
          user_id?: string | null
          favorites?: number | null
          promotion_type?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          store_id?: string | null
          title?: string
          description?: string
          type?: string | null
          start_date?: string | null
          end_date?: string
          image?: string | null
          user_id?: string | null
          favorites?: number | null
          promotion_type?: string | null
        }
      }
      shopping_malls: {
        Row: {
          id: string
          created_at: string
          name: string
          address: string
          description: string | null
          image: string | null
          latitude: number
          longitude: number
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          address: string
          description?: string | null
          image?: string | null
          latitude: number
          longitude: number
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          address?: string
          description?: string | null
          image?: string | null
          latitude?: number
          longitude?: number
          user_id?: string | null
        }
      }
      promotion_type: {
        Row: {
          created_at: string
          type: string | null
          uuid: string
        }
        Insert: {
          created_at?: string
          type?: string | null
          uuid?: string
        }
        Update: {
          created_at?: string
          type?: string | null
          uuid?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: string | null
        }
      }
    }
  }
}