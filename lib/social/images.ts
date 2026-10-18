import { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'post-images';

export interface PreparedImage {
  url: string;
  bytes: Buffer;
  type: string;
}

// Imazhet ruhen si data URL në tabelën posts; platformat kërkojnë link publik,
// prandaj e ngarkojmë në Supabase Storage (një herë për çdo postim).
export async function prepareImage(
  supabase: SupabaseClient,
  userId: string,
  postId: string,
  image: string | null,
): Promise<PreparedImage | null> {
  if (!image) return null;

  if (/^https?:\/\//.test(image)) {
    const res = await fetch(image);
    if (!res.ok) throw new Error('Imazhi i postimit nuk u shkarkua dot.');
    const type = res.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
    return { url: image, bytes: Buffer.from(await res.arrayBuffer()), type };
  }

  const match = image.match(/^data:(image\/[a-z+.-]+);base64,(.+)$/i);
  if (!match) return null;
  const type = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
  const bytes = Buffer.from(match[2], 'base64');
  const ext = type.split('/')[1].replace('jpeg', 'jpg').replace(/\+.*/, '');
  const path = `${userId}/${postId}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: type, upsert: true });
  if (error) throw new Error(`Ngarkimi i imazhit dështoi: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, bytes, type };
}
