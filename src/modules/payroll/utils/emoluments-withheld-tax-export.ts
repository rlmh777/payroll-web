import ExcelJS from 'exceljs';
import { stampExcelJsHeader } from '@payroll/utils/save-report-workbook';
import type {
  EmolumentsMonthValues,
  EmolumentsWithheldTaxReport,
} from '@payroll/stores/reports-store';

const FIELD_KEYS = ['weeks', 'emoluments', 'taxableBenefit', 'commission', 'taxWithheld'] as const;

type FieldKey = (typeof FIELD_KEYS)[number];

const ACCOUNTING = '_(* #,##0.00_);_(* (#,##0.00);_(* "-"??_);_(@_)';
const HEADER_FONT = { name: 'Arial', size: 9, bold: true };
const DATA_FONT = { name: 'Arial', size: 10 };
const THIN = { style: 'thin' as const };
const MEDIUM = { style: 'medium' as const };
const SPACER_FILL = {
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb: 'FFD9D9D9' },
};

interface FieldColumn {
  index: number;
  key: FieldKey;
  month: number | 'total';
}

function columnLetter(index: number): string {
  let current = index;
  let letters = '';
  while (current > 0) {
    const remainder = (current - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    current = Math.floor((current - 1) / 26);
  }
  return letters;
}

function bucket(
  months: Record<string, EmolumentsMonthValues | null> | undefined,
  month: number,
): EmolumentsMonthValues | null {
  if (!months) {
    return null;
  }
  return months[String(month)] ?? null;
}

function applyHeaderCell(cell: ExcelJS.Cell, value: string | number) {
  cell.value = value;
  cell.font = HEADER_FONT;
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
}

export function exportEmolumentsWithheldTaxExcel(report: EmolumentsWithheldTaxReport): void {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 3 }],
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  const fieldColumns: FieldColumn[] = [];
  const spacerColumns: number[] = [];
  let column = 3;

  report.months.forEach((month) => {
    FIELD_KEYS.forEach((key, offset) => {
      fieldColumns.push({ index: column + offset, key, month: month.value });
    });
    sheet.mergeCells(2, column, 2, column + 4);
    spacerColumns.push(column + 5);
    column += 6;
  });

  const totalStart = column;
  FIELD_KEYS.forEach((key, offset) => {
    fieldColumns.push({ index: totalStart + offset, key, month: 'total' });
  });
  sheet.mergeCells(2, totalStart, 2, totalStart + 4);
  const trailingSpacer = totalStart + 5;
  spacerColumns.push(trailingSpacer);
  const lastColumn = trailingSpacer;

  sheet.mergeCells(2, 1, 3, 1);
  sheet.mergeCells(2, 2, 3, 2);
  applyHeaderCell(sheet.getCell(2, 1), 'TIN');
  applyHeaderCell(sheet.getCell(2, 2), 'Name');
  sheet.getCell(2, 2).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  report.months.forEach((month) => {
    const start = fieldColumns.find((entry) => entry.month === month.value && entry.key === 'weeks');
    if (!start) {
      return;
    }
    applyHeaderCell(sheet.getCell(2, start.index), month.label);
  });
  applyHeaderCell(sheet.getCell(2, totalStart), 'TOTAL');

  fieldColumns.forEach((entry) => {
    const label = report.fields.find((field) => field.key === entry.key)?.label ?? entry.key;
    applyHeaderCell(sheet.getCell(3, entry.index), label);
  });

  sheet.getColumn(1).width = 9.14;
  sheet.getColumn(2).width = 20.43;
  for (let index = 3; index <= lastColumn; index += 1) {
    sheet.getColumn(index).width = spacerColumns.includes(index) ? 0.86 : 12.57;
  }
  sheet.getRow(1).height = 12.75;
  sheet.getRow(2).height = 15;
  sheet.getRow(3).height = 33;

  const firstDataRow = 4;
  report.rows.forEach((row, rowOffset) => {
    const excelRow = firstDataRow + rowOffset;
    const tinCell = sheet.getCell(excelRow, 1);
    const nameCell = sheet.getCell(excelRow, 2);
    tinCell.value = row.tin;
    tinCell.numFmt = '@';
    tinCell.alignment = { horizontal: 'left', vertical: 'middle' };
    nameCell.value = row.name;
    nameCell.numFmt = '@';
    nameCell.alignment = { horizontal: 'right', vertical: 'middle' };
    tinCell.font = DATA_FONT;
    nameCell.font = DATA_FONT;

    fieldColumns.forEach((entry) => {
      const cell = sheet.getCell(excelRow, entry.index);
      cell.font = DATA_FONT;
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      if (entry.month === 'total') {
        const parts = fieldColumns
          .filter((source) => source.month !== 'total' && source.key === entry.key)
          .map((source) => `${columnLetter(source.index)}${excelRow}`);
        cell.value = parts.length ? { formula: parts.join('+') } : 0;
        cell.numFmt = entry.key === 'weeks' ? '0' : ACCOUNTING;
        return;
      }

      const values = bucket(row.months, entry.month) ?? {
        weeks: 0,
        emoluments: 0,
        taxableBenefit: 0,
        commission: 0,
        taxWithheld: 0,
      };
      const value = values[entry.key];
      if (entry.key === 'weeks') {
        cell.value = value ?? 0;
        cell.numFmt = '0';
        return;
      }
      cell.value = Number(value ?? 0);
      cell.numFmt = ACCOUNTING;
    });
    sheet.getRow(excelRow).height = 12.75;
  });

  const lastDataRow = firstDataRow + report.rows.length - 1;
  const totalRow = lastDataRow + 1;
  const totalLabel = sheet.getCell(totalRow, 1);
  totalLabel.value = 'Total';
  totalLabel.font = { name: 'Arial', size: 10, bold: true };
  sheet.getRow(totalRow).height = 14.25;

  fieldColumns.forEach((entry) => {
    if (entry.key === 'weeks') {
      return;
    }
    const cell = sheet.getCell(totalRow, entry.index);
    const letter = columnLetter(entry.index);
    cell.value = { formula: `SUM(${letter}${firstDataRow}:${letter}${lastDataRow})` };
    cell.font = DATA_FONT;
    cell.numFmt = ACCOUNTING;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  spacerColumns.forEach((columnNumber) => {
    const top = sheet.getCell(1, columnNumber);
    top.fill = SPACER_FILL;
    top.border = { top: MEDIUM };
    top.font = { name: 'Arial', size: 9 };
  });

  for (let rowNumber = 2; rowNumber <= totalRow; rowNumber += 1) {
    for (let columnNumber = 1; columnNumber <= lastColumn; columnNumber += 1) {
      const cell = sheet.getCell(rowNumber, columnNumber);
      const isSpacer = spacerColumns.includes(columnNumber);
      const isData = rowNumber >= firstDataRow && rowNumber < totalRow;
      const isTotal = rowNumber === totalRow;
      const isWeeks = fieldColumns.some((entry) => entry.index === columnNumber && entry.key === 'weeks');
      const isTaxWithheld = fieldColumns.some((entry) => entry.index === columnNumber && entry.key === 'taxWithheld');
      const isTotalBlock = columnNumber >= totalStart && columnNumber <= totalStart + 4;

      if (isSpacer) {
        cell.fill = SPACER_FILL;
      }

      if (isData) {
        cell.border = { left: THIN, right: THIN, bottom: THIN };
        continue;
      }

      if (isTotal) {
        cell.border = {
          top: MEDIUM,
          bottom: MEDIUM,
          left: columnNumber === 1 || isWeeks || (isTotalBlock && columnNumber === totalStart) ? MEDIUM : THIN,
          right: columnNumber === 2 || isTaxWithheld ? MEDIUM : THIN,
        };
        continue;
      }

      if (rowNumber === 2) {
        if (isSpacer) {
          cell.border = { top: MEDIUM, bottom: THIN };
          continue;
        }
        if (columnNumber === 1) {
          cell.border = { left: MEDIUM, right: THIN, top: MEDIUM, bottom: MEDIUM };
          continue;
        }
        if (columnNumber === 2) {
          cell.border = { left: THIN, right: MEDIUM, top: MEDIUM, bottom: MEDIUM };
          continue;
        }
        if (isTotalBlock) {
          cell.border = {
            left: columnNumber === totalStart ? MEDIUM : THIN,
            right: columnNumber === totalStart + 4 ? MEDIUM : THIN,
            top: MEDIUM,
            bottom: MEDIUM,
          };
          continue;
        }
        cell.border = {
          left: isWeeks ? MEDIUM : THIN,
          right: isTaxWithheld ? MEDIUM : THIN,
          top: MEDIUM,
          bottom: THIN,
        };
        continue;
      }

      if (isSpacer) {
        cell.border = { top: THIN, bottom: MEDIUM };
        continue;
      }
      cell.border = {
        left: isWeeks || columnNumber === 1 ? MEDIUM : THIN,
        right: isTaxWithheld || columnNumber === 2 ? MEDIUM : THIN,
        top: THIN,
        bottom: MEDIUM,
      };
    }
  }

  stampExcelJsHeader(workbook, sheet, {
    title: 'Emoluments and Withheld Tax',
    period: String(report.year),
  });

  void workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${report.year} EMMOLUMENTS AND WITHHELD TAX.xlsx`;
    anchor.click();
    URL.revokeObjectURL(url);
  });
}
