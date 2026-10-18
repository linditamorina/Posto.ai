// Bashkon pjesët e postimit të gjeneruar në një tekst gati për publikim
export function composePostText(p: Record<string, unknown>): string {
  const tags = Array.isArray(p.hashtags)
    ? p.hashtags.map(t => `#${String(t).replace(/^#/, '')}`).join(' ')
    : typeof p.hashtags === 'string' ? p.hashtags : '';
  return [p.hook || p.title, p.caption || p.content, p.cta, tags]
    .map(part => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join('\n\n');
}

// Gjen listën e postimeve kudo që ndodhet në objektin e ruajtur
export function extractPosts(content: unknown): Record<string, unknown>[] {
  let raw = content as Record<string, unknown> | unknown[] | string | null;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { return []; }
  }
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const obj = raw as Record<string, { posts?: unknown[] }> | null;
  return ((obj?.posts as unknown[]) || obj?.data?.posts || []) as Record<string, unknown>[];
}
