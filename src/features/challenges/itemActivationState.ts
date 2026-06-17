import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/database';

type ItemActivation = Database['public']['Tables']['user_item_activations']['Row'];

const HUNTERS_OATH_ITEM_ID = 'hunters-oath';

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

function getLatestOathProgressDay(activation: ItemActivation, completions: Array<{ applied_item_activation_ids: string[]; completed_at: string | null }>) {
  const lastCompletion = completions
    .filter((completion) => completion.completed_at && completion.applied_item_activation_ids.includes(activation.id))
    .sort((a, b) => new Date(b.completed_at as string).getTime() - new Date(a.completed_at as string).getTime())[0];

  return getDayKey(lastCompletion?.completed_at ?? activation.activated_at);
}

export async function synchronizeItemActivationState(userId: string) {
  const { data: pendingActivations, error: activationError } = await supabase
    .from('user_item_activations')
    .select('*')
    .eq('user_id', userId)
    .eq('item_id', HUNTERS_OATH_ITEM_ID)
    .is('consumed_at', null);

  if (activationError) {
    throw activationError;
  }

  if (!pendingActivations || pendingActivations.length === 0) {
    return;
  }

  const { data: completions, error: completionError } = await supabase
    .from('user_challenges')
    .select('applied_item_activation_ids, completed_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .not('completed_at', 'is', null);

  if (completionError) {
    throw completionError;
  }

  const todayKey = getDayKey(new Date());
  const failedActivationIds = pendingActivations
    .filter((activation) => {
      const lastProgressDay = getLatestOathProgressDay(activation, completions ?? []);
      return getDayDiff(lastProgressDay, todayKey) > 1;
    })
    .map((activation) => activation.id);

  if (failedActivationIds.length === 0) {
    return;
  }

  const { error: consumeError } = await supabase
    .from('user_item_activations')
    .update({ consumed_at: new Date().toISOString() })
    .in('id', failedActivationIds);

  if (consumeError) {
    throw consumeError;
  }
}
