import type { Database } from '@/types/database';

export type ShopPurchase = Database['public']['Tables']['shop_purchases']['Row'];
export type ShopRankRequirement = 'core' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';
export type ShopItemKind = 'boost' | 'contract' | 'key' | 'prestige' | 'protection' | 'trial' | 'utility';

export interface ShopItem {
  cost: number | null;
  costLabel?: string;
  effect: string;
  id: string;
  image: string;
  kind: ShopItemKind;
  name: string;
  rankRequirement: ShopRankRequirement;
  repeatable: boolean;
}

export interface ShopSection {
  arsenalName: string;
  description: string;
  id: string;
  items: ShopItem[];
  rankRequirement: ShopRankRequirement;
  title: string;
}
