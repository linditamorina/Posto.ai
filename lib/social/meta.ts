import { apiError, ConnectedAccount, PublishInput, PublishResult, StoredAccount } from './types';

const GRAPH = () => `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v23.0'}`;
const SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
  'business_management',
].join(',');

export function metaConfigured() {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export function metaAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: redirectUri,
    state,
    scope: SCOPES,
    response_type: 'code',
  });
  return `https://www.facebook.com/${process.env.META_GRAPH_VERSION || 'v23.0'}/dialog/oauth?${params}`;
}

async function graphGet(path: string, params: Record<string, string>) {
  const res = await fetch(`${GRAPH()}${path}?${new URLSearchParams(params)}`);
  if (!res.ok) throw await apiError(res, 'Meta');
  return res.json();
}

async function graphPost(path: string, params: Record<string, string>) {
  const res = await fetch(`${GRAPH()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  if (!res.ok) throw await apiError(res, 'Meta');
  return res.json();
}

// Një login në Facebook kthen të gjitha Faqet e përdoruesit dhe llogaritë Instagram të lidhura me to
export async function metaExchange(code: string, redirectUri: string): Promise<ConnectedAccount[]> {
  const short = await graphGet('/oauth/access_token', {
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: redirectUri,
    code,
  });
  // Token afatgjatë i përdoruesit -> tokenat e faqeve nuk skadojnë
  const long = await graphGet('/oauth/access_token', {
    grant_type: 'fb_exchange_token',
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: short.access_token,
  });
  const pages = await graphGet('/me/accounts', {
    access_token: long.access_token,
    fields: 'id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}',
    limit: '100',
  });

  const accounts: ConnectedAccount[] = [];
  for (const page of pages.data ?? []) {
    accounts.push({
      platform: 'facebook',
      externalId: page.id,
      displayName: page.name,
      avatarUrl: page.picture?.data?.url ?? null,
      accessToken: page.access_token,
      expiresAt: null,
    });
    const ig = page.instagram_business_account;
    if (ig) {
      accounts.push({
        platform: 'instagram',
        externalId: ig.id,
        displayName: ig.username ? `@${ig.username}` : page.name,
        avatarUrl: ig.profile_picture_url ?? null,
        accessToken: page.access_token,
        expiresAt: null,
        meta: { page_id: page.id },
      });
    }
  }
  return accounts;
}

export async function facebookPublish(account: StoredAccount, token: string, input: PublishInput): Promise<PublishResult> {
  const pageId = account.external_id;
  const result = input.imageUrl
    ? await graphPost(`/${pageId}/photos`, { url: input.imageUrl, caption: input.text, access_token: token })
    : await graphPost(`/${pageId}/feed`, { message: input.text, access_token: token });
  const postId = result.post_id || result.id;
  return { externalPostId: postId, externalUrl: `https://www.facebook.com/${postId}` };
}

export async function instagramPublish(account: StoredAccount, token: string, input: PublishInput): Promise<PublishResult> {
  if (!input.imageUrl) throw new Error('Instagram kërkon një imazh për çdo postim.');
  if (input.imageType && input.imageType !== 'image/jpeg') {
    throw new Error('Instagram pranon vetëm imazhe JPEG.');
  }
  const igId = account.external_id;
  const container = await graphPost(`/${igId}/media`, {
    image_url: input.imageUrl,
    caption: input.text.slice(0, 2200),
    access_token: token,
  });

  // Prisni derisa Instagram ta përpunojë imazhin
  for (let i = 0; i < 10; i++) {
    const status = await graphGet(`/${container.id}`, { fields: 'status_code', access_token: token });
    if (status.status_code === 'FINISHED') break;
    if (status.status_code === 'ERROR') throw new Error('Instagram nuk e përpunoi dot imazhin.');
    await new Promise(r => setTimeout(r, 1500));
  }

  const published = await graphPost(`/${igId}/media_publish`, { creation_id: container.id, access_token: token });
  const media = await graphGet(`/${published.id}`, { fields: 'permalink', access_token: token }).catch(() => null);
  return { externalPostId: published.id, externalUrl: media?.permalink ?? null };
}
