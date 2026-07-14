export const EMPLOYEE_DOCUMENT_ACCEPT = [
  '.pdf',
  '.doc',
  '.docx',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.xls',
  '.xlsx',
  '.txt',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
].join(',');

export function employeeDocumentDisplayName(
  fileName?: string | null,
  filePath?: string | null,
): string | null {
  if (fileName?.trim()) {
    return fileName.trim();
  }

  if (!filePath) {
    return null;
  }

  const parts = filePath.split('/');
  return parts[parts.length - 1] || null;
}

export function nameFromUploadedFile(file: File | null): string {
  if (!file?.name) {
    return '';
  }

  const baseName = file.name.replace(/\.[^.]+$/, '');
  return baseName.trim();
}

export function resolveEmployeeDocumentFileUrl(
  fileUrl?: string | null,
  filePath?: string | null,
): string | null {
  if (fileUrl?.trim()) {
    return fileUrl.trim();
  }

  if (!filePath?.trim()) {
    return null;
  }

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}/storage/${filePath.replace(/^\//, '')}`;
}
