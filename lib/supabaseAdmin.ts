import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Klient me service role - përdoret VETËM në server (API routes)
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Verifikon tokenin nga header-i Authorization dhe kthen përdoruesin real
export async function getUserFromRequest(req: Request, supabase: SupabaseClient): Promise<User | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return data.user;
}
