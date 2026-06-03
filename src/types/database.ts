export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          current_rank: string;
          id: string;
          streak_count: number;
          total_xp: number;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          current_rank?: string;
          id: string;
          streak_count?: number;
          total_xp?: number;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          current_rank?: string;
          streak_count?: number;
          total_xp?: number;
          username?: string | null;
        };
        Relationships: [];
      };
      challenges: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          difficulty: 'easy' | 'medium' | 'hard';
          id: string;
          is_active: boolean;
          title: string;
          xp_reward: number;
        };
        Insert: {
          category: string;
          created_at?: string;
          description?: string | null;
          difficulty: 'easy' | 'medium' | 'hard';
          id?: string;
          is_active?: boolean;
          title: string;
          xp_reward: number;
        };
        Update: {
          category?: string;
          description?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard';
          is_active?: boolean;
          title?: string;
          xp_reward?: number;
        };
        Relationships: [];
      };
      user_challenges: {
        Row: {
          challenge_id: string;
          completed_at: string | null;
          created_at: string;
          id: string;
          status: 'assigned' | 'completed';
          user_id: string;
        };
        Insert: {
          challenge_id: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          status?: 'assigned' | 'completed';
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          status?: 'assigned' | 'completed';
        };
        Relationships: [];
      };
      xp_logs: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          reason: string;
          source_id: string | null;
          source_type: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          reason: string;
          source_id?: string | null;
          source_type: string;
          user_id: string;
        };
        Update: never;
        Relationships: [];
      };
      ranks: {
        Row: {
          id: string;
          max_xp: number | null;
          min_xp: number;
          name: string;
          order: number;
        };
        Insert: {
          id?: string;
          max_xp?: number | null;
          min_xp: number;
          name: string;
          order: number;
        };
        Update: {
          max_xp?: number | null;
          min_xp?: number;
          name?: string;
          order?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
