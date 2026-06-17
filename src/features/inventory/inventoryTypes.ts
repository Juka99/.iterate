import type { Database } from '@/types/database';
import type { ShopItem } from '@/features/shop/shopTypes';

export type InventoryActivation = Database['public']['Tables']['user_item_activations']['Row'];

export interface InventoryEntry {
  acquiredCount: number;
  activatedCount: number;
  availableCount: number;
  activatableCount: number;
  isBlockedByActive: boolean;
  item: ShopItem;
}

export interface ActiveInventoryEffect {
  activation: InventoryActivation;
  item: ShopItem;
}

export interface InventoryOverview {
  activeEffects: ActiveInventoryEffect[];
  entries: InventoryEntry[];
  totalAvailable: number;
}
