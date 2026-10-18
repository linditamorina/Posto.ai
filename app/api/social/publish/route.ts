import { NextResponse } from 'next/server';
import { getSupabaseAdmin, getUserFromRequest } from '@/lib/supabaseAdmin';
import { PUBLISHERS } from '@/lib/social';
import { decryptToken } from '@/lib/social/crypto';
import { prepareImage } from '@/lib/social/images';
import { composePostText, extractPosts } from '@/lib/social/text';
import { StoredAccount } from '@/lib/social/types';

// Instagram mund të marrë disa sekonda për të përpunuar imazhin
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Konfigurimi i bazës së të dhënave dështoi.' }, { status: 500 });
    const user = await getUserFromRequest(req, supabase);
    if (!user) return NextResponse.json({ error: 'Përdoruesi i paidentifikuar. Ju lutem lidhuni.' }, { status: 401 });

    const { postId, postIndex = 0, accountIds, text: customText } = await req.json();
    if (!postId || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json({ error: 'Zgjidhni të paktën një llogari.' }, { status: 400 });
    }

    const { data: post } = await supabase
      .from('posts')
      .select('id, content, reference_image')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single();
    if (!post) return NextResponse.json({ error: 'Postimi nuk u gjet.' }, { status: 404 });

    const item = extractPosts(post.content)[postIndex];
    const text = typeof customText === 'string' && customText.trim() ? customText.trim() : item ? composePostText(item) : '';
    if (!text) return NextResponse.json({ error: 'Postimi nuk ka tekst.' }, { status: 400 });

    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('id, platform, external_id, display_name, access_token_enc, token_expires_at, meta')
      .eq('user_id', user.id)
      .in('id', accountIds);
    if (!accounts?.length) return NextResponse.json({ error: 'Llogaritë nuk u gjetën.' }, { status: 404 });

    const image = await prepareImage(supabase, user.id, String(post.id), post.reference_image);
    const input = { text, imageUrl: image?.url ?? null, imageBytes: image?.bytes ?? null, imageType: image?.type ?? null };

    // Publikojmë paralelisht; një dështim nuk ndal të tjerat
    const results = await Promise.all((accounts as StoredAccount[]).map(async account => {
      try {
        if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
          throw new Error('Lidhja ka skaduar. Rilidhni llogarinë te faqja Accounts.');
        }
        const out = await PUBLISHERS[account.platform](account, decryptToken(account.access_token_enc), input);
        return { account, status: 'success' as const, ...out, error: null };
      } catch (err) {
        return { account, status: 'failed' as const, externalPostId: null, externalUrl: null, error: (err as Error).message };
      }
    }));

    await supabase.from('post_publications').insert(results.map(r => ({
      user_id: user.id,
      post_id: String(post.id),
      post_index: postIndex,
      social_account_id: r.account.id,
      platform: r.account.platform,
      status: r.status,
      external_post_id: r.externalPostId,
      external_url: r.externalUrl,
      error: r.error,
    })));

    return NextResponse.json({
      results: results.map(r => ({
        accountId: r.account.id,
        platform: r.account.platform,
        name: r.account.display_name,
        status: r.status,
        url: r.externalUrl,
        error: r.error,
      })),
    });
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
