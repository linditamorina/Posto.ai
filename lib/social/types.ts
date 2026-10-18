export type Platform = 'linkedin' | 'facebook' | 'instagram';

// Llogaria që kthehet nga OAuth para se të ruhet në bazë
export interface ConnectedAccount {
  platform: Platform;
  externalId: string;
  displayName: string | null;
  avatarUrl: string | null;
  accessToken: string;
  expiresAt: Date | null;
  meta?: Record<string, unknown>;
}

export interface PublishInput {
  text: string;
  imageUrl: string | null;   // link publik (Supabase Storage)
  imageBytes: Buffer | null;
  imageType: string | null;
}

export interface PublishResult {
  externalPostId: string;
  externalUrl: string | null;
}

export interface StoredAccount {
  id: string;
  platform: Platform;
  external_id: string;
  display_name: string | null;
  access_token_enc: string;
  token_expires_at: string | null;
  meta: Record<string, unknown>;
}

// Gabimet e API-ve të jashtme me mesazh të lexueshëm
export async function apiError(res: Response, platform: string): Promise<Error> {
  const body = await res.json().catch(() => null);
  const msg = body?.error?.message || body?.message || res.statusText;
  return new Error(`${platform} (${res.status}): ${msg}`);
}
