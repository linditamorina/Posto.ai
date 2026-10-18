import { apiError, ConnectedAccount, PublishInput, PublishResult, StoredAccount } from './types';

const SCOPES = 'openid profile w_member_social';

// LinkedIn pranon versione 'YYYYMM' për rreth një vit; si parazgjedhje marrim 2 muaj më parë
function apiVersion(): string {
  if (process.env.LINKEDIN_API_VERSION) return process.env.LINKEDIN_API_VERSION;
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - 2);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function linkedinConfigured() {
  return Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
}

export function linkedinAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: redirectUri,
    state,
    scope: SCOPES,
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
}

export async function linkedinExchange(code: string, redirectUri: string): Promise<ConnectedAccount[]> {
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  });
  if (!tokenRes.ok) throw await apiError(tokenRes, 'LinkedIn');
  const token = await tokenRes.json();

  const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!meRes.ok) throw await apiError(meRes, 'LinkedIn');
  const me = await meRes.json();

  return [{
    platform: 'linkedin',
    externalId: me.sub,
    displayName: me.name ?? null,
    avatarUrl: me.picture ?? null,
    accessToken: token.access_token,
    expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
  }];
}

// Posts API përdor "little text format": këto karaktere duhen escape, përndryshe teksti pritet.
// Hashtag-ët i kthejmë në formatin e LinkedIn që të mbeten të klikueshëm.
export function toLittleText(text: string): string {
  const escaped = text.replace(/[\\|{}@\[\]()<>#*_~]/g, ch => `\\${ch}`);
  return escaped.replace(/\\#((?:[\p{L}\p{N}]|\\_)+)/gu, (_m, tag) => `{hashtag|\\#|${tag}}`);
}

function restHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'LinkedIn-Version': apiVersion(),
    'X-Restli-Protocol-Version': '2.0.0',
    'Content-Type': 'application/json',
  };
}

// Ngarkon imazhin në LinkedIn dhe kthen URN-në e tij
async function uploadImage(token: string, owner: string, bytes: Buffer, type: string): Promise<string> {
  const initRes = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
    method: 'POST',
    headers: restHeaders(token),
    body: JSON.stringify({ initializeUploadRequest: { owner } }),
  });
  if (!initRes.ok) throw await apiError(initRes, 'LinkedIn');
  const { value } = await initRes.json();

  const putRes = await fetch(value.uploadUrl, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': type },
    body: new Uint8Array(bytes),
  });
  if (!putRes.ok) throw await apiError(putRes, 'LinkedIn');
  return value.image;
}

export async function linkedinPublish(account: StoredAccount, token: string, input: PublishInput): Promise<PublishResult> {
  const author = `urn:li:person:${account.external_id}`;
  const body: Record<string, unknown> = {
    author,
    commentary: toLittleText(input.text),
    visibility: 'PUBLIC',
    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };
  if (input.imageBytes && input.imageType) {
    const imageUrn = await uploadImage(token, author, input.imageBytes, input.imageType);
    body.content = { media: { id: imageUrn } };
  }

  const res = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: restHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await apiError(res, 'LinkedIn');
  const postUrn = res.headers.get('x-restli-id') || '';
  return {
    externalPostId: postUrn,
    externalUrl: postUrn ? `https://www.linkedin.com/feed/update/${postUrn}` : null,
  };
}
