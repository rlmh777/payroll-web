/**
 * Stable avatar initials + color helpers for user cards/details.
 */

const AVATAR_COLORS = [
  '#2563eb', // blue
  '#059669', // emerald
  '#d97706', // amber
  '#7c3aed', // violet
  '#db2777', // pink
  '#0891b2', // cyan
  '#b45309', // brown/amber
  '#4b5563', // slate
  '#dc2626', // red
  '#0284c7', // sky
  '#0f766e', // teal
  '#9333ea', // purple
  '#ea580c', // orange
  '#1d4ed8', // indigo
  '#be123c', // rose
  '#65a30d', // lime
  '#c2410c', // deep orange
  '#6d28d9', // deep violet
  '#0e7490', // deep cyan
  '#9f1239', // deep rose
] as const;

export function getUserInitials(name: string | undefined | null): string {
  if (!name?.trim()) return '?';

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0]?.[0];
    const last = parts[parts.length - 1]?.[0];
    if (first && last) {
      return `${first}${last}`.toUpperCase();
    }
  }

  return name.trim().charAt(0).toUpperCase();
}

/** Hash full name/email so similar first letters still get distinct colors. */
export function getUserAvatarColor(seed: string | undefined | null): string {
  const value = (seed ?? '').trim().toLowerCase();
  if (!value) return AVATAR_COLORS[0];

  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }

  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}
