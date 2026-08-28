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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      development_plan_actions: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          owner_id: string | null
          plan_id: string
          status: Database["public"]["Enums"]["goal_status"]
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          plan_id: string
          status?: Database["public"]["Enums"]["goal_status"]
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          plan_id?: string
          status?: Database["public"]["Enums"]["goal_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "development_plan_actions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_plan_actions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "development_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      development_plan_evidence: {
        Row: {
          action_id: string | null
          bucket_id: string
          created_at: string
          file_name: string
          id: string
          kind: string
          mime_type: string | null
          object_path: string
          plan_id: string
          size_bytes: number
          uploaded_by: string
        }
        Insert: {
          action_id?: string | null
          bucket_id?: string
          created_at?: string
          file_name: string
          id?: string
          kind: string
          mime_type?: string | null
          object_path: string
          plan_id: string
          size_bytes: number
          uploaded_by?: string
        }
        Update: {
          action_id?: string | null
          bucket_id?: string
          created_at?: string
          file_name?: string
          id?: string
          kind?: string
          mime_type?: string | null
          object_path?: string
          plan_id?: string
          size_bytes?: number
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "development_plan_evidence_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "development_plan_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_plan_evidence_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "development_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_plan_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      development_plans: {
        Row: {
          created_at: string
          created_by: string
          employee_id: string
          end_date: string | null
          evidence: string | null
          id: string
          owner_id: string | null
          progress: number
          reason: string | null
          review_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["plan_status"]
          title: string
          type: Database["public"]["Enums"]["plan_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          employee_id: string
          end_date?: string | null
          evidence?: string | null
          id?: string
          owner_id?: string | null
          progress?: number
          reason?: string | null
          review_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["plan_status"]
          title: string
          type: Database["public"]["Enums"]["plan_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          employee_id?: string
          end_date?: string | null
          evidence?: string | null
          id?: string
          owner_id?: string | null
          progress?: number
          reason?: string | null
          review_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["plan_status"]
          title?: string
          type?: Database["public"]["Enums"]["plan_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "development_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_plans_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_plans_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_plans_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_requests: {
        Row: {
          assigned_by: string
          created_at: string
          due_date: string | null
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id: string
          responded_at: string | null
          review_id: string
          reviewer_id: string
          status: Database["public"]["Enums"]["feedback_request_status"]
          updated_at: string
          visibility: Database["public"]["Enums"]["feedback_visibility"]
        }
        Insert: {
          assigned_by?: string
          created_at?: string
          due_date?: string | null
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          id?: string
          responded_at?: string | null
          review_id: string
          reviewer_id: string
          status?: Database["public"]["Enums"]["feedback_request_status"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["feedback_visibility"]
        }
        Update: {
          assigned_by?: string
          created_at?: string
          due_date?: string | null
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          id?: string
          responded_at?: string | null
          review_id?: string
          reviewer_id?: string
          status?: Database["public"]["Enums"]["feedback_request_status"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["feedback_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "feedback_requests_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_requests_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_requests_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          employee_id: string
          id: string
          period: string | null
          progress: number
          review_id: string | null
          status: Database["public"]["Enums"]["goal_status"]
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          description?: string | null
          employee_id: string
          id?: string
          period?: string | null
          progress?: number
          review_id?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          employee_id?: string
          id?: string
          period?: string | null
          progress?: number
          review_id?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string
          read_at: string | null
          recipient_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message: string
          read_at?: string | null
          recipient_id: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          read_at?: string | null
          recipient_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      par_meetings: {
        Row: {
          created_at: string
          created_by: string
          employee_id: string
          id: string
          notes: string | null
          review_id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["par_meeting_status"]
          supervisor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          employee_id: string
          id?: string
          notes?: string | null
          review_id: string
          scheduled_at: string
          status?: Database["public"]["Enums"]["par_meeting_status"]
          supervisor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          employee_id?: string
          id?: string
          notes?: string | null
          review_id?: string
          scheduled_at?: string
          status?: Database["public"]["Enums"]["par_meeting_status"]
          supervisor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "par_meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "par_meetings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "par_meetings_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "par_meetings_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department_id: string | null
          email: string | null
          employee_number: string | null
          full_name: string
          hr_partner_id: string | null
          id: string
          is_active: boolean
          job_title: string | null
          manager_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          email?: string | null
          employee_number?: string | null
          full_name: string
          hr_partner_id?: string | null
          id: string
          is_active?: boolean
          job_title?: string | null
          manager_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          email?: string | null
          employee_number?: string | null
          full_name?: string
          hr_partner_id?: string | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          manager_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_hr_partner_id_fkey"
            columns: ["hr_partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_cycles: {
        Row: {
          applies_to: string
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          feedback_due: string | null
          id: string
          name: string
          rating_scale_max: number | null
          review_type: string | null
          self_review_due: string | null
          start_date: string
          status: Database["public"]["Enums"]["review_cycle_status"]
          supervisor_review_due: string | null
          updated_at: string
        }
        Insert: {
          applies_to?: string
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          feedback_due?: string | null
          id?: string
          name: string
          rating_scale_max?: number | null
          review_type?: string | null
          self_review_due?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["review_cycle_status"]
          supervisor_review_due?: string | null
          updated_at?: string
        }
        Update: {
          applies_to?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          feedback_due?: string | null
          id?: string
          name?: string
          rating_scale_max?: number | null
          review_type?: string | null
          self_review_due?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["review_cycle_status"]
          supervisor_review_due?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_cycles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_feedback: {
        Row: {
          comments: string | null
          created_at: string
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id: string
          improvements: string | null
          rating: number | null
          request_id: string
          review_id: string
          reviewer_id: string
          strengths: string | null
          subject_id: string
          submitted_at: string
          visibility: Database["public"]["Enums"]["feedback_visibility"]
        }
        Insert: {
          comments?: string | null
          created_at?: string
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id?: string
          improvements?: string | null
          rating?: number | null
          request_id: string
          review_id: string
          reviewer_id: string
          strengths?: string | null
          subject_id: string
          submitted_at?: string
          visibility: Database["public"]["Enums"]["feedback_visibility"]
        }
        Update: {
          comments?: string | null
          created_at?: string
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          id?: string
          improvements?: string | null
          rating?: number | null
          request_id?: string
          review_id?: string
          reviewer_id?: string
          strengths?: string | null
          subject_id?: string
          submitted_at?: string
          visibility?: Database["public"]["Enums"]["feedback_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "review_feedback_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "feedback_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_feedback_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_feedback_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_feedback_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          cycle_id: string
          due_date: string | null
          employee_id: string
          employee_submitted_at: string | null
          employee_summary: string | null
          hr_comments: string | null
          hr_partner_id: string | null
          id: string
          overall_rating: number | null
          status: Database["public"]["Enums"]["review_status"]
          supervisor_id: string | null
          supervisor_rating: number | null
          supervisor_submitted_at: string | null
          supervisor_summary: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          cycle_id: string
          due_date?: string | null
          employee_id: string
          employee_submitted_at?: string | null
          employee_summary?: string | null
          hr_comments?: string | null
          hr_partner_id?: string | null
          id?: string
          overall_rating?: number | null
          status?: Database["public"]["Enums"]["review_status"]
          supervisor_id?: string | null
          supervisor_rating?: number | null
          supervisor_submitted_at?: string | null
          supervisor_summary?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          cycle_id?: string
          due_date?: string | null
          employee_id?: string
          employee_submitted_at?: string | null
          employee_summary?: string | null
          hr_comments?: string | null
          hr_partner_id?: string | null
          id?: string
          overall_rating?: number | null
          status?: Database["public"]["Enums"]["review_status"]
          supervisor_id?: string | null
          supervisor_rating?: number | null
          supervisor_submitted_at?: string | null
          supervisor_summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "review_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_hr_partner_id_fkey"
            columns: ["hr_partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_hr_review: {
        Args: {
          p_comments: string
          p_overall_rating?: number
          p_review_id: string
        }
        Returns: {
          completed_at: string | null
          created_at: string
          created_by: string
          cycle_id: string
          due_date: string | null
          employee_id: string
          employee_submitted_at: string | null
          employee_summary: string | null
          hr_comments: string | null
          hr_partner_id: string | null
          id: string
          overall_rating: number | null
          status: Database["public"]["Enums"]["review_status"]
          supervisor_id: string | null
          supervisor_rating: number | null
          supervisor_submitted_at: string | null
          supervisor_summary: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reviews"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_self_review: {
        Args: { p_review_id: string; p_submit?: boolean; p_summary: string }
        Returns: {
          completed_at: string | null
          created_at: string
          created_by: string
          cycle_id: string
          due_date: string | null
          employee_id: string
          employee_submitted_at: string | null
          employee_summary: string | null
          hr_comments: string | null
          hr_partner_id: string | null
          id: string
          overall_rating: number | null
          status: Database["public"]["Enums"]["review_status"]
          supervisor_id: string | null
          supervisor_rating: number | null
          supervisor_submitted_at: string | null
          supervisor_summary: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reviews"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      save_supervisor_review: {
        Args: {
          p_rating: number
          p_review_id: string
          p_submit?: boolean
          p_summary: string
        }
        Returns: {
          completed_at: string | null
          created_at: string
          created_by: string
          cycle_id: string
          due_date: string | null
          employee_id: string
          employee_submitted_at: string | null
          employee_summary: string | null
          hr_comments: string | null
          hr_partner_id: string | null
          id: string
          overall_rating: number | null
          status: Database["public"]["Enums"]["review_status"]
          supervisor_id: string | null
          supervisor_rating: number | null
          supervisor_submitted_at: string | null
          supervisor_summary: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reviews"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      feedback_request_status:
        | "pending"
        | "submitted"
        | "declined"
        | "cancelled"
      feedback_type: "peer" | "supervisor" | "project_manager" | "hr"
      feedback_visibility:
        | "employee_and_management"
        | "management_only"
        | "confidential"
      goal_status: "not_started" | "in_progress" | "completed" | "blocked"
      par_meeting_status: "scheduled" | "completed" | "cancelled"
      plan_status: "draft" | "active" | "completed" | "cancelled"
      plan_type: "pdp" | "pip"
      review_cycle_status: "draft" | "active" | "closed"
      review_status:
        | "not_started"
        | "self_review"
        | "supervisor_review"
        | "peer_feedback"
        | "hr_review"
        | "completed"
        | "reopened"
      user_role: "employee" | "supervisor" | "hr_partner" | "senior_management"
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
      feedback_request_status: [
        "pending",
        "submitted",
        "declined",
        "cancelled",
      ],
      feedback_type: ["peer", "supervisor", "project_manager", "hr"],
      feedback_visibility: [
        "employee_and_management",
        "management_only",
        "confidential",
      ],
      goal_status: ["not_started", "in_progress", "completed", "blocked"],
      par_meeting_status: ["scheduled", "completed", "cancelled"],
      plan_status: ["draft", "active", "completed", "cancelled"],
      plan_type: ["pdp", "pip"],
      review_cycle_status: ["draft", "active", "closed"],
      review_status: [
        "not_started",
        "self_review",
        "supervisor_review",
        "peer_feedback",
        "hr_review",
        "completed",
        "reopened",
      ],
      user_role: ["employee", "supervisor", "hr_partner", "senior_management"],
    },
  },
} as const
