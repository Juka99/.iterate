import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseShopItem } from '../shopService';

interface PurchaseShopItemInput {
  configuredCost?: number;
  itemId: string;
  userId: string;
}

export function usePurchaseShopItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ configuredCost, itemId, userId }: PurchaseShopItemInput) => purchaseShopItem(userId, itemId, configuredCost),
    onSuccess: (_purchase, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
      void queryClient.invalidateQueries({ queryKey: ['profile-cosmetics', variables.userId] });
      void queryClient.invalidateQueries({ queryKey: ['profile-showcase', variables.userId] });
      void queryClient.invalidateQueries({ queryKey: ['shop-purchases', variables.userId] });
      void queryClient.invalidateQueries({ queryKey: ['achievements', variables.userId] });
      void queryClient.invalidateQueries({ queryKey: ['inventory', variables.userId] });
    },
  });
}
