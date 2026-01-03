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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      actors: {
        Row: {
          accent: string | null
          age: number | null
          created_at: string
          credits_cost: number | null
          custom_audio_url: string | null
          custom_image_url: string | null
          error_message: string | null
          gender: string | null
          id: string
          language: string | null
          mode: string | null
          name: string
          other_instructions: string | null
          personality_details: Json | null
          physical_details: Json | null
          profile_360_url: string | null
          profile_image_url: string | null
          progress: number | null
          sora_prompt: string | null
          sora_video_url: string | null
          status: string
          updated_at: string
          user_id: string
          voice_details: Json | null
          voice_url: string | null
        }
        Insert: {
          accent?: string | null
          age?: number | null
          created_at?: string
          credits_cost?: number | null
          custom_audio_url?: string | null
          custom_image_url?: string | null
          error_message?: string | null
          gender?: string | null
          id?: string
          language?: string | null
          mode?: string | null
          name?: string
          other_instructions?: string | null
          personality_details?: Json | null
          physical_details?: Json | null
          profile_360_url?: string | null
          profile_image_url?: string | null
          progress?: number | null
          sora_prompt?: string | null
          sora_video_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
          voice_details?: Json | null
          voice_url?: string | null
        }
        Update: {
          accent?: string | null
          age?: number | null
          created_at?: string
          credits_cost?: number | null
          custom_audio_url?: string | null
          custom_image_url?: string | null
          error_message?: string | null
          gender?: string | null
          id?: string
          language?: string | null
          mode?: string | null
          name?: string
          other_instructions?: string | null
          personality_details?: Json | null
          physical_details?: Json | null
          profile_360_url?: string | null
          profile_image_url?: string | null
          progress?: number | null
          sora_prompt?: string | null
          sora_video_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          voice_details?: Json | null
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string | null
          download_url: string | null
          error_message: string | null
          file_type: string
          folder_id: string | null
          generation_params: Json | null
          id: string
          metadata: Json | null
          name: string
          preview_url: string | null
          progress: number | null
          project_id: string
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          download_url?: string | null
          error_message?: string | null
          file_type: string
          folder_id?: string | null
          generation_params?: Json | null
          id?: string
          metadata?: Json | null
          name: string
          preview_url?: string | null
          progress?: number | null
          project_id: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          download_url?: string | null
          error_message?: string | null
          file_type?: string
          folder_id?: string | null
          generation_params?: Json | null
          id?: string
          metadata?: Json | null
          name?: string
          preview_url?: string | null
          progress?: number | null
          project_id?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          access_control: Json | null
          created_at: string | null
          id: string
          name: string
          parent_folder_id: string | null
          project_id: string
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          access_control?: Json | null
          created_at?: string | null
          id?: string
          name: string
          parent_folder_id?: string | null
          project_id: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          access_control?: Json | null
          created_at?: string | null
          id?: string
          name?: string
          parent_folder_id?: string | null
          project_id?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string | null
          current_stage: string
          display_status: string | null
          final_video_input: Json | null
          final_video_output: Json | null
          first_frame_complete: boolean | null
          first_frame_input: Json | null
          first_frame_output: Json | null
          folder_id: string | null
          id: string
          name: string
          output_file_id: string | null
          pipeline_type: string
          project_id: string
          script_complete: boolean | null
          script_input: Json | null
          script_output: Json | null
          status: string
          tags: string[] | null
          updated_at: string | null
          user_id: string
          voice_complete: boolean | null
          voice_input: Json | null
          voice_output: Json | null
        }
        Insert: {
          created_at?: string | null
          current_stage?: string
          display_status?: string | null
          final_video_input?: Json | null
          final_video_output?: Json | null
          first_frame_complete?: boolean | null
          first_frame_input?: Json | null
          first_frame_output?: Json | null
          folder_id?: string | null
          id?: string
          name?: string
          output_file_id?: string | null
          pipeline_type?: string
          project_id: string
          script_complete?: boolean | null
          script_input?: Json | null
          script_output?: Json | null
          status?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          voice_complete?: boolean | null
          voice_input?: Json | null
          voice_output?: Json | null
        }
        Update: {
          created_at?: string | null
          current_stage?: string
          display_status?: string | null
          final_video_input?: Json | null
          final_video_output?: Json | null
          first_frame_complete?: boolean | null
          first_frame_input?: Json | null
          first_frame_output?: Json | null
          folder_id?: string | null
          id?: string
          name?: string
          output_file_id?: string | null
          pipeline_type?: string
          project_id?: string
          script_complete?: boolean | null
          script_input?: Json | null
          script_output?: Json | null
          status?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          voice_complete?: boolean | null
          voice_input?: Json | null
          voice_output?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipelines_output_file_id_fkey"
            columns: ["output_file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipelines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          credits: number | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          credits?: number | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          credits?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pipelines: {
        Row: {
          created_at: string | null
          id: string
          name: string
          stages: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          stages?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          stages?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pipelines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_statuses: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          status_name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          status_name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          status_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_statuses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          tag_name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          tag_name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          tag_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tags_user_id_fkey"
            columns: ["user_id"]
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
      refund_credits: {
        Args: { p_amount: number; p_description?: string; p_user_id: string }
        Returns: undefined
      }
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
