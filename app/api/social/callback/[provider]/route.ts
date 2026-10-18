import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { appUrl, isProvider, PROVIDERS, redirectUri, saveAccounts } from '@/lib/social';
import { verifyState } from '@/lib/social/crypto';

interface OAuthState {
  uid: string;
  provider: string;
  nonce: string;
  exp: number;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const back = (query: string) => {
    const res = NextResponse.redirect(`${appUrl(req)}/accounts?${query}`);
    res.cookies.delete({ name: 'social_oauth_nonce', path: '/api/social/callback' });
    return res;
  };

  try {
    const url = new URL(req.url);
    // Përdoruesi anuloi ose platforma ktheu gabim
    if (url.searchParams.get('error')) return back('error=cancelled');

    const code = url.searchParams.get('code');
    const state = verifyState<OAuthState>(url.searchParams.get('state') || '');
    const nonce = req.cookies.get('social_oauth_nonce')?.value;
    if (!code || !state || !isProvider(provider) || state.provider !== provider || state.exp < Date.now() || state.nonce !== nonce) {
      return back('error=invalid_state');
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return back('error=server');

    const accounts = await PROVIDERS[provider].exchange(code, redirectUri(req, provider));
    await saveAccounts(supabase, state.uid, accounts);
    return back(accounts.length ? `connected=${provider}&count=${accounts.length}` : `error=no_accounts&provider=${provider}`);
  } catch (error) {
    console.error('Social callback error:', error);
    return back(`error=${encodeURIComponent((error as Error).message.slice(0, 200))}`);
  }
}
