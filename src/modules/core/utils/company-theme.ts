import { setCssVar } from 'quasar';

export const DEFAULT_PRIMARY_COLOR = '#1976D2';
export const DEFAULT_SECONDARY_COLOR = '#26A69A';
export const COMPANY_THEME_STORAGE_KEY = 'company-theme';

export interface CompanyThemeColors {
  primaryColor: string;
  secondaryColor: string;
}

function normalizeHexColor(color?: string | null): string | null {
  if (!color) {
    return null;
  }

  const trimmed = color.trim();
  if (/^#[A-Fa-f0-9]{6}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^#[A-Fa-f0-9]{3}$/.test(trimmed)) {
    const hex = trimmed.slice(1);
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  }

  return null;
}

export function resolveCompanyTheme(
  primaryColor?: string | null,
  secondaryColor?: string | null,
): CompanyThemeColors {
  return {
    primaryColor: normalizeHexColor(primaryColor) ?? DEFAULT_PRIMARY_COLOR,
    secondaryColor: normalizeHexColor(secondaryColor) ?? DEFAULT_SECONDARY_COLOR,
  };
}

export function applyCompanyTheme(primaryColor?: string | null, secondaryColor?: string | null) {
  const theme = resolveCompanyTheme(primaryColor, secondaryColor);
  setCssVar('primary', theme.primaryColor);
  setCssVar('secondary', theme.secondaryColor);
  return theme;
}

export function saveCompanyTheme(theme: CompanyThemeColors) {
  localStorage.setItem(COMPANY_THEME_STORAGE_KEY, JSON.stringify(theme));
}

export function loadStoredCompanyTheme(): CompanyThemeColors | null {
  try {
    const raw = localStorage.getItem(COMPANY_THEME_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<CompanyThemeColors>;
    if (!parsed.primaryColor && !parsed.secondaryColor) {
      return null;
    }

    return resolveCompanyTheme(parsed.primaryColor, parsed.secondaryColor);
  } catch {
    return null;
  }
}
