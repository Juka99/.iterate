import { supabase } from '@/lib/supabaseClient';
import type {
  GuildLeaderboardEntry,
  LeaderboardPlacement,
  PublicGuildDetail,
  PublicGuildMember,
  PublicUserDetail,
  UserLeaderboardEntry,
} from './leaderboardTypes';

function getFirstRow<T>(rows: T[] | null, missingMessage: string) {
  const row = rows?.[0] ?? null;

  if (!row) {
    throw new Error(missingMessage);
  }

  return row;
}

export async function getUserLeaderboard(limit = 50): Promise<UserLeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_user_leaderboard', { limit_count: limit });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getGuildLeaderboard(limit = 50): Promise<GuildLeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_guild_leaderboard', { limit_count: limit });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getMyLeaderboardPlacement(): Promise<LeaderboardPlacement> {
  const { data, error } = await supabase.rpc('get_my_leaderboard_position', {});

  if (error) {
    throw error;
  }

  return getFirstRow(data, 'Your leaderboard position could not be found yet.');
}

export async function getPublicUserDetail(userId: string): Promise<PublicUserDetail> {
  const { data, error } = await supabase.rpc('get_public_user_detail', { profile_id: userId });

  if (error) {
    throw error;
  }

  return getFirstRow(data, 'That hunter could not be found.');
}

export async function getPublicGuildDetail(guildId: string): Promise<PublicGuildDetail> {
  const { data, error } = await supabase.rpc('get_public_guild_detail', { target_guild_id: guildId });

  if (error) {
    throw error;
  }

  return getFirstRow(data, 'That guild could not be found.');
}

export async function getPublicGuildMembers(guildId: string, limit = 12): Promise<PublicGuildMember[]> {
  const { data, error } = await supabase.rpc('get_public_guild_members', {
    limit_count: limit,
    target_guild_id: guildId,
  });

  if (error) {
    throw error;
  }

  return data ?? [];
}
