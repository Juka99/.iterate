import { supabase } from '@/lib/supabaseClient';
import { getRankForXp } from '@/features/ranks/rankUtils';
import { contributeGuildProgressFromChallenge } from '@/features/guilds/guildService';
import { synchronizeItemActivationState } from './itemActivationState';
import { isSpecializationPath } from './specializationPaths';
import { getChallengeEssenceReward } from './challengeRewards';
import type { Challenge, ChallengeCadence, ChallengeSections, ChallengeWithCompletion, RecentActivityItem } from '@/types/challenge';
import type { Database } from '@/types/database';

type DifficultyQuota = Partial<Record<Challenge['difficulty'], number>>;
type ItemActivation = Database['public']['Tables']['user_item_activations']['Row'];

const CHALLENGE_QUOTAS: Record<ChallengeCadence, DifficultyQuota> = {
  daily: { easy: 1, medium: 1, hard: 1 },
  weekly: { easy: 4, medium: 4, hard: 2 },
  repeatable: { easy: 2, medium: 1 },
};
const BONUS_CHALLENGE_SCROLL_ITEM_ID = 'bonus-challenge-scroll';
const CHALLENGE_REROLL_TOKEN_ITEM_ID = 'challenge-reroll-token';
const ELITE_CONTRACT_ITEM_ID = 'elite-contract';
const DOUBLE_XP_SIGIL_ITEM_ID = 'double-xp-sigil';
const LUCKY_CRYSTAL_ITEM_ID = 'lucky-crystal';
const LEGENDARY_CONTRACT_ITEM_ID = 'legendary-contract';
const HUNTERS_OATH_ITEM_ID = 'hunters-oath';
const CHALLENGE_CHAIN_ITEM_ID = 'challenge-chain';
const HUNTER_LEGACY_ITEM_ID = 'hunter-legacy';
const STREAK_SHIELD_ITEM_ID = 'streak-shield';
const MOMENTUM_CRYSTAL_ITEM_ID = 'momentum-crystal';
const PROTECTION_ITEM_IDS = [MOMENTUM_CRYSTAL_ITEM_ID, STREAK_SHIELD_ITEM_ID] as const;
const SPECIAL_WEEKLY_ITEM_IDS = [
  'goblin-kings-gate-key',
  'deep-work-gate-key',
  'iron-trial-key',
  'trial-of-ascension',
  'legendary-trial',
  'mythic-trial',
  'master-boss-key',
] as const;
const SPECIAL_CHALLENGE_ITEM_IDS = [...SPECIAL_WEEKLY_ITEM_IDS, HUNTER_LEGACY_ITEM_ID] as const;
const CATEGORY_BOOST_ITEM_IDS: Partial<Record<string, string>> = {
  focus: 'focus-lens',
  growth: 'scholars-seal',
  health: 'iron-will-token',
};
const MOMENTUM_CRYSTAL_ESSENCE_BONUS = 150;

function getDayWindowStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
}

function getWeekWindowStart(date = new Date()) {
  const windowStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = windowStart.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  windowStart.setDate(windowStart.getDate() - daysSinceMonday);
  return windowStart.toISOString();
}

