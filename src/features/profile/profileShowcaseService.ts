import { supabase } from '@/lib/supabaseClient';

const TRIAL_SOURCE_ITEM_IDS = ['trial-of-ascension', 'legendary-trial', 'mythic-trial'] as const;
const BOSS_SOURCE_ITEM_IDS = ['goblin-kings-gate-key', 'deep-work-gate-key', 'iron-trial-key', 'master-boss-key'] as const;

export interface ProfileShowcaseStats {
  achievementCount: number;
  bossChallengeClears: number;
  guildBossVictories: number;
  legacyChallengeClears: number;
  trialClears: number;
}

export async function getProfileShowcaseStats(userId: string): Promise<ProfileShowcaseStats> {
  const [
    { count: achievementCount, error: achievementError },
    { data: specialChallenges, error: challengeError },
    { data: completions, error: completionError },
    { data: bossContributions, error: contributionError },
    { data: guildBosses, error: guildBossError },
  ] = await Promise.all([
    supabase.from('user_achievements').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('challenges')
      .select('id, source_item_id')
      .in('source_item_id', [...TRIAL_SOURCE_ITEM_IDS, ...BOSS_SOURCE_ITEM_IDS, 'hunter-legacy']),
    supabase.from('user_challenges').select('challenge_id').eq('user_id', userId).eq('status', 'completed'),
    supabase.from('guild_boss_contributions').select('boss_id').eq('user_id', userId),
    supabase.from('guild_bosses').select('id, status'),
  ]);

  if (achievementError) {
    throw achievementError;
  }

  if (challengeError) {
    throw challengeError;
  }

  if (completionError) {
    throw completionError;
  }

  if (contributionError) {
    throw contributionError;
  }

  if (guildBossError) {
    throw guildBossError;
  }

  const sourceItemByChallengeId = new Map((specialChallenges ?? []).map((challenge) => [challenge.id, challenge.source_item_id]));
  let trialClears = 0;
  let bossChallengeClears = 0;
  let legacyChallengeClears = 0;

  for (const completion of completions ?? []) {
    const sourceItemId = sourceItemByChallengeId.get(completion.challenge_id);

    if (!sourceItemId) {
      continue;
    }

    if (TRIAL_SOURCE_ITEM_IDS.includes(sourceItemId as (typeof TRIAL_SOURCE_ITEM_IDS)[number])) {
      trialClears += 1;
    } else if (BOSS_SOURCE_ITEM_IDS.includes(sourceItemId as (typeof BOSS_SOURCE_ITEM_IDS)[number])) {
      bossChallengeClears += 1;
    } else if (sourceItemId === 'hunter-legacy') {
      legacyChallengeClears += 1;
    }
  }

  const defeatedBossIds = new Set((guildBosses ?? []).filter((boss) => boss.status === 'defeated').map((boss) => boss.id));
  const guildBossVictories = new Set((bossContributions ?? []).map((contribution) => contribution.boss_id).filter((bossId) => defeatedBossIds.has(bossId))).size;

  return {
    achievementCount: achievementCount ?? 0,
    bossChallengeClears,
    guildBossVictories,
    legacyChallengeClears,
    trialClears,
  };
}
