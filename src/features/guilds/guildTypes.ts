import type { Database } from '@/types/database';

export type Guild = Database['public']['Tables']['guilds']['Row'];
export type GuildActivity = Database['public']['Tables']['guild_activity']['Row'];
export type GuildBoss = Database['public']['Tables']['guild_bosses']['Row'];
export type GuildMessage = Database['public']['Tables']['guild_messages']['Row'];
export type GuildMember = Database['public']['Tables']['guild_members']['Row'];
export type GuildProject = Database['public']['Tables']['guild_projects']['Row'];
export type GuildProjectRequirement = Database['public']['Tables']['guild_project_requirements']['Row'];
export type GuildRole = GuildMember['role'];

export interface GuildLevelProgress {
  currentLevel: number;
  nextLevel: number | null;
  progressMax: number;
  progressValue: number;
  xpToNext: number;
}

export interface GuildMemberProfile {
  avatar_url: string | null;
  current_rank: string;
  id: string;
  streak_count: number;
  total_xp: number;
  username: string | null;
}

export interface GuildMemberWithProfile extends GuildMember {
  challengesCompletedToday: number;
  lastActive: string | null;
  profile: GuildMemberProfile | null;
}

export interface GuildActivityWithProfile extends GuildActivity {
  profile: Pick<GuildMemberProfile, 'avatar_url' | 'id' | 'username'> | null;
}

export interface GuildMessageWithProfile extends GuildMessage {
  profile: Pick<GuildMemberProfile, 'avatar_url' | 'id' | 'username'> | null;
}

export interface JoinableGuild extends Guild {
  memberCount: number;
}

export interface GuildProjectWithRequirements extends GuildProject {
  requirements: GuildProjectRequirement[];
}

export interface GuildOverview {
  activity: GuildActivityWithProfile[];
  boss: GuildBoss | null;
  guild: Guild;
  members: GuildMemberWithProfile[];
  membership: GuildMember;
  project: GuildProjectWithRequirements | null;
}

export interface CreateGuildInput {
  description: string;
  emblemUrl?: string;
  name: string;
}
