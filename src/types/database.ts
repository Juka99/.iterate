export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          current_rank: string;
          essence_balance: number;
          id: string;
          legacy_path: string | null;
          onboarding_completed: boolean;
          streak_count: number;
          total_xp: number;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          current_rank?: string;
          essence_balance?: number;
          id: string;
          legacy_path?: string | null;
          onboarding_completed?: boolean;
          streak_count?: number;
          total_xp?: number;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          current_rank?: string;
          essence_balance?: number;
          legacy_path?: string | null;
          onboarding_completed?: boolean;
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
          cadence: 'daily' | 'weekly' | 'repeatable';
          description: string | null;
          difficulty: 'easy' | 'medium' | 'hard';
          id: string;
          is_active: boolean;
          is_special: boolean;
          max_rank_order: number | null;
          min_rank_order: number;
          source_item_id: string | null;
          title: string;
          xp_reward: number;
        };
        Insert: {
          category: string;
          cadence?: 'daily' | 'weekly' | 'repeatable';
          created_at?: string;
          description?: string | null;
          difficulty: 'easy' | 'medium' | 'hard';
          id?: string;
          is_active?: boolean;
          is_special?: boolean;
          max_rank_order?: number | null;
          min_rank_order?: number;
          source_item_id?: string | null;
          title: string;
          xp_reward: number;
        };
        Update: {
          category?: string;
          cadence?: 'daily' | 'weekly' | 'repeatable';
          description?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard';
          is_active?: boolean;
          is_special?: boolean;
          max_rank_order?: number | null;
          min_rank_order?: number;
          source_item_id?: string | null;
          title?: string;
          xp_reward?: number;
        };
        Relationships: [];
      };
      user_challenges: {
        Row: {
          applied_item_activation_ids: string[];
          challenge_id: string;
          completed_at: string | null;
          created_at: string;
          essence_awarded: number;
          id: string;
          status: 'assigned' | 'completed';
          user_id: string;
          xp_awarded: number;
        };
        Insert: {
          applied_item_activation_ids?: string[];
          challenge_id: string;
          completed_at?: string | null;
          created_at?: string;
          essence_awarded?: number;
          id?: string;
          status?: 'assigned' | 'completed';
          user_id: string;
          xp_awarded?: number;
        };
        Update: {
          applied_item_activation_ids?: string[];
          completed_at?: string | null;
          essence_awarded?: number;
          status?: 'assigned' | 'completed';
          xp_awarded?: number;
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
      shop_purchases: {
        Row: {
          cost_paid: number;
          id: string;
          item_id: string;
          purchased_at: string;
          user_id: string;
        };
        Insert: {
          cost_paid: number;
          id?: string;
          item_id: string;
          purchased_at?: string;
          user_id: string;
        };
        Update: never;
        Relationships: [];
      };
      user_achievements: {
        Row: {
          achievement_id: string;
          claimed_at: string;
          essence_reward: number;
          id: string;
          reward_item_id: string | null;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          claimed_at?: string;
          essence_reward?: number;
          id?: string;
          reward_item_id?: string | null;
          user_id: string;
        };
        Update: never;
        Relationships: [];
      };
      user_item_activations: {
        Row: {
          activated_at: string;
          consumed_at: string | null;
          expires_at: string | null;
          id: string;
          item_id: string;
          metadata: Json;
          user_id: string;
        };
        Insert: {
          activated_at?: string;
          consumed_at?: string | null;
          expires_at?: string | null;
          id?: string;
          item_id: string;
          metadata?: Json;
          user_id: string;
        };
        Update: {
          consumed_at?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
      guilds: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          emblem_url: string | null;
          id: string;
          level: number;
          member_limit: number;
          name: string;
          total_xp: number;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          emblem_url?: string | null;
          id?: string;
          level?: number;
          member_limit?: number;
          name: string;
          total_xp?: number;
        };
        Update: {
          description?: string | null;
          emblem_url?: string | null;
          level?: number;
          member_limit?: number;
          name?: string;
          total_xp?: number;
        };
        Relationships: [];
      };
      guild_members: {
        Row: {
          guild_id: string;
          id: string;
          joined_at: string;
          role: 'guild_master' | 'captain' | 'hunter';
          total_xp_contributed: number;
          user_id: string;
          weekly_xp_contributed: number;
        };
        Insert: {
          guild_id: string;
          id?: string;
          joined_at?: string;
          role?: 'guild_master' | 'captain' | 'hunter';
          total_xp_contributed?: number;
          user_id: string;
          weekly_xp_contributed?: number;
        };
        Update: {
          role?: 'guild_master' | 'captain' | 'hunter';
          total_xp_contributed?: number;
          weekly_xp_contributed?: number;
        };
        Relationships: [];
      };
      guild_activity: {
        Row: {
          amount: number;
          created_at: string;
          description: string;
          guild_id: string;
          id: string;
          type: string;
          user_id: string;
        };
        Insert: {
          amount?: number;
          created_at?: string;
          description: string;
          guild_id: string;
          id?: string;
          type: string;
          user_id: string;
        };
        Update: never;
        Relationships: [];
      };
      guild_bosses: {
        Row: {
          created_by: string;
          current_hp: number;
          ends_at: string;
          guild_id: string;
          id: string;
          max_hp: number;
          name: string;
          started_at: string;
          status: 'active' | 'defeated' | 'expired';
        };
        Insert: {
          created_by: string;
          current_hp: number;
          ends_at: string;
          guild_id: string;
          id?: string;
          max_hp: number;
          name: string;
          started_at?: string;
          status?: 'active' | 'defeated' | 'expired';
        };
        Update: {
          current_hp?: number;
          status?: 'active' | 'defeated' | 'expired';
        };
        Relationships: [];
      };
      guild_boss_contributions: {
        Row: {
          boss_id: string;
          created_at: string;
          damage: number;
          id: string;
          source_challenge_id: string | null;
          user_id: string;
        };
        Insert: {
          boss_id: string;
          created_at?: string;
          damage: number;
          id?: string;
          source_challenge_id?: string | null;
          user_id: string;
        };
        Update: never;
        Relationships: [];
      };
      guild_projects: {
        Row: {
          completed_at: string | null;
          created_at: string;
          description: string | null;
          guild_id: string;
          id: string;
          name: string;
          status: 'active' | 'completed';
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          guild_id: string;
          id?: string;
          name: string;
          status?: 'active' | 'completed';
        };
        Update: {
          completed_at?: string | null;
          status?: 'active' | 'completed';
        };
        Relationships: [];
      };
      guild_project_requirements: {
        Row: {
          category: string;
          current_amount: number;
          id: string;
          project_id: string;
          required_amount: number;
        };
        Insert: {
          category: string;
          current_amount?: number;
          id?: string;
          project_id: string;
          required_amount: number;
        };
        Update: {
          current_amount?: number;
        };
        Relationships: [];
      };
      guild_messages: {
        Row: {
          body: string;
          created_at: string;
          guild_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          guild_id: string;
          id?: string;
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
    Functions: {
      get_user_leaderboard: {
        Args: { limit_count?: number };
        Returns: Array<{
          avatar_url: string | null;
          created_at: string;
          current_rank: string;
          id: string;
          leaderboard_position: number;
          streak_count: number;
          total_xp: number;
          username: string | null;
        }>;
      };
      get_guild_leaderboard: {
        Args: { limit_count?: number };
        Returns: Array<{
          created_at: string;
          description: string | null;
          emblem_url: string | null;
          id: string;
          level: number;
          member_count: number;
          member_limit: number;
          name: string;
          leaderboard_position: number;
          total_xp: number;
        }>;
      };
      get_my_leaderboard_position: {
        Args: Record<string, never>;
        Returns: Array<{
          guild_id: string | null;
          guild_name: string | null;
          guild_position: number | null;
          guild_total_xp: number | null;
          user_position: number;
          user_total_xp: number;
        }>;
      };
      get_public_user_detail: {
        Args: { profile_id: string };
        Returns: Array<{
          avatar_url: string | null;
          created_at: string;
          current_rank: string;
          guild_id: string | null;
          guild_joined_at: string | null;
          guild_level: number | null;
          guild_name: string | null;
          guild_position: number | null;
          guild_role: string | null;
          guild_total_xp: number | null;
          guild_total_xp_contributed: number | null;
          id: string;
          leaderboard_position: number;
          streak_count: number;
          total_xp: number;
          username: string | null;
        }>;
      };
      get_public_guild_detail: {
        Args: { target_guild_id: string };
        Returns: Array<{
          created_at: string;
          created_by: string;
          description: string | null;
          emblem_url: string | null;
          id: string;
          level: number;
          member_count: number;
          member_limit: number;
          name: string;
          leaderboard_position: number;
          total_xp: number;
        }>;
      };
      get_public_guild_members: {
        Args: { limit_count?: number; target_guild_id: string };
        Returns: Array<{
          avatar_url: string | null;
          current_rank: string;
          joined_at: string;
          leaderboard_position: number;
          role: string;
          total_xp: number;
          total_xp_contributed: number;
          user_id: string;
          username: string | null;
          weekly_xp_contributed: number;
        }>;
      };
      get_unlocked_achievement_ids: {
        Args: Record<string, never>;
        Returns: Array<{
          achievement_id: string;
        }>;
      };
      claim_achievement: {
        Args: { target_achievement_id: string };
        Returns: {
          achievement_id: string;
          claimed_at: string;
          essence_reward: number;
          id: string;
          reward_item_id: string | null;
          user_id: string;
        };
      };
      activate_inventory_item: {
        Args: { target_item_id: string; target_option?: string | null };
        Returns: {
          activated_at: string;
          consumed_at: string | null;
          expires_at: string | null;
          id: string;
          item_id: string;
          metadata: Json;
          user_id: string;
        };
      };
      purchase_shop_item: {
        Args: { target_item_id: string; configured_cost?: number | null };
        Returns: {
          cost_paid: number;
          id: string;
          item_id: string;
          purchased_at: string;
          user_id: string;
        };
      };
      choose_hunter_legacy_path: {
        Args: { target_path: string };
        Returns: {
          avatar_url: string | null;
          created_at: string;
          current_rank: string;
          essence_balance: number;
          id: string;
          legacy_path: string | null;
          onboarding_completed: boolean;
          streak_count: number;
          total_xp: number;
          username: string | null;
        };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
