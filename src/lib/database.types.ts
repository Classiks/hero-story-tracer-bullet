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
      stories: {
        Row: {
          id: string
          user_id: string
          name: string
          goal: string
          challenge: string
          status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
          blueprint: Json | null
          story_image_path: string | null
          story_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          goal: string
          challenge: string
          status?: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
          blueprint?: Json | null
          story_image_path?: string | null
          story_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          goal?: string
          challenge?: string
          status?: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
          blueprint?: Json | null
          story_image_path?: string | null
          story_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quests: {
        Row: {
          id: string
          story_id: string
          sequence_number: number
          status: 'proposed' | 'accepted' | 'completed' | 'unresolved' | 'rejected'
          recommended_task: Json | null
          quest: Json | null
          accepted_at: string | null
          outcome_status: 'completed' | 'unresolved' | 'rejected' | null
          feedback: Json
          result_text: Json | null
          result_image_path: string | null
          result_image_url: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id: string
          sequence_number: number
          status?: 'proposed' | 'accepted' | 'completed' | 'unresolved' | 'rejected'
          recommended_task?: Json | null
          quest?: Json | null
          accepted_at?: string | null
          outcome_status?: 'completed' | 'unresolved' | 'rejected' | null
          feedback?: Json
          result_text?: Json | null
          result_image_path?: string | null
          result_image_url?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          sequence_number?: number
          status?: 'proposed' | 'accepted' | 'completed' | 'unresolved' | 'rejected'
          recommended_task?: Json | null
          quest?: Json | null
          accepted_at?: string | null
          outcome_status?: 'completed' | 'unresolved' | 'rejected' | null
          feedback?: Json
          result_text?: Json | null
          result_image_path?: string | null
          result_image_url?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      generated_assets: {
        Row: {
          id: string
          user_id: string
          story_id: string | null
          quest_id: string | null
          kind: 'story_image' | 'quest_result_image'
          bucket: string
          path: string
          display_url: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          story_id?: string | null
          quest_id?: string | null
          kind: 'story_image' | 'quest_result_image'
          bucket?: string
          path: string
          display_url?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          story_id?: string | null
          quest_id?: string | null
          kind?: 'story_image' | 'quest_result_image'
          bucket?: string
          path?: string
          display_url?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
