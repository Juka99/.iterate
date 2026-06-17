import { useQuery } from '@tanstack/react-query';
import { getShopPurchases } from '../shopService';

export function useShopPurchases(userId?: string) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ['shop-purchases', userId],
    queryFn: () => getShopPurchases(userId as string),
  });
}
