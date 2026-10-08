
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "appointments": {
                  Row: {
                    "barber_id": string,"business_id": string,"created_at": string,"currency": string,"customer_email": string,"customer_name": string,"customer_notes": string,"customer_phone": string,"duration_minutes": number,"ends_at": string,"id": string,"price_minor": number,"reference_code": string,"service_id": string,"service_name": string,"starts_at": string,"status": Database["public"]['Enums']["appointment_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "barber_id": string,"business_id": string,"created_at"?: string,"currency": string,"customer_email": string,"customer_name": string,"customer_notes"?: string,"customer_phone": string,"duration_minutes": number,"ends_at": string,"id"?: string,"price_minor": number,"reference_code"?: string,"service_id": string,"service_name": string,"starts_at": string,"status"?: Database["public"]['Enums']["appointment_status"],"updated_at"?: string
                  }
                  Update: {
                    "barber_id"?: string,"business_id"?: string,"created_at"?: string,"currency"?: string,"customer_email"?: string,"customer_name"?: string,"customer_notes"?: string,"customer_phone"?: string,"duration_minutes"?: number,"ends_at"?: string,"id"?: string,"price_minor"?: number,"reference_code"?: string,"service_id"?: string,"service_name"?: string,"starts_at"?: string,"status"?: Database["public"]['Enums']["appointment_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "appointments_business_id_barber_id_service_id_fkey"
      columns: ["business_id","barber_id","service_id"]
isOneToOne: false
      referencedRelation: "barber_services"
      referencedColumns: ["business_id","barber_id","service_id"]
    },{
      foreignKeyName: "appointments_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"barber_hours": {
                  Row: {
                    "barber_id": string,"business_id": string,"closes_at": string,"id": string,"opens_at": string,"weekday": number
                  }
                  ComputedFields: never
                  Insert: {
                    "barber_id": string,"business_id": string,"closes_at": string,"id"?: string,"opens_at": string,"weekday": number
                  }
                  Update: {
                    "barber_id"?: string,"business_id"?: string,"closes_at"?: string,"id"?: string,"opens_at"?: string,"weekday"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "barber_hours_business_id_barber_id_fkey"
      columns: ["business_id","barber_id"]
isOneToOne: false
      referencedRelation: "barbers"
      referencedColumns: ["business_id","id"]
    },{
      foreignKeyName: "barber_hours_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"barber_services": {
                  Row: {
                    "barber_id": string,"business_id": string,"service_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "barber_id": string,"business_id": string,"service_id": string
                  }
                  Update: {
                    "barber_id"?: string,"business_id"?: string,"service_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "barber_services_business_id_barber_id_fkey"
      columns: ["business_id","barber_id"]
isOneToOne: false
      referencedRelation: "barbers"
      referencedColumns: ["business_id","id"]
    },{
      foreignKeyName: "barber_services_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "barber_services_business_id_service_id_fkey"
      columns: ["business_id","service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["business_id","id"]
    }
                  ]
                },"barbers": {
                  Row: {
                    "biography": string,"business_id": string,"created_at": string,"id": string,"image_path": string | null,"is_active": boolean,"name": string,"sort_order": number,"specialty": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "biography"?: string,"business_id": string,"created_at"?: string,"id"?: string,"image_path"?: string | null,"is_active"?: boolean,"name": string,"sort_order"?: number,"specialty"?: string,"updated_at"?: string
                  }
                  Update: {
                    "biography"?: string,"business_id"?: string,"created_at"?: string,"id"?: string,"image_path"?: string | null,"is_active"?: boolean,"name"?: string,"sort_order"?: number,"specialty"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "barbers_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"business_hours": {
                  Row: {
                    "business_id": string,"closes_at": string,"id": string,"opens_at": string,"weekday": number
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"closes_at": string,"id"?: string,"opens_at": string,"weekday": number
                  }
                  Update: {
                    "business_id"?: string,"closes_at"?: string,"id"?: string,"opens_at"?: string,"weekday"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "business_hours_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"business_members": {
                  Row: {
                    "business_id": string,"created_at": string,"role": Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"role"?: Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"role"?: Database["public"]['Enums']["member_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "business_members_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"businesses": {
                  Row: {
                    "address": string,"created_at": string,"currency": string,"description": string,"email": string,"id": string,"is_active": boolean,"maximum_booking_days": number,"minimum_notice_minutes": number,"name": string,"phone": string,"slot_interval_minutes": number,"slug": string,"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string,"created_at"?: string,"currency"?: string,"description"?: string,"email"?: string,"id"?: string,"is_active"?: boolean,"maximum_booking_days"?: number,"minimum_notice_minutes"?: number,"name": string,"phone"?: string,"slot_interval_minutes"?: number,"slug": string,"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "address"?: string,"created_at"?: string,"currency"?: string,"description"?: string,"email"?: string,"id"?: string,"is_active"?: boolean,"maximum_booking_days"?: number,"minimum_notice_minutes"?: number,"name"?: string,"phone"?: string,"slot_interval_minutes"?: number,"slug"?: string,"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"schedule_overrides": {
                  Row: {
                    "barber_id": string | null,"business_id": string,"closes_at": string | null,"date": string,"id": string,"is_closed": boolean,"opens_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "barber_id"?: string | null,"business_id": string,"closes_at"?: string | null,"date": string,"id"?: string,"is_closed"?: boolean,"opens_at"?: string | null
                  }
                  Update: {
                    "barber_id"?: string | null,"business_id"?: string,"closes_at"?: string | null,"date"?: string,"id"?: string,"is_closed"?: boolean,"opens_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "schedule_overrides_business_id_barber_id_fkey"
      columns: ["business_id","barber_id"]
isOneToOne: false
      referencedRelation: "barbers"
      referencedColumns: ["business_id","id"]
    },{
      foreignKeyName: "schedule_overrides_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"services": {
                  Row: {
                    "business_id": string,"created_at": string,"description": string,"duration_minutes": number,"id": string,"image_path": string | null,"is_active": boolean,"name": string,"price_minor": number,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"description"?: string,"duration_minutes": number,"id"?: string,"image_path"?: string | null,"is_active"?: boolean,"name": string,"price_minor": number,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"description"?: string,"duration_minutes"?: number,"id"?: string,"image_path"?: string | null,"is_active"?: boolean,"name"?: string,"price_minor"?: number,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "services_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"time_off": {
                  Row: {
                    "barber_id": string | null,"business_id": string,"ends_at": string,"id": string,"reason": string,"starts_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "barber_id"?: string | null,"business_id": string,"ends_at": string,"id"?: string,"reason"?: string,"starts_at": string
                  }
                  Update: {
                    "barber_id"?: string | null,"business_id"?: string,"ends_at"?: string,"id"?: string,"reason"?: string,"starts_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "time_off_business_id_barber_id_fkey"
      columns: ["business_id","barber_id"]
isOneToOne: false
      referencedRelation: "barbers"
      referencedColumns: ["business_id","id"]
    },{
      foreignKeyName: "time_off_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
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
            "appointment_status": "pending"|"confirmed"|"completed"|"cancelled"|"no_show","member_role": "owner"|"staff"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "appointment_status": ["pending", "confirmed", "completed", "cancelled", "no_show"],"member_role": ["owner", "staff"]
          }
        }
} as const
