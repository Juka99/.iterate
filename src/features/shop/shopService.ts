import { supabase } from '@/lib/supabaseClient';
import { getRankForXp } from '@/features/ranks/rankUtils';
import { getRankRequirementOrder, getShopItemById } from './shopData';
import type { ShopItem, ShopPurchase } from './shopTypes';

export async function getShopPurchases(userId: string): Promise<ShopPurchase[]> {
  const { data, error } = await supabase
    .from('shop_purchases')
    .select('*')
    .eq('user_id', userId)
    .order('purchased_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

async function assertItemCanBePurchased(userId: string, item: ShopItem, configuredCost?: number) {
  const purchaseCost = item.cost ?? configuredCost;

  if (purchaseCost === null || purchaseCost === undefined) {
    throw new Error(`${item.name} needs a configuration flow before it can be purchased.`);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('essence_balance, total_xp')
    .eq('id', userId)
    .single();

  if (profileError) {
    throw profileError;
  }

  const playerRank = getRankForXp(profile.total_xp ?? 0);
  const requiredRankOrder = getRankRequirementOrder(item.rankRequirement);

  if (playerRank.order < requiredRankOrder) {
    throw new Error(`Reach Rank ${item.rankRequirement} to purchase ${item.name}.`);
  }

  if ((profile.essence_balance ?? 0) < purchaseCost) {
    throw new Error(`You need ${purchaseCost.toLocaleString()} Essence to purchase ${item.name}.`);
  }

  if (!item.repeatable) {
    const { data: existingPurchases, error: purchaseError } = await supabase
      .from('shop_purchases')
      .select('id, item_id')
      .eq('user_id', userId)
      .in('item_id', item.id === 'paragon-nameplate' ? [item.id, 'living-nameplate'] : [item.id]);

    if (purchaseError) {
      throw purchaseError;
    }

    if (item.id === 'paragon-nameplate' && existingPurchases.some((purchase) => purchase.item_id === 'living-nameplate')) {
      throw new Error('Living Nameplate is already owned and includes the stronger version of this cosmetic.');
    }

    if (existingPurchases.some((purchase) => purchase.item_id === item.id)) {
      throw new Error(`${item.name} is already owned.`);
    }
  }

  return { currentEssence: profile.essence_balance ?? 0, purchaseCost };
}

export async function purchaseShopItem(userId: string, itemId: string, configuredCost?: number) {
  const item = getShopItemById(itemId);

  if (!item) {
    throw new Error('Shop item could not be found.');
  }

  await assertItemCanBePurchased(userId, item, configuredCost);

  const { data, error } = await supabase.rpc('purchase_shop_item', {
    configured_cost: configuredCost ?? null,
    target_item_id: item.id,
  });

  if (error) {
    throw error;
  }

  return data;
}
