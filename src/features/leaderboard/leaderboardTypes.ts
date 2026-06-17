import type { Database } from '@/types/database';

export type UserLeaderboardEntry = Database['public']['Functions']['get_user_leaderboard']['Returns'][number];
export type GuildLeaderboardEntry = Database['public']['Functions']['get_guild_leaderboard']['Returns'][number];
export type LeaderboardPlacement = Database['public']['Functions']['get_my_leaderboard_position']['Returns'][number];
export type PublicUserDetail = Database['public']['Functions']['get_public_user_detail']['Returns'][number];
export type PublicGuildDetail = Database['public']['Functions']['get_public_guild_detail']['Returns'][number];
export type PublicGuildMember = Database['public']['Functions']['get_public_guild_members']['Returns'][number];
