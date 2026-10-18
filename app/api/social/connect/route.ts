import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getSupabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import { isProvider, PROVIDERS, redirectUri } from '@/lib/social';
import { signState } from '@/lib/social/crypto';

// Kthen linkun e login-it të platformës; shfletuesi pastaj ridrejtohet atje
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Konfigurimi i bazës së të dhënave dështoi.' }, { status: 500 });
    const user = await getUserFromRequest(req, supabase);
    if (!user) return NextResponse.json({ error: 'Përdoruesi i paidentifikuar. Ju lutem lidhuni.' }, { status: 401 });

    const { provider } = await req.json();
    if (!isProvider(provider)) return NextResponse.json({ error: 'Platformë e panjohur.' }, { status: 400 });
    if (!PROVIDERS[provider].configured()) {
      return NextResponse.json({ error: 'Kjo platformë nuk është konfiguruar ende në server.' }, { status: 503 });
    }

    const nonce = randomBytes(16).toString('base64url');
    const state = signState({ uid: user.id, provider, nonce, exp: Date.now() + 10 * 60 * 1000 });
    const res = NextResponse.json({ url: PROVIDERS[provider].authUrl(redirectUri(req, provider), state) });
    // Nonce-i në cookie lidh callback-un me të njëjtin shfletues (mbrojtje CSRF)
    res.cookies.set('social_oauth_nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/social/callback',
      maxAge: 600,
    });
    return res;
  } catch (error) {
    console.error('Social connect error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
