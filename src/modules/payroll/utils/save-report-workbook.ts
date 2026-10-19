import ExcelJS from 'exceljs';
import { getActivePinia } from 'pinia';
import * as XLSX from 'xlsx';
import { useDocumentHeaderStore } from '@payroll/stores/document-header-store';
import {
  renderDocumentHeader,
  type DocumentHeaderContext,
} from '@payroll/utils/document-header';

export function renderedReportHeader(context: DocumentHeaderContext = {}) {
  const pinia = getActivePinia();
  if (!pinia) {
    return null;
  }
  const store = useDocumentHeaderStore(pinia);
  const header = store.activeHeader;
  if (!header) {
    return null;
  }
  return renderDocumentHeader(header, store.fields, context);
}

export function documentHeaderHtml(context: DocumentHeaderContext = {}): string {
  const image = renderedReportHeader(context);
  if (!image) {
    return '';
  }
  return `<img src="${image.dataUrl}" alt="" style="width:100%;max-height:${image.height}px;object-fit:contain;object-position:left center;margin-bottom:12px;" />`;
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function downloadBlob(data: BlobPart, filename: string, type: string): void {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function stampExcelJsHeader(
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
  context: DocumentHeaderContext = {},
): void {
  const image = renderedReportHeader(context);
  if (!image) {
    return;
  }

  const rowSpan = Math.max(1, Math.ceil(image.height / 18));
  const blanks = Array.from({ length: rowSpan }, () => []);
  sheet.spliceRows(1, 0, ...blanks);
  const imageId = workbook.addImage({
    base64: image.dataUrl.replace(/^data:image\/png;base64,/, ''),
    extension: 'png',
  });
  sheet.addImage(imageId, {
    tl: { col: 0, row: 0 },
    ext: { width: Math.min(image.width, 720), height: image.height },
  });
  sheet.views = sheet.views.map((view) => {
    if (view.state === 'frozen' && typeof view.ySplit === 'number' && view.ySplit > 0) {
      return { ...view, ySplit: view.ySplit + rowSpan };
    }
    return view;
  });
}

export async function downloadXlsxBuffer(
  buffer: ArrayBuffer,
  filename: string,
  context: DocumentHeaderContext = {},
): Promise<void> {
  if (!renderedReportHeader(context)) {
    downloadBlob(buffer, filename, XLSX_MIME);
    return;
  }

  const excel = new ExcelJS.Workbook();
  await excel.xlsx.load(buffer);
  const sheet = excel.worksheets[0];
  if (!sheet) {
    downloadBlob(buffer, filename, XLSX_MIME);
    return;
  }

  stampExcelJsHeader(excel, sheet, context);
  const stamped = await excel.xlsx.writeBuffer();
  downloadBlob(stamped, filename, XLSX_MIME);
}

export async function saveReportWorkbook(
  workbook: XLSX.WorkBook,
  filename: string,
  context: DocumentHeaderContext = {},
): Promise<void> {
  if (!renderedReportHeader(context)) {
    XLSX.writeFile(workbook, filename);
    return;
  }

  const raw = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  await downloadXlsxBuffer(raw, filename, context);
}
