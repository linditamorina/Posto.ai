// Etiketat dhe ngjyrat e platformave për UI
export const PLATFORM_INFO: Record<string, { label: string; icon: string; color: string }> = {
  linkedin: { label: "LinkedIn", icon: "in", color: "bg-[#0A66C2]" },
  facebook: { label: "Facebook", icon: "f", color: "bg-[#1877F2]" },
  instagram: { label: "Instagram", icon: "◎", color: "bg-gradient-to-br from-amber-500 via-pink-600 to-purple-600" },
};

export interface SocialAccount {
  id: string;
  platform: "linkedin" | "facebook" | "instagram";
  display_name: string | null;
  avatar_url: string | null;
  token_expires_at: string | null;
}

export function isExpired(a: SocialAccount) {
  return Boolean(a.token_expires_at && new Date(a.token_expires_at) < new Date());
}
