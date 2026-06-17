import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { activateInventoryItem, getInventoryOverview } from '../inventoryService';

export function useInventory(userId?: string) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ['inventory', userId],
    queryFn: () => getInventoryOverview(userId as string),
  });
}

export function useActivateInventoryItem(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, option }: { itemId: string; option?: string }) => activateInventoryItem(itemId, option),
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: ['inventory', userId] });
        void queryClient.invalidateQueries({ queryKey: ['daily-challenges', userId] });
        void queryClient.invalidateQueries({ queryKey: ['challenge-sections', userId] });
      }
    },
  });
}
