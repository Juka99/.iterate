import { supabase } from '@/lib/supabaseClient';

export interface ProfileCosmetics {
  aura: 'none' | 'iterated';
  frame: 'none' | 'cosmic';
  legacy: boolean;
  nameplate: 'none' | 'paragon' | 'living';
  relic: boolean;
  showcase: 'none' | 'pedestal' | 'monument';
}

const defaultProfileCosmetics: ProfileCosmetics = {
  aura: 'none',
  frame: 'none',
  legacy: false,
  nameplate: 'none',
  relic: false,
  showcase: 'none',
};

export async function getProfileCosmetics(userId: string): Promise<ProfileCosmetics> {
  const { data, error } = await supabase
    .from('user_item_activations')
    .select('item_id')
    .eq('user_id', userId)
    .is('consumed_at', null)
    .in('item_id', [
      'hunter-legacy',
      'paragon-nameplate',
      'rank-showcase-pedestal',
      'living-nameplate',
      'hall-of-legends-monument',
      'founders-relic',
    ]);

  if (error) {
    throw error;
  }

  const ownedItemIds = new Set((data ?? []).map((activation) => activation.item_id));

  return {
    aura: 'none',
    frame: 'none',
    legacy: ownedItemIds.has('hunter-legacy'),
    nameplate: ownedItemIds.has('living-nameplate') ? 'living' : ownedItemIds.has('paragon-nameplate') ? 'paragon' : 'none',
    relic: ownedItemIds.has('founders-relic'),
    showcase: ownedItemIds.has('hall-of-legends-monument') ? 'monument' : ownedItemIds.has('rank-showcase-pedestal') ? 'pedestal' : 'none',
  };
}

export function getDefaultProfileCosmetics() {
  return defaultProfileCosmetics;
}
