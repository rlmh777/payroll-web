declare module 'xlsx' {
  export interface WorkBook {
    SheetNames: string[];
    Sheets: Record<string, WorkSheet>;
  }

  export interface WorkSheet {
    [cell: string]: unknown;
  }

  export const utils: {
    sheet_to_json<T = unknown>(worksheet: WorkSheet, options?: Record<string, unknown>): T[];
    aoa_to_sheet<T = unknown>(data: T[][]): WorkSheet;
    book_new(): WorkBook;
    book_append_sheet(workbook: WorkBook, worksheet: WorkSheet, name?: string): void;
  };

  export function read(data: ArrayBuffer | Uint8Array, options?: Record<string, unknown>): WorkBook;
  export function writeFile(workbook: WorkBook, filename: string, options?: Record<string, unknown>): void;
}

declare module 'jspreadsheet-ce' {
  export interface WorksheetInstance {
    getData(): unknown[][];
    insertRow(row: unknown[]): void;
    deleteRow(rowIndex: number, count: number): void;
    getSelectedRows(): number[];
  }

  export interface JspreadsheetInstanceElement extends HTMLElement {
    jspreadsheet?: unknown;
  }

  export interface WorksheetOptions {
    data?: unknown[][];
    columns?: Record<string, unknown>[];
    editable?: boolean;
    allowDeleteColumn?: boolean;
    allowDeleteRow?: boolean;
    allowDeletingAllRows?: boolean;
    allowInsertColumn?: boolean;
    allowInsertRow?: boolean;
    allowManualInsertColumn?: boolean;
    allowManualInsertRow?: boolean;
    allowRenameColumn?: boolean;
    columnDrag?: boolean;
    columnSorting?: boolean;
    rowDrag?: boolean;
    tableOverflow?: boolean;
    tableHeight?: string;
    tableWidth?: string;
    wordWrap?: boolean;
    minDimensions?: [number, number];
  }

  export interface SpreadsheetOptions {
    about?: boolean;
    allowExport?: boolean;
    onchange?: (instance: WorksheetInstance) => void;
    oninsertrow?: (instance: WorksheetInstance) => void;
    ondeleterow?: (instance: WorksheetInstance) => void;
    worksheets?: WorksheetOptions[];
  }

  declare function jspreadsheet(
    element: HTMLElement,
    options: SpreadsheetOptions,
  ): WorksheetInstance[];

  namespace jspreadsheet {
    function destroy(element: JspreadsheetInstanceElement, force?: boolean): void;
  }

  export default jspreadsheet;
}

declare module '@quasar/quasar-ui-qcalendar' {
  import type { DefineComponent } from 'vue';

  export const QCalendar: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
}
