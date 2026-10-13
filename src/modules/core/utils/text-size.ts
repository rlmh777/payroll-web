export const TEXT_SIZES = ['sm', 'md', 'lg'] as const;

export type TextSize = (typeof TEXT_SIZES)[number];

export const DEFAULT_TEXT_SIZE: TextSize = 'sm';

export function normalizeTextSize(value: unknown): TextSize {
  return TEXT_SIZES.includes(value as TextSize) ? (value as TextSize) : DEFAULT_TEXT_SIZE;
}

export function applyTextSize(value: unknown): TextSize {
  const next = normalizeTextSize(value);
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.textSize = next;
  }

  return next;
}
