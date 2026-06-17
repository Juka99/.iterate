import { useQuery } from '@tanstack/react-query';
import {
  getGuildLeaderboard,
  getMyLeaderboardPlacement,
  getPublicGuildDetail,
  getPublicGuildMembers,
  getPublicUserDetail,
  getUserLeaderboard,
} from '../leaderboardService';

export function useUserLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard', 'users'],
    queryFn: () => getUserLeaderboard(50),
  });
}

export function useGuildLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard', 'guilds'],
    queryFn: () => getGuildLeaderboard(50),
  });
}

export function useMyLeaderboardPlacement(enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: ['leaderboard', 'me'],
    queryFn: getMyLeaderboardPlacement,
  });
}

export function useLeaderboardUser(userId?: string) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ['leaderboard', 'users', userId],
    queryFn: () => getPublicUserDetail(userId as string),
  });
}

export function useLeaderboardGuild(guildId?: string) {
  return useQuery({
    enabled: Boolean(guildId),
    queryKey: ['leaderboard', 'guilds', guildId],
    queryFn: () => getPublicGuildDetail(guildId as string),
  });
}

export function useLeaderboardGuildMembers(guildId?: string) {
  return useQuery({
    enabled: Boolean(guildId),
    queryKey: ['leaderboard', 'guilds', guildId, 'members'],
    queryFn: () => getPublicGuildMembers(guildId as string, 12),
  });
}