export function getNextDailyReset(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

export function getNextWeeklyReset(date = new Date()) {
  const reset = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = reset.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;

  reset.setDate(reset.getDate() + daysUntilMonday);
  return reset;
}

export function formatResetDistance(resetDate: Date, date = new Date()) {
  const diffMs = Math.max(resetDate.getTime() - date.getTime(), 0);
  const totalMinutes = Math.ceil(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function getCompletionWindowStart(cadence: ChallengeCadence) {
  if (cadence === 'daily') {
    return getDayWindowStart();
  }

  if (cadence === 'weekly') {
    return getWeekWindowStart();
  }

  return null;
}

function getDifficultyWeight(difficulty: Challenge['difficulty']) {
  return {
    easy: 1,
    medium: 2,
    hard: 3,
  }[difficulty];
}

function sortByChallengeComplexity(a: Challenge, b: Challenge, rankOrder: number) {
  const aRankDistance = rankOrder - a.min_rank_order;
  const bRankDistance = rankOrder - b.min_rank_order;

  return (
    aRankDistance - bRankDistance ||
    getDifficultyWeight(a.difficulty) - getDifficultyWeight(b.difficulty) ||
    a.xp_reward - b.xp_reward ||
    a.title.localeCompare(b.title)
  );
}

function isChallengeInRankRange(challenge: Challenge, rankOrder: number) {
  return challenge.min_rank_order <= rankOrder && (challenge.max_rank_order === null || challenge.max_rank_order >= rankOrder);
}

function getChallengeIdentity(challenge: Challenge) {
  return challenge.title.trim().toLowerCase();
}

function pickChallengesByDifficultyQuota(challenges: Challenge[], quota: DifficultyQuota, usedIdentities = new Set<string>()) {
  const selected: Challenge[] = [];

  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const targetCount = quota[difficulty] ?? 0;

    if (targetCount === 0) {
      continue;
    }

    const matches = challenges.filter((challenge) => challenge.difficulty === difficulty && !usedIdentities.has(getChallengeIdentity(challenge)));

    for (const challenge of matches.slice(0, targetCount)) {
      selected.push(challenge);
      usedIdentities.add(getChallengeIdentity(challenge));
    }
  }

  return selected;
}

function pickAdditionalChallenges(challenges: Challenge[], count: number, usedIdentities = new Set<string>()) {
  if (count <= 0) {
    return [];
  }

  const selected: Challenge[] = [];

  for (const challenge of challenges) {
    const identity = getChallengeIdentity(challenge);

    if (usedIdentities.has(identity)) {
      continue;
    }

    selected.push(challenge);
    usedIdentities.add(identity);

    if (selected.length >= count) {
      break;
    }
  }

  return selected;
}

function applyChallengeRerolls(selected: Challenge[], rankedChallenges: Challenge[], rerollCount: number, usedIdentities: Set<string>) {
  if (selected.length === 0 || rerollCount <= 0) {
    return selected;
  }

  const rerolled = [...selected];
  const replacementPool = rankedChallenges.filter((challenge) => !usedIdentities.has(getChallengeIdentity(challenge)));
  let replacementIndex = 0;

  for (let index = 0; index < rerollCount; index += 1) {
    const replacement = replacementPool[replacementIndex];

    if (!replacement) {
      break;
    }

    rerolled[index % rerolled.length] = replacement;
    usedIdentities.add(getChallengeIdentity(replacement));
    replacementIndex += 1;
  }

  return rerolled;
}

function applyEliteContracts(selected: Challenge[], rankedChallenges: Challenge[], contractCount: number, usedIdentities: Set<string>) {
  if (contractCount <= 0) {
    return selected;
  }

  const upgraded = [...selected];

  for (let index = 0; index < contractCount; index += 1) {
    const easyChallengeIndex = upgraded.findIndex((challenge) => challenge.difficulty === 'easy');

    if (easyChallengeIndex === -1) {
      break;
    }

    const currentChallenge = upgraded[easyChallengeIndex];
    const replacement = rankedChallenges.find(
      (challenge) =>
        !usedIdentities.has(getChallengeIdentity(challenge)) &&
        getDifficultyWeight(challenge.difficulty) > getDifficultyWeight(currentChallenge.difficulty),
    );

    if (!replacement) {
      break;
    }

    upgraded[easyChallengeIndex] = replacement;
    usedIdentities.add(getChallengeIdentity(replacement));
  }

  return upgraded;
}

function isTimedActivationActive(activation: ItemActivation, now = Date.now()) {
  return Boolean(activation.expires_at && new Date(activation.expires_at).getTime() > now);
}

function getNormalizedChallengeCategory(category: string) {
  return category.trim().toLowerCase();
}

function getCategoryBoostItemId(category: string) {
  return CATEGORY_BOOST_ITEM_IDS[getNormalizedChallengeCategory(category)] ?? null;
}

function getActivationSpecializationCategory(activation: ItemActivation | null) {
  if (!activation?.metadata || typeof activation.metadata !== 'object' || !('category' in activation.metadata)) {
    return null;
  }

  const category = activation.metadata.category;

  return typeof category === 'string' && isSpecializationPath(category) ? category : null;
}

async function getPlayerRankOrder(userId: string) {
  const { data: profile, error } = await supabase.from('profiles').select('total_xp').eq('id', userId).single();

  if (error) {
    throw error;
  }

  return getRankForXp(profile?.total_xp ?? 0).order;
}

function getChallengeWindowStart(challenges: Challenge[]) {
  const windowStarts = challenges
    .filter((challenge) => challenge.cadence !== 'repeatable')
    .map((challenge) => getCompletionWindowStart(challenge.cadence))
    .filter((windowStart): windowStart is string => Boolean(windowStart));

  if (windowStarts.length === 0) {
    return null;
  }

  return windowStarts.sort()[0];
}

function getDayKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDayDiff(previousDayKey: string, currentDayKey: string) {
  const previousDate = new Date(`${previousDayKey}T00:00:00`);
  const currentDate = new Date(`${currentDayKey}T00:00:00`);

  return Math.round((currentDate.getTime() - previousDate.getTime()) / 86400000);
}

function computeStreakFromDayKeys(dayKeys: string[]) {
  const uniqueDayKeys = Array.from(new Set(dayKeys)).sort();

  if (uniqueDayKeys.length === 0) {
    return 0;
  }

  let streak = 1;

  for (let index = uniqueDayKeys.length - 1; index > 0; index -= 1) {
    if (getDayDiff(uniqueDayKeys[index - 1], uniqueDayKeys[index]) !== 1) {
      break;
    }

    streak += 1;
  }

  return streak;
}

async function addCompletionState(userId: string, challenges: Challenge[]): Promise<ChallengeWithCompletion[]> {
  if (challenges.length === 0) {
    return [];
  }

  const windowStart = getChallengeWindowStart(challenges);

  if (!windowStart) {
    return challenges.map((challenge) => ({ ...challenge, is_completed: false }));
  }

  const { data: completions, error } = await supabase
    .from('user_challenges')
    .select('challenge_id, completed_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('completed_at', windowStart)
    .in(
      'challenge_id',
      challenges.map((challenge) => challenge.id),
    );

  if (error) {
    throw error;
  }

  const completionByChallengeId = new Map<string, string>();

  for (const completion of completions) {
    if (completion.completed_at) {
      completionByChallengeId.set(completion.challenge_id, completion.completed_at);
    }
  }

  return challenges.map((challenge) => {
    const windowStartForChallenge = getCompletionWindowStart(challenge.cadence);
    const completedAt = completionByChallengeId.get(challenge.id) ?? null;
    const isCompleted = Boolean(windowStartForChallenge && completedAt && completedAt >= windowStartForChallenge);

    return {
      ...challenge,
      completed_at: isCompleted ? completedAt : null,
      is_completed: isCompleted,
    };
  });
}

async function getRankedChallengesByCadence(cadence: ChallengeCadence, rankOrder: number): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .eq('is_special', false)
    .eq('cadence', cadence)
    .order('min_rank_order', { ascending: true })
    .order('xp_reward', { ascending: true });

  if (error) {
    throw error;
  }

  return data
    .filter((challenge) => isChallengeInRankRange(challenge, rankOrder))
    .sort((a, b) => sortByChallengeComplexity(a, b, rankOrder));
}

async function getDailyItemActivationCounts(userId: string) {
  const { data, error } = await supabase
    .from('user_item_activations')
    .select('item_id')
    .eq('user_id', userId)
    .in('item_id', [BONUS_CHALLENGE_SCROLL_ITEM_ID, CHALLENGE_REROLL_TOKEN_ITEM_ID, ELITE_CONTRACT_ITEM_ID])
    .is('consumed_at', null)
    .gte('activated_at', getDayWindowStart())
    .lt('activated_at', getNextDailyReset().toISOString());

  if (error) {
    throw error;
  }

  return (data ?? []).reduce<Record<string, number>>((counts, activation) => {
    counts[activation.item_id] = (counts[activation.item_id] ?? 0) + 1;
    return counts;
  }, {});
}

async function getPendingItemActivations(userId: string) {
  await synchronizeItemActivationState(userId);

  const { data, error } = await supabase
    .from('user_item_activations')
    .select('*')
    .eq('user_id', userId)
    .is('consumed_at', null)
    .order('activated_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getCompletedChallengeDayKeys(userId: string) {
  const { data, error } = await supabase
    .from('user_challenges')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((completion) => getDayKey(completion.completed_at as string));
}

async function getUnlockedSpecialWeeklyChallenges(userId: string) {
  return getUnlockedSpecialChallenges(userId, 'weekly');
}

async function getUnlockedSpecialChallenges(userId: string, cadence: ChallengeCadence) {
  const [activations, { data: profile, error: profileError }] = await Promise.all([
    getPendingItemActivations(userId),
    supabase.from('profiles').select('legacy_path').eq('id', userId).single(),
  ]);

  if (profileError) {
    throw profileError;
  }

  const now = Date.now();
  const unlockedItemIds = activations
    .filter((activation) => SPECIAL_CHALLENGE_ITEM_IDS.includes(activation.item_id as (typeof SPECIAL_CHALLENGE_ITEM_IDS)[number]))
    .filter((activation) => !isActivationExpired(activation, now))
    .map((activation) => activation.item_id);

  if (unlockedItemIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .eq('is_special', true)
    .eq('cadence', cadence)
    .in('source_item_id', unlockedItemIds)
    .order('xp_reward', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).filter((challenge) => {
    if (challenge.source_item_id !== HUNTER_LEGACY_ITEM_ID) {
      return true;
    }

    return Boolean(profile?.legacy_path) && getNormalizedChallengeCategory(challenge.category) === getNormalizedChallengeCategory(profile?.legacy_path ?? '');
  });
}

function isActivationExpired(activation: ItemActivation, now = Date.now()) {
  return Boolean(activation.expires_at && new Date(activation.expires_at).getTime() <= now);
}

async function getActivationCompletionCounts(userId: string, activationIds: string[]) {
  if (activationIds.length === 0) {
    return new Map<string, number>();
  }

  const { data, error } = await supabase
    .from('user_challenges')
    .select('applied_item_activation_ids')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .overlaps('applied_item_activation_ids', activationIds);

  if (error) {
    throw error;
  }

  const counts = new Map<string, number>();

  for (const activationId of activationIds) {
    counts.set(activationId, 0);
  }

  for (const completion of data ?? []) {
    for (const activationId of completion.applied_item_activation_ids) {
      if (counts.has(activationId)) {
        counts.set(activationId, (counts.get(activationId) ?? 0) + 1);
      }
    }
  }

  return counts;
}

async function getOathProgress(userId: string, activationId: string) {
  const { data: completions, error } = await supabase
    .from('user_challenges')
    .select('challenge_id, completed_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .contains('applied_item_activation_ids', [activationId])
    .order('completed_at', { ascending: true });

  if (error) {
    throw error;
  }

  if (!completions || completions.length === 0) {
    return { lastProgressDay: null, targetCategory: null };
  }

  const challengeIds = completions.map((completion) => completion.challenge_id);
  const { data: challenges, error: challengeError } = await supabase
    .from('challenges')
    .select('id, category')
    .in('id', challengeIds);

  if (challengeError) {
    throw challengeError;
  }

  const categoryByChallengeId = new Map(challenges.map((trackedChallenge) => [trackedChallenge.id, trackedChallenge.category]));
  const firstCompletion = completions[0];
  const lastCompletion = completions[completions.length - 1];

  return {
    lastProgressDay: lastCompletion?.completed_at ? getDayKey(lastCompletion.completed_at) : null,
    targetCategory: firstCompletion ? categoryByChallengeId.get(firstCompletion.challenge_id) ?? null : null,
  };
}

async function getCompletionRewardSnapshot(userId: string, challenge: Challenge) {
  const activations = await getPendingItemActivations(userId);
  const now = Date.now();
  const activePendingActivations = activations.filter((activation) => !isActivationExpired(activation, now));
  const activationCompletionCounts = await getActivationCompletionCounts(
    userId,
    activePendingActivations.map((activation) => activation.id),
  );
  const categoryBoostItemId = getCategoryBoostItemId(challenge.category);
  const categoryBoostCount = categoryBoostItemId
    ? activePendingActivations.filter((activation) => activation.item_id === categoryBoostItemId && isTimedActivationActive(activation, now)).length
    : 0;
  const luckyCrystalCount = activePendingActivations.filter((activation) => activation.item_id === LUCKY_CRYSTAL_ITEM_ID && isTimedActivationActive(activation, now)).length;
  const nextDoubleXpActivation = activePendingActivations.find(
    (activation) => activation.item_id === DOUBLE_XP_SIGIL_ITEM_ID && (activationCompletionCounts.get(activation.id) ?? 0) === 0,
  );
  const nextLegendaryContractActivation = activePendingActivations.find(
    (activation) => activation.item_id === LEGENDARY_CONTRACT_ITEM_ID && (activationCompletionCounts.get(activation.id) ?? 0) === 0,
  );
  const nextSpecialActivation = challenge.source_item_id
    ? activePendingActivations.find(
        (activation) => activation.item_id === challenge.source_item_id && (activationCompletionCounts.get(activation.id) ?? 0) === 0,
      )
    : null;
  const nextChainActivation = activePendingActivations.find(
    (activation) => activation.item_id === CHALLENGE_CHAIN_ITEM_ID && (activationCompletionCounts.get(activation.id) ?? 0) < 3,
  );
  const nextOathActivation = activePendingActivations.find((activation) => activation.item_id === HUNTERS_OATH_ITEM_ID);
  const oathCategory = getActivationSpecializationCategory(nextOathActivation ?? null);
  const todayKey = getDayKey(new Date());
  const [chainCompletionCount, oathProgress] = await Promise.all([
    Promise.resolve(nextChainActivation ? (activationCompletionCounts.get(nextChainActivation.id) ?? 0) : 0),
    nextOathActivation ? getOathProgress(userId, nextOathActivation.id) : Promise.resolve({ lastProgressDay: null, targetCategory: null }),
  ]);
  const xpMultiplier = (nextDoubleXpActivation ? 2 : 1) * (1 + categoryBoostCount * 0.2);
  let finalXpMultiplier = xpMultiplier;
  let finalEssenceMultiplier = 1 + luckyCrystalCount * 0.1;
  const appliedActivationIds = [
    ...(nextDoubleXpActivation ? [nextDoubleXpActivation.id] : []),
    ...(nextLegendaryContractActivation ? [nextLegendaryContractActivation.id] : []),
    ...(nextSpecialActivation ? [nextSpecialActivation.id] : []),
  ];
  const consumedActivationIds = [
    ...(nextDoubleXpActivation ? [nextDoubleXpActivation.id] : []),
    ...(nextLegendaryContractActivation ? [nextLegendaryContractActivation.id] : []),
    ...(nextSpecialActivation ? [nextSpecialActivation.id] : []),
  ];

  if (nextChainActivation) {
    finalXpMultiplier *= 1.5;
    appliedActivationIds.push(nextChainActivation.id);

    if (chainCompletionCount >= 2) {
      consumedActivationIds.push(nextChainActivation.id);
    }
  }

  if (nextLegendaryContractActivation) {
    finalXpMultiplier *= 5;
    finalEssenceMultiplier *= 5;
  }

  if (nextOathActivation) {
    const targetCategory = oathCategory ?? oathProgress.targetCategory ?? challenge.category;
    const lastProgressDay = oathProgress.lastProgressDay ?? getDayKey(nextOathActivation.activated_at);
    const categoryMatches = getNormalizedChallengeCategory(targetCategory) === getNormalizedChallengeCategory(challenge.category);
    const missedDay = getDayDiff(lastProgressDay, todayKey) > 1;

    if (missedDay) {
      consumedActivationIds.push(nextOathActivation.id);
    } else if (categoryMatches) {
      finalXpMultiplier *= 1.5;
      appliedActivationIds.push(nextOathActivation.id);
    }
  }

  return {
    appliedActivationIds: Array.from(new Set(appliedActivationIds)),
    consumedActivationIds: Array.from(new Set(consumedActivationIds)),
    essenceMultiplier: finalEssenceMultiplier,
    luckyCrystalMultiplier: 1 + luckyCrystalCount * 0.1,
    xpAwarded: Math.max(1, Math.round(challenge.xp_reward * finalXpMultiplier)),
  };
}

function buildDailyChallenges(rankedDailyChallenges: Challenge[], dailyItemCounts: Record<string, number>) {
  const usedIdentities = new Set<string>();
  let selectedDailyChallenges = pickChallengesByDifficultyQuota(rankedDailyChallenges, CHALLENGE_QUOTAS.daily, usedIdentities);

  selectedDailyChallenges = applyEliteContracts(selectedDailyChallenges, rankedDailyChallenges, dailyItemCounts[ELITE_CONTRACT_ITEM_ID] ?? 0, usedIdentities);
  selectedDailyChallenges = applyChallengeRerolls(selectedDailyChallenges, rankedDailyChallenges, dailyItemCounts[CHALLENGE_REROLL_TOKEN_ITEM_ID] ?? 0, usedIdentities);

  const bonusDailyChallengeCount = dailyItemCounts[BONUS_CHALLENGE_SCROLL_ITEM_ID] ?? 0;

  if (bonusDailyChallengeCount > 0) {
    selectedDailyChallenges.push(...pickAdditionalChallenges(rankedDailyChallenges, bonusDailyChallengeCount, usedIdentities));
  }

  return selectedDailyChallenges;
}

export async function getChallengesByCadence(userId: string, cadence: ChallengeCadence, quota?: DifficultyQuota): Promise<ChallengeWithCompletion[]> {
  const rankOrder = await getPlayerRankOrder(userId);
  const rankedChallenges = await getRankedChallengesByCadence(cadence, rankOrder);
  const selectedChallenges = quota ? pickChallengesByDifficultyQuota(rankedChallenges, quota) : rankedChallenges;
  const specialChallenges = cadence === 'daily' || cadence === 'weekly' ? await getUnlockedSpecialChallenges(userId, cadence) : [];
  const mergedChallenges = [...specialChallenges, ...selectedChallenges].filter(
    (challenge, index, challenges) => challenges.findIndex((candidate) => candidate.id === challenge.id) === index,
  );

  return addCompletionState(userId, mergedChallenges);
}

export async function getDailyChallenges(userId: string): Promise<ChallengeWithCompletion[]> {
  const rankOrder = await getPlayerRankOrder(userId);
  const [rankedDailyChallenges, specialDailyChallenges] = await Promise.all([
    getRankedChallengesByCadence('daily', rankOrder),
    getUnlockedSpecialChallenges(userId, 'daily'),
  ]);
  const dailyItemCounts = await getDailyItemActivationCounts(userId);
  const selectedDailyChallenges = buildDailyChallenges(rankedDailyChallenges, dailyItemCounts);
  const mergedDailyChallenges = [...specialDailyChallenges, ...selectedDailyChallenges].filter(
    (challenge, index, challenges) => challenges.findIndex((candidate) => candidate.id === challenge.id) === index,
  );

  return addCompletionState(userId, mergedDailyChallenges);
}

export async function getChallengeSections(userId: string): Promise<ChallengeSections> {
  const rankOrder = await getPlayerRankOrder(userId);
  const usedIdentities = new Set<string>();
  const [rankedDaily, rankedWeekly, rankedRepeatable, specialDailyChallenges, specialWeeklyChallenges] = await Promise.all([
    getRankedChallengesByCadence('daily', rankOrder),
    getRankedChallengesByCadence('weekly', rankOrder),
    getRankedChallengesByCadence('repeatable', rankOrder),
    getUnlockedSpecialChallenges(userId, 'daily'),
    getUnlockedSpecialWeeklyChallenges(userId),
  ]);
  const dailyItemCounts = await getDailyItemActivationCounts(userId);
  const selectedDaily = buildDailyChallenges(rankedDaily, dailyItemCounts);
  selectedDaily.unshift(...specialDailyChallenges.filter((challenge) => !usedIdentities.has(getChallengeIdentity(challenge))));
  selectedDaily.forEach((challenge) => usedIdentities.add(getChallengeIdentity(challenge)));

  const selectedWeekly = pickChallengesByDifficultyQuota(rankedWeekly, CHALLENGE_QUOTAS.weekly, usedIdentities);
  selectedWeekly.unshift(...specialWeeklyChallenges.filter((challenge) => !usedIdentities.has(getChallengeIdentity(challenge))));
  selectedWeekly.forEach((challenge) => usedIdentities.add(getChallengeIdentity(challenge)));
  const selectedRepeatable = pickChallengesByDifficultyQuota(rankedRepeatable, CHALLENGE_QUOTAS.repeatable, usedIdentities);
  const [daily, weekly, repeatable] = await Promise.all([
    addCompletionState(userId, selectedDaily),
    addCompletionState(userId, selectedWeekly),
    addCompletionState(userId, selectedRepeatable),
  ]);

  return { daily, weekly, repeatable };
}

export async function getRecentActivity(userId: string, limit = 5): Promise<RecentActivityItem[]> {
  const { data, error } = await supabase
    .from('xp_logs')
    .select('id, amount, reason, created_at, source_id, source_type')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const challengeIds = data
    .filter((item) => item.source_type === 'challenge' && item.source_id)
    .map((item) => item.source_id as string);

  if (challengeIds.length === 0) {
    return data;
  }

  const { data: challenges, error: challengesError } = await supabase
    .from('challenges')
    .select('id, category')
    .in('id', challengeIds);

  if (challengesError) {
    throw challengesError;
  }

  const challengeCategoryById = new Map(challenges.map((challenge) => [challenge.id, challenge.category]));

  return data.map((item) => ({
    ...item,
    category: item.source_id ? challengeCategoryById.get(item.source_id) : null,
  }));
}

async function assertChallengeCanBeCompleted(userId: string, challenge: Challenge) {
  const windowStart = getCompletionWindowStart(challenge.cadence);

  if (!windowStart) {
    return;
  }

  const { data, error } = await supabase
    .from('user_challenges')
    .select('id')
    .eq('user_id', userId)
    .eq('challenge_id', challenge.id)
    .eq('status', 'completed')
    .gte('completed_at', windowStart)
    .limit(1);

  if (error) {
    throw error;
  }

  if (data.length > 0) {
    throw new Error(`${challenge.cadence === 'daily' ? 'Daily' : 'Weekly'} challenge already completed for this reset window.`);
  }
}

export async function completeChallenge(userId: string, challenge: Challenge) {
  await assertChallengeCanBeCompleted(userId, challenge);

  const now = new Date().toISOString();
  const [{ data: profile, error: profileError }, rewardSnapshot, completedChallengeDayKeys, pendingItemActivations] = await Promise.all([
    supabase.from('profiles').select('essence_balance, total_xp').eq('id', userId).single(),
    getCompletionRewardSnapshot(userId, challenge),
    getCompletedChallengeDayKeys(userId),
    getPendingItemActivations(userId),
  ]);

  if (profileError) {
    throw profileError;
  }

  const nextXp = (profile?.total_xp ?? 0) + rewardSnapshot.xpAwarded;
  const currentRank = getRankForXp(profile?.total_xp ?? 0);
  const nextRank = getRankForXp(nextXp).name;
  const nextRankDefinition = getRankForXp(nextXp);
  const rankUpBonus = nextRankDefinition.order > currentRank.order ? nextRankDefinition.order * 100 : 0;
  const essenceReward = Math.max(1, Math.round((getChallengeEssenceReward(challenge) + rankUpBonus) * rewardSnapshot.essenceMultiplier));
  const todayKey = getDayKey(new Date());
  const previousLatestDayKey = completedChallengeDayKeys[completedChallengeDayKeys.length - 1] ?? null;
  const currentStreak = computeStreakFromDayKeys(completedChallengeDayKeys);
  const streakProtectionActivation = pendingItemActivations
    .filter((activation) => PROTECTION_ITEM_IDS.includes(activation.item_id as (typeof PROTECTION_ITEM_IDS)[number]))
    .find((activation) => !activation.consumed_at);
  let streakCount = currentStreak;
  let nextEssence = (profile?.essence_balance ?? 0) + essenceReward;
  const streakConsumedActivationIds: string[] = [];

  if (previousLatestDayKey === todayKey) {
    streakCount = currentStreak;
  } else if (!previousLatestDayKey) {
    streakCount = 1;
  } else {
    const gapDays = getDayDiff(previousLatestDayKey, todayKey);

    if (gapDays === 1) {
      streakCount = currentStreak + 1;
    } else if (gapDays === 2 && streakProtectionActivation) {
      streakCount = currentStreak + 2;
      streakConsumedActivationIds.push(streakProtectionActivation.id);

      if (streakProtectionActivation.item_id === MOMENTUM_CRYSTAL_ITEM_ID) {
        nextEssence += Math.max(1, Math.round(MOMENTUM_CRYSTAL_ESSENCE_BONUS * rewardSnapshot.luckyCrystalMultiplier));
      }
    } else {
      streakCount = 1;
    }
  }

  const { error: completionError } = await supabase.from('user_challenges').insert({
    applied_item_activation_ids: rewardSnapshot.appliedActivationIds,
    challenge_id: challenge.id,
    completed_at: now,
    essence_awarded: essenceReward,
    status: 'completed',
    user_id: userId,
    xp_awarded: rewardSnapshot.xpAwarded,
  });

  if (completionError) {
    throw completionError;
  }

  const { error: logError } = await supabase.from('xp_logs').insert({
    amount: rewardSnapshot.xpAwarded,
    reason: `Completed ${challenge.title}`,
    source_id: challenge.id,
    source_type: 'challenge',
    user_id: userId,
  });

  if (logError) {
    throw logError;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ current_rank: nextRank, essence_balance: nextEssence, streak_count: streakCount, total_xp: nextXp })
    .eq('id', userId);

  if (updateError) {
    throw updateError;
  }

  const consumedActivationIds = Array.from(new Set([...rewardSnapshot.consumedActivationIds, ...streakConsumedActivationIds]));

  if (consumedActivationIds.length > 0) {
    const { error: consumeError } = await supabase
      .from('user_item_activations')
      .update({ consumed_at: now })
      .in('id', consumedActivationIds);

    if (consumeError) {
      throw consumeError;
    }
  }

  const guildContribution = await contributeGuildProgressFromChallenge(userId, challenge);

  return { essenceReward, guildContribution, nextEssence, nextRank, nextXp, streakCount };
}

export async function revertChallengeCompletion(userId: string, challenge: Challenge) {
  const windowStart = getCompletionWindowStart(challenge.cadence);

  if (!windowStart) {
    throw new Error('Repeatable challenges cannot be reverted because every completion is a separate XP gain.');
  }

  const { data: completions, error: completionLookupError } = await supabase
    .from('user_challenges')
    .select('id, xp_awarded, essence_awarded, applied_item_activation_ids')
    .eq('user_id', userId)
    .eq('challenge_id', challenge.id)
    .eq('status', 'completed')
    .gte('completed_at', windowStart);

  if (completionLookupError) {
    throw completionLookupError;
  }

  if (completions.length === 0) {
    return null;
  }

  const totalXpAwarded = completions.reduce((sum, completion) => sum + completion.xp_awarded, 0);
  const totalEssenceAwarded = completions.reduce((sum, completion) => sum + completion.essence_awarded, 0);
  const consumedActivationIds = completions.flatMap((completion) => completion.applied_item_activation_ids);

  const { error: logDeleteError } = await supabase
    .from('xp_logs')
    .delete()
    .eq('user_id', userId)
    .eq('source_id', challenge.id)
    .eq('source_type', 'challenge')
    .gte('created_at', windowStart);

  if (logDeleteError) {
    throw logDeleteError;
  }

  const { error: completionDeleteError } = await supabase
    .from('user_challenges')
    .delete()
    .eq('user_id', userId)
    .in(
      'id',
      completions.map((completion) => completion.id),
    );

  if (completionDeleteError) {
    throw completionDeleteError;
  }

  if (consumedActivationIds.length > 0) {
    const { error: restoreActivationError } = await supabase
      .from('user_item_activations')
      .update({ consumed_at: null })
      .in('id', consumedActivationIds);

    if (restoreActivationError) {
      throw restoreActivationError;
    }
  }

  const [{ data: profile, error: profileError }, remainingCompletedDayKeys] = await Promise.all([
    supabase.from('profiles').select('essence_balance, total_xp').eq('id', userId).single(),
    getCompletedChallengeDayKeys(userId),
  ]);

  if (profileError) {
    throw profileError;
  }

  const nextXp = Math.max((profile?.total_xp ?? 0) - totalXpAwarded, 0);
  const nextRank = getRankForXp(nextXp).name;
  const nextEssence = Math.max((profile?.essence_balance ?? 0) - totalEssenceAwarded, 0);
  const nextStreakCount = computeStreakFromDayKeys(remainingCompletedDayKeys);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ current_rank: nextRank, essence_balance: nextEssence, streak_count: nextStreakCount, total_xp: nextXp })
    .eq('id', userId);

  if (updateError) {
    throw updateError;
  }

  return { nextEssence, nextRank, nextXp };
}
