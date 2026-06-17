import { supabase } from '@/lib/supabaseClient';
import { synchronizeItemActivationState } from '@/features/challenges/itemActivationState';
import { getShopItemById, SHOP_ITEMS } from '@/features/shop/shopData';
import type { InventoryActivation, InventoryOverview } from './inventoryTypes';

const DAILY_WINDOW_ITEM_IDS = new Set(['bonus-challenge-scroll', 'challenge-reroll-token', 'elite-contract', 'challenge-chain']);
const WEEKLY_WINDOW_ITEM_IDS = new Set([
  'goblin-kings-gate-key',
  'deep-work-gate-key',
  'iron-trial-key',
  'trial-of-ascension',
  'legendary-trial',
  'mythic-trial',
  'master-boss-key',
]);
const PENDING_ITEM_IDS = new Set(['double-xp-sigil', 'streak-shield', 'momentum-crystal', 'hunters-oath', 'legendary-contract']);
const SINGLETON_ACTIVE_ITEM_IDS = new Set([
  'hunters-oath',
  'goblin-kings-gate-key',
  'deep-work-gate-key',
  'iron-trial-key',
  'trial-of-ascension',
  'legendary-trial',
  'mythic-trial',
  'master-boss-key',
]);

function incrementCount(counts: Map<string, number>, itemId: string) {
  counts.set(itemId, (counts.get(itemId) ?? 0) + 1);
}

function isPermanentItem(itemId: string) {
  const item = getShopItemById(itemId);
  return Boolean(item && !item.repeatable);
}

function isSameDay(value: string, date = new Date()) {
  const target = new Date(value);

  return (
    target.getFullYear() === date.getFullYear() &&
    target.getMonth() === date.getMonth() &&
    target.getDate() === date.getDate()
  );
}

function isActivationCurrentlyActive(activation: InventoryActivation, now = Date.now()) {
  if (activation.consumed_at) {
    return false;
  }

  if (activation.expires_at) {
    return new Date(activation.expires_at).getTime() > now;
  }

  if (isPermanentItem(activation.item_id)) {
    return true;
  }

  if (DAILY_WINDOW_ITEM_IDS.has(activation.item_id)) {
    return isSameDay(activation.activated_at);
  }

  if (WEEKLY_WINDOW_ITEM_IDS.has(activation.item_id)) {
    return !activation.expires_at || new Date(activation.expires_at).getTime() > now;
  }

  return PENDING_ITEM_IDS.has(activation.item_id);
}

export async function getInventoryOverview(userId: string): Promise<InventoryOverview> {
  await synchronizeItemActivationState(userId);

  const [{ data: purchases, error: purchaseError }, { data: activations, error: activationError }] = await Promise.all([
    supabase
      .from('shop_purchases')
      .select('*')
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false }),
    supabase
      .from('user_item_activations')
      .select('*')
      .eq('user_id', userId)
      .order('activated_at', { ascending: false }),
  ]);

  if (purchaseError) {
    throw purchaseError;
  }

  if (activationError) {
    throw activationError;
  }

  const purchaseCounts = new Map<string, number>();
  const activationCounts = new Map<string, number>();
  const activeActivationCounts = new Map<string, number>();

  for (const purchase of purchases ?? []) {
    incrementCount(purchaseCounts, purchase.item_id);
  }

  for (const activation of activations ?? []) {
    incrementCount(activationCounts, activation.item_id);

    if (isActivationCurrentlyActive(activation)) {
      incrementCount(activeActivationCounts, activation.item_id);
    }
  }

  const entries = SHOP_ITEMS.map((item) => {
    const acquiredCount = purchaseCounts.get(item.id) ?? 0;
    const activatedCount = activationCounts.get(item.id) ?? 0;
    const availableCount = item.kind === 'prestige' ? acquiredCount : Math.max(acquiredCount - activatedCount, 0);
    const isBlockedByActive = SINGLETON_ACTIVE_ITEM_IDS.has(item.id) && (activeActivationCounts.get(item.id) ?? 0) > 0;
    const activatableCount = isBlockedByActive ? 0 : availableCount;

    return {
      acquiredCount,
      activatedCount,
      availableCount,
      activatableCount,
      isBlockedByActive,
      item,
    };
  }).filter((entry) => entry.item.repeatable && entry.acquiredCount > 0 && entry.availableCount > 0);

  const now = Date.now();
  const activeEffects = (activations ?? [])
    .filter((activation) => !isPermanentItem(activation.item_id))
    .filter((activation) => isActivationCurrentlyActive(activation, now))
    .map((activation) => {
      const item = getShopItemById(activation.item_id);
      return item ? { activation, item } : null;
    })
    .filter((effect): effect is { activation: InventoryActivation; item: NonNullable<ReturnType<typeof getShopItemById>> } => Boolean(effect));

  return {
    activeEffects,
    entries,
    totalAvailable: entries.reduce((sum, entry) => sum + entry.availableCount, 0),
  };
}

export async function activateInventoryItem(itemId: string, option?: string): Promise<InventoryActivation> {
  const { data, error } = await supabase.rpc('activate_inventory_item', {
    target_item_id: itemId,
    target_option: option ?? null,
  });

  if (error) {
    throw error;
  }

  return data;
}
