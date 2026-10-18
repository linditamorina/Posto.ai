import { supabase } from '@/lib/supabase';

// Thërret API-të tona duke dërguar tokenin e sesionit, që serveri ta verifikojë përdoruesin
export async function apiFetch(url: string, body: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}
