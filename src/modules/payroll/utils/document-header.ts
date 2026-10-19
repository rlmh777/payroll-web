export interface DocumentHeaderElement {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  field: string | null;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  align: 'left' | 'center' | 'right';
  color: string;
}

export interface DocumentHeaderCanvas {
  width: number;
  height: number;
  background: string;
  elements: DocumentHeaderElement[];
}

export interface DocumentHeader {
  id: string;
  name: string;
  kind: 'company' | 'government' | 'custom';
  isSystem: boolean;
  canvas: DocumentHeaderCanvas;
}

export interface DocumentHeaderContext {
  title?: string;
  period?: string;
}

export const HEADER_FIELD_OPTIONS = [
  { label: 'Company name', token: '{{company.name}}' },
  { label: 'Company alias', token: '{{company.alias}}' },
  { label: 'Address', token: '{{company.address}}' },
  { label: 'Street', token: '{{company.street}}' },
  { label: 'Email', token: '{{company.email}}' },
  { label: 'Phone', token: '{{company.phone}}' },
  { label: 'TIN', token: '{{company.tin}}' },
  { label: 'Social security number', token: '{{company.socialSecurity}}' },
  { label: 'Report title', token: '{{report.title}}' },
  { label: 'Report period', token: '{{report.period}}' },
];

export const NONE_HEADER_ID = 'none';

export const GOVERNMENT_REPORT_IDS = new Set([
  'paye',
  'social-security-payments-by-month',
  'social-security-contributions',
  'social-security-deduction',
  'gst-calculator',
]);

/** Reports whose own layout is the heading until a configured header is chosen. */
export const REPORTS_DEFAULT_NONE = new Set([
  'td4-summary',
  'td4-supplementary',
  'emoluments-withheld-tax',
  'paye-employment-details',
  'paye-reconciliation-employee-details',
  'bank-upload',
]);

const TOKEN = /\{\{\s*([a-zA-Z0-9.]+)\s*\}\}/g;

let logoImage: HTMLImageElement | null = null;
let logoSrc = '';

export function resolveHeaderText(
  text: string,
  fields: Record<string, string>,
  context: DocumentHeaderContext = {},
): string {
  const values: Record<string, string> = {
    ...fields,
    'report.title': context.title ?? '',
    'report.period': context.period ?? '',
  };

  return text.replace(TOKEN, (_match, key: string) => values[key] ?? '').replace(/\s+/g, ' ').trim();
}

export async function preloadHeaderLogo(src: string): Promise<void> {
  if (!src) {
    logoImage = null;
    logoSrc = '';
    return;
  }
  if (logoSrc === src && logoImage) {
    return;
  }
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = src;
  try {
    await image.decode();
    logoImage = image;
    logoSrc = src;
  } catch {
    logoImage = null;
    logoSrc = '';
  }
}

export function renderDocumentHeader(
  header: DocumentHeader,
  fields: Record<string, string>,
  context: DocumentHeaderContext = {},
): { dataUrl: string; width: number; height: number } | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const canvas = header.canvas;
  const surface = document.createElement('canvas');
  surface.width = canvas.width;
  surface.height = canvas.height;
  const context2d = surface.getContext('2d');
  if (!context2d) {
    return null;
  }

  context2d.fillStyle = canvas.background || '#ffffff';
  context2d.fillRect(0, 0, canvas.width, canvas.height);

  canvas.elements.forEach((element) => {
    if (element.type === 'image') {
      if (logoImage && (element.field === 'company.logo' || !element.field)) {
        context2d.drawImage(logoImage, element.x, element.y, element.width, element.height);
      }
      return;
    }

    const text = resolveHeaderText(element.text || '', fields, context);
    if (!text) {
      return;
    }
    context2d.fillStyle = element.color || '#000000';
    context2d.font = `${element.fontWeight === 'bold' ? '700' : '400'} ${element.fontSize}px Arial`;
    context2d.textBaseline = 'top';
    const align = element.align || 'left';
    context2d.textAlign = align;
    const x = align === 'center'
      ? element.x + element.width / 2
      : align === 'right'
        ? element.x + element.width
        : element.x;
    wrapText(context2d, text, x, element.y, element.width, element.fontSize + 2, element.height);
  });

  return {
    dataUrl: surface.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height,
  };
}

function wrapText(
  context2d: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxHeight: number,
): void {
  const words = text.split(' ');
  let line = '';
  let cursor = y;
  words.forEach((word, index) => {
    const next = line ? `${line} ${word}` : word;
    if (context2d.measureText(next).width > maxWidth && line) {
      if (cursor + lineHeight <= y + maxHeight) {
        context2d.fillText(line, x, cursor);
      }
      line = word;
      cursor += lineHeight;
      return;
    }
    line = next;
    if (index === words.length - 1 && cursor + lineHeight <= y + maxHeight + lineHeight) {
      context2d.fillText(line, x, cursor);
    }
  });
}

export function emptyTextElement(partial: Partial<DocumentHeaderElement> = {}): DocumentHeaderElement {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    x: 24,
    y: 24,
    width: 320,
    height: 28,
    text: 'Text',
    field: null,
    fontSize: 16,
    fontWeight: 'normal',
    align: 'left',
    color: '#222222',
    ...partial,
  };
}
