import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import { PROVIDERS } from '@/lib/social';

async function auth(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: NextResponse.json({ error: 'Konfigurimi i bazës së të dhënave dështoi.' }, { status: 500 }) };
  const user = await getUserFromRequest(req, supabase);
  if (!user) return { error: NextResponse.json({ error: 'Përdoruesi i paidentifikuar. Ju lutem lidhuni.' }, { status: 401 }) };
  return { supabase, user };
}

// Lista e llogarive të lidhura (pa tokena) + cilat platforma janë konfiguruar
export async function POST(req: Request) {
  const { supabase, user, error } = await auth(req);
  if (error) return error;

  const { data, error: dbError } = await supabase
    .from('social_accounts')
    .select('id, platform, external_id, display_name, avatar_url, token_expires_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({
    accounts: data,
    providers: {
      linkedin: PROVIDERS.linkedin.configured(),
      meta: PROVIDERS.meta.configured(),
    },
  });
}

export async function DELETE(req: Request) {
  const { supabase, user, error } = await auth(req);
  if (error) return error;

  const { id } = await req.json();
  const { error: dbError } = await supabase.from('social_accounts').delete().eq('id', id).eq('user_id', user.id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
