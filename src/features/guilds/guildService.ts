import { supabase } from '@/lib/supabaseClient';
import type { Challenge } from '@/types/challenge';
import type {
  CreateGuildInput,
  Guild,
  GuildActivityWithProfile,
  GuildLevelProgress,
  GuildMessageWithProfile,
  GuildMember,
  GuildMemberProfile,
  GuildMemberWithProfile,
  GuildOverview,
  GuildProjectWithRequirements,
  JoinableGuild,
} from './guildTypes';

const GUILD_LEVEL_THRESHOLDS = [0, 1000, 3000, 7500, 15000, 30000, 60000, 100000, 175000, 300000];
const DEFAULT_GUILD_MEMBER_LIMIT = 10;
const MEMBER_LIMIT_PER_LEVEL = 2;

function getDayWindowStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
}

function getMemberLimitForLevel(level: number) {
  return DEFAULT_GUILD_MEMBER_LIMIT + Math.max(level - 1, 0) * MEMBER_LIMIT_PER_LEVEL;
}

export function getGuildLevelForXp(totalXp: number) {
  let level = 1;

  for (let index = 0; index < GUILD_LEVEL_THRESHOLDS.length; index += 1) {
    if (totalXp >= GUILD_LEVEL_THRESHOLDS[index]) {
      level = index + 1;
    }
  }

  return level;
}

export function getGuildLevelProgress(totalXp: number): GuildLevelProgress {
  const currentLevel = getGuildLevelForXp(totalXp);
  const currentThreshold = GUILD_LEVEL_THRESHOLDS[currentLevel - 1] ?? 0;
  const nextThreshold = GUILD_LEVEL_THRESHOLDS[currentLevel] ?? null;

  if (nextThreshold === null) {
    return {
      currentLevel,
      nextLevel: null,
      progressMax: totalXp,
      progressValue: totalXp,
      xpToNext: 0,
    };
  }

  return {
    currentLevel,
    nextLevel: currentLevel + 1,
    progressMax: nextThreshold - currentThreshold,
    progressValue: Math.max(totalXp - currentThreshold, 0),
    xpToNext: Math.max(nextThreshold - totalXp, 0),
  };
}

function getBossDamageForChallenge(challenge: Challenge) {
  return {
    easy: 25,
    hard: 100,
    medium: 50,
  }[challenge.difficulty];
}

