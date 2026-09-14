import {
  EMPLOYEE_DOCUMENT_ACCEPT,
  employeeDocumentDisplayName,
  resolveEmployeeDocumentFileUrl,
} from '../document/employee-document-form';

export const EDUCATION_ATTACHMENT_ACCEPT = EMPLOYEE_DOCUMENT_ACCEPT;

export const educationAttachmentDisplayName = employeeDocumentDisplayName;

export const resolveEducationAttachmentUrl = resolveEmployeeDocumentFileUrl;

export type EducationAttachmentFields = {
  filePath?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  fileUrl?: string | null;
};

export function buildMultipartBody(
  payload: Record<string, unknown>,
  attachmentFile?: File | null,
): { body: BodyInit; useJsonContentType: boolean } {
  if (!attachmentFile) {
    return {
      body: JSON.stringify(payload),
      useJsonContentType: true,
    };
  }

  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    if (value === null) {
      formData.append(key, '');
      return;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      formData.append(key, String(value));
      return;
    }
    formData.append(key, JSON.stringify(value));
  });
  formData.append('attachmentFile', attachmentFile);

  return {
    body: formData,
    useJsonContentType: false,
  };
}
