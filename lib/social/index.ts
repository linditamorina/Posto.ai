import { SupabaseClient } from '@supabase/supabase-js';
import { encryptToken } from './crypto';
import { linkedinAuthUrl, linkedinConfigured, linkedinExchange, linkedinPublish } from './linkedin';
import { facebookPublish, instagramPublish, metaAuthUrl, metaConfigured, metaExchange } from './meta';
import { ConnectedAccount, Platform, PublishInput, PublishResult, StoredAccount } from './types';

// "Provider" = ku bëhet login-i (Meta lidh njëkohësisht Facebook dhe Instagram)
export const PROVIDERS = {
  linkedin: { configured: linkedinConfigured, authUrl: linkedinAuthUrl, exchange: linkedinExchange },
  meta: { configured: metaConfigured, authUrl: metaAuthUrl, exchange: metaExchange },
} as const;

export type Provider = keyof typeof PROVIDERS;

export function isProvider(p: string): p is Provider {
  return p in PROVIDERS;
}

export const PUBLISHERS: Record<Platform, (a: StoredAccount, token: string, i: PublishInput) => Promise<PublishResult>> = {
  linkedin: linkedinPublish,
  facebook: facebookPublish,
  instagram: instagramPublish,
};

export function appUrl(req: Request): string {
  return process.env.APP_URL?.replace(/\/$/, '') || new URL(req.url).origin;
}

export function redirectUri(req: Request, provider: Provider): string {
  return `${appUrl(req)}/api/social/callback/${provider}`;
}

export async function saveAccounts(supabase: SupabaseClient, userId: string, accounts: ConnectedAccount[]) {
  if (accounts.length === 0) return;
  const rows = accounts.map(a => ({
    user_id: userId,
    platform: a.platform,
    external_id: a.externalId,
    display_name: a.displayName,
    avatar_url: a.avatarUrl,
    access_token_enc: encryptToken(a.accessToken),
    token_expires_at: a.expiresAt?.toISOString() ?? null,
    meta: a.meta ?? {},
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from('social_accounts').upsert(rows, { onConflict: 'user_id,platform,external_id' });
  if (error) throw error;
}