async function getUserMembership(userId: string) {
  const { data, error } = await supabase.from('guild_members').select('*').eq('user_id', userId).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getMemberCount(guildId: string) {
  const { count, error } = await supabase
    .from('guild_members')
    .select('id', { count: 'exact', head: true })
    .eq('guild_id', guildId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function getProfilesByUserId(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, GuildMemberProfile>();
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, total_xp, current_rank, streak_count')
    .in('id', userIds);

  if (error) {
    throw error;
  }

  return new Map(data.map((profile) => [profile.id, profile]));
}

async function getMemberDisplayName(member: GuildMember) {
  const profilesByUserId = await getProfilesByUserId([member.user_id]);
  const profile = profilesByUserId.get(member.user_id);

  return profile?.username || `Hunter ${member.user_id.slice(0, 6)}`;
}

async function getCompletedChallengeCountsToday(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, number>();
  }

  const { data, error } = await supabase
    .from('user_challenges')
    .select('user_id')
    .eq('status', 'completed')
    .gte('completed_at', getDayWindowStart())
    .in('user_id', userIds);

  if (error) {
    throw error;
  }

  return data.reduce((counts, completion) => {
    counts.set(completion.user_id, (counts.get(completion.user_id) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
}

async function getLastActivityByUserId(guildId: string, userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase
    .from('guild_activity')
    .select('user_id, created_at')
    .eq('guild_id', guildId)
    .in('user_id', userIds)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const lastActivityByUserId = new Map<string, string>();

  for (const activity of data) {
    if (!lastActivityByUserId.has(activity.user_id)) {
      lastActivityByUserId.set(activity.user_id, activity.created_at);
    }
  }

  return lastActivityByUserId;
}

async function getGuildMembers(guildId: string): Promise<GuildMemberWithProfile[]> {
  const { data: members, error } = await supabase
    .from('guild_members')
    .select('*')
    .eq('guild_id', guildId)
    .order('total_xp_contributed', { ascending: false });

  if (error) {
    throw error;
  }

  const userIds = members.map((member) => member.user_id);
  const [profilesByUserId, completionsByUserId, lastActivityByUserId] = await Promise.all([
    getProfilesByUserId(userIds),
    getCompletedChallengeCountsToday(userIds),
    getLastActivityByUserId(guildId, userIds),
  ]);

  return members.map((member) => ({
    ...member,
    challengesCompletedToday: completionsByUserId.get(member.user_id) ?? 0,
    lastActive: lastActivityByUserId.get(member.user_id) ?? null,
    profile: profilesByUserId.get(member.user_id) ?? null,
  }));
}

async function getGuildActivity(guildId: string): Promise<GuildActivityWithProfile[]> {
  const { data: activity, error } = await supabase
    .from('guild_activity')
    .select('*')
    .eq('guild_id', guildId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  const profilesByUserId = await getProfilesByUserId(activity.map((item) => item.user_id));

  return activity.map((item) => ({
    ...item,
    profile: profilesByUserId.get(item.user_id) ?? null,
  }));
}

async function getActiveGuildBoss(guildId: string) {
  const { data, error } = await supabase
    .from('guild_bosses')
    .select('*')
    .eq('guild_id', guildId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getActiveGuildProject(guildId: string): Promise<GuildProjectWithRequirements | null> {
  const { data: project, error } = await supabase
    .from('guild_projects')
    .select('*')
    .eq('guild_id', guildId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!project) {
    return null;
  }

  const { data: requirements, error: requirementsError } = await supabase
    .from('guild_project_requirements')
    .select('*')
    .eq('project_id', project.id)
    .order('category', { ascending: true });

  if (requirementsError) {
    throw requirementsError;
  }

  return { ...project, requirements };
}

export async function getGuildOverview(userId: string): Promise<GuildOverview | null> {
  const membership = await getUserMembership(userId);

  if (!membership) {
    return null;
  }

  const { data: guild, error } = await supabase.from('guilds').select('*').eq('id', membership.guild_id).single();

  if (error) {
    throw error;
  }

  const [members, activity, boss, project] = await Promise.all([
    getGuildMembers(guild.id),
    getGuildActivity(guild.id),
    getActiveGuildBoss(guild.id),
    getActiveGuildProject(guild.id),
  ]);

  return { activity, boss, guild, members, membership, project };
}

export async function getGuildMessages(guildId: string): Promise<GuildMessageWithProfile[]> {
  const { data: messages, error } = await supabase
    .from('guild_messages')
    .select('*')
    .eq('guild_id', guildId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  const orderedMessages = [...messages].reverse();
  const profilesByUserId = await getProfilesByUserId(orderedMessages.map((message) => message.user_id));

  return orderedMessages.map((message) => ({
    ...message,
    profile: profilesByUserId.get(message.user_id) ?? null,
  }));
}

export async function sendGuildMessage(userId: string, guildId: string, body: string) {
  const trimmedBody = body.trim();

  if (!trimmedBody) {
    throw new Error('Write a message before sending.');
  }

  const { data, error } = await supabase
    .from('guild_messages')
    .insert({
      body: trimmedBody,
      guild_id: guildId,
      user_id: userId,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getJoinableGuilds(limit = 12): Promise<JoinableGuild[]> {
  const { data: guilds, error } = await supabase
    .from('guilds')
    .select('*')
    .order('total_xp', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const memberCounts = await Promise.all(guilds.map((guild) => getMemberCount(guild.id)));

  return guilds.map((guild, index) => ({
    ...guild,
    memberCount: memberCounts[index] ?? 0,
  }));
}

export async function createGuild(userId: string, input: CreateGuildInput) {
  const existingMembership = await getUserMembership(userId);

  if (existingMembership) {
    throw new Error('Leave your current guild before founding a new one.');
  }

  const { data: guild, error } = await supabase
    .from('guilds')
    .insert({
      created_by: userId,
      description: input.description.trim() || null,
      emblem_url: input.emblemUrl?.trim() || null,
      member_limit: DEFAULT_GUILD_MEMBER_LIMIT,
      name: input.name.trim(),
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  const { error: memberError } = await supabase.from('guild_members').insert({
    guild_id: guild.id,
    role: 'guild_master',
    user_id: userId,
  });

  if (memberError) {
    throw memberError;
  }

  await supabase.from('guild_activity').insert({
    amount: 0,
    description: `${guild.name} was founded.`,
    guild_id: guild.id,
    type: 'guild_created',
    user_id: userId,
  });

  return guild;
}

export async function joinGuild(userId: string, guildId: string) {
  const existingMembership = await getUserMembership(userId);

  if (existingMembership) {
    throw new Error('Leave your current guild before joining another one.');
  }

  const { data: guild, error } = await supabase.from('guilds').select('*').eq('id', guildId).single();

  if (error) {
    throw error;
  }

  const memberCount = await getMemberCount(guild.id);

  if (memberCount >= guild.member_limit) {
    throw new Error(`${guild.name} is currently full.`);
  }

  const { error: memberError } = await supabase.from('guild_members').insert({
    guild_id: guild.id,
    role: 'hunter',
    user_id: userId,
  });

  if (memberError) {
    throw memberError;
  }

  await supabase.from('guild_activity').insert({
    amount: 0,
    description: 'A new hunter joined the guild.',
    guild_id: guild.id,
    type: 'member_joined',
    user_id: userId,
  });

  return guild;
}

export async function leaveGuild(userId: string, overview: GuildOverview) {
  if (overview.membership.role === 'guild_master' && overview.members.length > 1) {
    throw new Error('Promote another member before leaving as Guild Master.');
  }

  if (overview.membership.role === 'guild_master') {
    const { error } = await supabase.from('guilds').delete().eq('id', overview.guild.id);

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase.from('guild_members').delete().eq('user_id', userId);

  if (error) {
    throw error;
  }
}

export async function promoteGuildMember(userId: string, member: GuildMember) {
  if (member.user_id === userId) {
    throw new Error('You cannot promote yourself.');
  }

  if (member.role !== 'hunter') {
    throw new Error('Only Hunters can be promoted to Captain.');
  }

  const { error } = await supabase.from('guild_members').update({ role: 'captain' }).eq('id', member.id);

  if (error) {
    throw error;
  }

  const memberName = await getMemberDisplayName(member);

  await supabase.from('guild_activity').insert({
    amount: 0,
    description: `${memberName} was promoted to Captain.`,
    guild_id: member.guild_id,
    type: 'member_promoted',
    user_id: userId,
  });
}

export async function demoteGuildMember(userId: string, member: GuildMember) {
  if (member.user_id === userId) {
    throw new Error('You cannot demote yourself.');
  }

  if (member.role !== 'captain') {
    throw new Error('Only Captains can be demoted to Hunter.');
  }

  const { error } = await supabase.from('guild_members').update({ role: 'hunter' }).eq('id', member.id);

  if (error) {
    throw error;
  }

  const memberName = await getMemberDisplayName(member);

  await supabase.from('guild_activity').insert({
    amount: 0,
    description: `${memberName} was demoted to Hunter.`,
    guild_id: member.guild_id,
    type: 'member_demoted',
    user_id: userId,
  });
}

export async function removeGuildMember(userId: string, member: GuildMember) {
  if (member.user_id === userId) {
    throw new Error('Use Leave Guild if you want to remove yourself.');
  }

  if (member.role === 'guild_master') {
    throw new Error('The Guild Master cannot be removed.');
  }

  const { error } = await supabase.from('guild_members').delete().eq('id', member.id);

  if (error) {
    throw error;
  }

  const memberName = await getMemberDisplayName(member);

  await supabase.from('guild_activity').insert({
    amount: 0,
    description: `${memberName} was removed from the guild.`,
    guild_id: member.guild_id,
    type: 'member_removed',
    user_id: userId,
  });
}

export async function startGuildBoss(userId: string, guildId: string) {
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + 7);

  const { data: boss, error } = await supabase
    .from('guild_bosses')
    .insert({
      created_by: userId,
      current_hp: 50000,
      ends_at: endsAt.toISOString(),
      guild_id: guildId,
      max_hp: 50000,
      name: 'Procrastination Beast',
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  await supabase.from('guild_activity').insert({
    amount: boss.max_hp,
    description: `${boss.name} has entered the guild hall.`,
    guild_id: guildId,
    type: 'boss_started',
    user_id: userId,
  });

  return boss;
}

export async function startGuildProject(userId: string, guildId: string) {
  const { data: project, error } = await supabase
    .from('guild_projects')
    .insert({
      description: 'Build a shared forge powered by Focus, Health, and Growth victories.',
      guild_id: guildId,
      name: 'Build the Sky Forge',
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  const { error: requirementsError } = await supabase.from('guild_project_requirements').insert([
    { category: 'Focus', project_id: project.id, required_amount: 100 },
    { category: 'Health', project_id: project.id, required_amount: 100 },
    { category: 'Growth', project_id: project.id, required_amount: 50 },
  ]);

  if (requirementsError) {
    throw requirementsError;
  }

  await supabase.from('guild_activity').insert({
    amount: 0,
    description: `${project.name} has begun.`,
    guild_id: guildId,
    type: 'project_started',
    user_id: userId,
  });

  return project;
}

async function contributeToActiveBoss(userId: string, guildId: string, challenge: Challenge) {
  const boss = await getActiveGuildBoss(guildId);

  if (!boss) {
    return;
  }

  const damage = getBossDamageForChallenge(challenge);
  const nextHp = Math.max(boss.current_hp - damage, 0);

  await supabase.from('guild_boss_contributions').insert({
    boss_id: boss.id,
    damage,
    source_challenge_id: challenge.id,
    user_id: userId,
  });

  await supabase
    .from('guild_bosses')
    .update({ current_hp: nextHp, status: nextHp === 0 ? 'defeated' : 'active' })
    .eq('id', boss.id);

  if (nextHp === 0) {
    await supabase.from('guild_activity').insert({
      amount: boss.max_hp,
      description: `${boss.name} was defeated.`,
      guild_id: guildId,
      type: 'boss_defeated',
      user_id: userId,
    });
  }
}

async function contributeToActiveProject(userId: string, guildId: string, challenge: Challenge) {
  const project = await getActiveGuildProject(guildId);

  if (!project) {
    return;
  }

  const matchingRequirement = project.requirements.find((requirement) => requirement.category === challenge.category);

  if (!matchingRequirement) {
    return;
  }

  const nextAmount = Math.min(matchingRequirement.current_amount + 1, matchingRequirement.required_amount);
  const nextRequirements = project.requirements.map((requirement) =>
    requirement.id === matchingRequirement.id ? { ...requirement, current_amount: nextAmount } : requirement,
  );
  const isProjectComplete = nextRequirements.every((requirement) => requirement.current_amount >= requirement.required_amount);

  await supabase
    .from('guild_project_requirements')
    .update({ current_amount: nextAmount })
    .eq('id', matchingRequirement.id);

  if (isProjectComplete) {
    await supabase
      .from('guild_projects')
      .update({ completed_at: new Date().toISOString(), status: 'completed' })
      .eq('id', project.id);

    await supabase.from('guild_activity').insert({
      amount: 0,
      description: `${project.name} was completed.`,
      guild_id: guildId,
      type: 'project_completed',
      user_id: userId,
    });
  }
}

export async function contributeGuildProgressFromChallenge(userId: string, challenge: Challenge) {
  const membership = await getUserMembership(userId);

  if (!membership) {
    return null;
  }

  const { data: guild, error } = await supabase.from('guilds').select('*').eq('id', membership.guild_id).single();

  if (error) {
    throw error;
  }

  const guildXp = Math.max(Math.floor(challenge.xp_reward * 0.2), 1);
  const nextGuildXp = guild.total_xp + guildXp;
  const nextGuildLevel = getGuildLevelForXp(nextGuildXp);

  await supabase
    .from('guilds')
    .update({
      level: nextGuildLevel,
      member_limit: getMemberLimitForLevel(nextGuildLevel),
      total_xp: nextGuildXp,
    })
    .eq('id', guild.id);

  await supabase
    .from('guild_members')
    .update({
      total_xp_contributed: membership.total_xp_contributed + guildXp,
      weekly_xp_contributed: membership.weekly_xp_contributed + guildXp,
    })
    .eq('id', membership.id);

  await supabase.from('guild_activity').insert({
    amount: guildXp,
    description: `Completed ${challenge.title} and contributed ${guildXp} Guild XP.`,
    guild_id: guild.id,
    type: 'challenge_contribution',
    user_id: userId,
  });

  await Promise.all([
    contributeToActiveBoss(userId, guild.id, challenge),
    contributeToActiveProject(userId, guild.id, challenge),
  ]);

  return { guildId: guild.id, guildXp };
}
