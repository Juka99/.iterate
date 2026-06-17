import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGuild, demoteGuildMember, joinGuild, leaveGuild, promoteGuildMember, removeGuildMember, startGuildBoss, startGuildProject } from '../guildService';
import type { CreateGuildInput, GuildMember, GuildOverview, GuildRole } from '../guildTypes';

function useInvalidateGuildData(userId?: string) {
  const queryClient = useQueryClient();

  return () => {
    if (userId) {
      void queryClient.invalidateQueries({ queryKey: ['guild', userId] });
      void queryClient.invalidateQueries({ queryKey: ['achievements', userId] });
    }

    void queryClient.invalidateQueries({ queryKey: ['joinable-guilds'] });
  };
}

function updateCachedGuildMemberRole(queryClient: ReturnType<typeof useQueryClient>, userId: string | undefined, memberId: string, role: GuildRole) {
  if (!userId) {
    return;
  }

  queryClient.setQueryData<GuildOverview | null>(['guild', userId], (overview) => {
    if (!overview) {
      return overview;
    }

    return {
      ...overview,
      members: overview.members.map((member) => (member.id === memberId ? { ...member, role } : member)),
    };
  });
}

function removeCachedGuildMember(queryClient: ReturnType<typeof useQueryClient>, userId: string | undefined, memberId: string) {
  if (!userId) {
    return;
  }

  queryClient.setQueryData<GuildOverview | null>(['guild', userId], (overview) => {
    if (!overview) {
      return overview;
    }

    return {
      ...overview,
      members: overview.members.filter((member) => member.id !== memberId),
    };
  });
}

export function useCreateGuild(userId?: string) {
  const invalidate = useInvalidateGuildData(userId);

  return useMutation({
    mutationFn: (input: CreateGuildInput) => createGuild(userId as string, input),
    onSuccess: invalidate,
  });
}

export function useJoinGuild(userId?: string) {
  const invalidate = useInvalidateGuildData(userId);

  return useMutation({
    mutationFn: (guildId: string) => joinGuild(userId as string, guildId),
    onSuccess: invalidate,
  });
}

export function useLeaveGuild(userId?: string) {
  const invalidate = useInvalidateGuildData(userId);

  return useMutation({
    mutationFn: (overview: GuildOverview) => leaveGuild(userId as string, overview),
    onSuccess: invalidate,
  });
}

export function useStartGuildBoss(userId?: string) {
  const invalidate = useInvalidateGuildData(userId);

  return useMutation({
    mutationFn: (guildId: string) => startGuildBoss(userId as string, guildId),
    onSuccess: invalidate,
  });
}

export function useStartGuildProject(userId?: string) {
  const invalidate = useInvalidateGuildData(userId);

  return useMutation({
    mutationFn: (guildId: string) => startGuildProject(userId as string, guildId),
    onSuccess: invalidate,
  });
}

export function usePromoteGuildMember(userId?: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateGuildData(userId);

  return useMutation({
    mutationFn: (member: GuildMember) => promoteGuildMember(userId as string, member),
    onSuccess: (_result, member) => {
      updateCachedGuildMemberRole(queryClient, userId, member.id, 'captain');
      invalidate();
    },
  });
}

export function useDemoteGuildMember(userId?: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateGuildData(userId);

  return useMutation({
    mutationFn: (member: GuildMember) => demoteGuildMember(userId as string, member),
    onSuccess: (_result, member) => {
      updateCachedGuildMemberRole(queryClient, userId, member.id, 'hunter');
      invalidate();
    },
  });
}

export function useRemoveGuildMember(userId?: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateGuildData(userId);

  return useMutation({
    mutationFn: (member: GuildMember) => removeGuildMember(userId as string, member),
    onSuccess: (_result, member) => {
      removeCachedGuildMember(queryClient, userId, member.id);
      invalidate();
    },
  });
}
