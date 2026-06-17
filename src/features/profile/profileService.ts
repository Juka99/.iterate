import { supabase } from '@/lib/supabaseClient';
import type { Profile, ProfileUpdate } from '@/types/user';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProfile(userId: string, profile: ProfileUpdate): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').update(profile).eq('id', userId).select('*').single();

  if (error) {
    throw error;
  }

  return data;
}

export async function chooseHunterLegacyPath(targetPath: string): Promise<Profile> {
  const { data, error } = await supabase.rpc('choose_hunter_legacy_path', { target_path: targetPath });

  if (error) {
    throw error;
  }

  return data;
}
