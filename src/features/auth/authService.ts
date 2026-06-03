import { supabase } from '@/lib/supabaseClient';

export interface AuthCredentials {
  email: string;
  password: string;
}

export async function signInWithEmail({ email, password }: AuthCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  return data;
}

export async function registerWithEmail({ email, password }: AuthCredentials) {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

