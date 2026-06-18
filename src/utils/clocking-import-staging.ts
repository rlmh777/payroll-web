export const MAX_CLOCKING_IMPORT_ROWS = 5000;

export type ClockingImportField = 'biometricUserId' | 'deviceId' | 'punchDateTime' | 'punchType';

export interface ClockingImportStagingRow {
  biometricUserId: string;
  deviceId: string;
  punchDateTime: string;
  punchType: string;
}

export interface ClockingImportPayloadRow {
  biometricUserId: string;
  deviceId: string | null;
  punchDateTime: string;
  punchType: 'IN' | 'OUT' | null;
}

export interface ClockingImportIssue {
  id: string;
  rowNumber: number;
  field: ClockingImportField;
  message: string;
}

export interface ClockingImportValidation {
  totalRows: number;
  blankRows: number;
  issueRowCount: number;
  issues: ClockingImportIssue[];
  validRows: ClockingImportPayloadRow[];
  exceedsMaximum: boolean;
}

type HeaderKey =
  | ClockingImportField
  | 'punchDate'
  | 'punchTime'
  | 'punchIn'
  | 'punchOut'
  | 'punchInDeviceId'
  | 'punchOutDeviceId';

const HEADER_ALIASES: Record<HeaderKey, string[]> = {
  biometricUserId: [
    'biometricuserid',
    'userid',
    'employeeid',
    'employeecode',
    'enrollid',
    'badgeid',
    'badgeno',
    'cardno',
    'cardnumber',
    'personid',
    'staffid',
  ],
  deviceId: ['deviceid', 'machineid', 'terminalid', 'readerid', 'reader', 'terminal', 'siteid'],
  punchDateTime: [
    'punchdatetime',
    'datetime',
    'timestamp',
    'eventdatetime',
    'clockdatetime',
    'transactiondatetime',
    'eventtimestamp',
  ],
  punchType: ['punchtype', 'eventtype', 'clocktype', 'status', 'inout', 'direction', 'event', 'action'],
  punchDate: ['date', 'workdate', 'attendancedate', 'punchdate', 'transactiondate'],
  punchTime: ['time', 'eventtime', 'clocktime', 'punchtime', 'transactiontime'],
  punchIn: ['punchin', 'punchintime', 'clockin', 'clockintime', 'checkin', 'checkintime', 'timein'],
  punchOut: [
    'punchout',
    'punchouttime',
    'clockout',
    'clockouttime',
    'checkout',
    'checkouttime',
    'timeout',
  ],
  punchInDeviceId: ['punchindeviceid', 'clockindeviceid', 'checkindeviceid', 'sitepunchin', 'punchinsite'],
  punchOutDeviceId: [
    'punchoutdeviceid',
    'clockoutdeviceid',
    'checkoutdeviceid',
    'sitepunchout',
    'punchoutsite',
  ],
};

export const CLOCKING_IMPORT_COLUMNS: {
  field: ClockingImportField;
  title: string;
  width: number;
  help: string;
}[] = [
  {
    field: 'biometricUserId',
    title: 'Employee / Biometric ID',
    width: 230,
    help: 'Required identifier used by the clocking device.',
  },
  {
    field: 'deviceId',
    title: 'Device / Site ID',
    width: 190,
    help: 'Optional. Blank values use the default device ID.',
  },
  {
    field: 'punchDateTime',
    title: 'Punch Date & Time',
    width: 260,
    help: 'Required date and time, for example 2026-05-25 08:00.',
  },
  {
    field: 'punchType',
    title: 'Punch Type',
    width: 150,
    help: 'Optional IN or OUT value.',
  },
];

function toCellString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value).trim();
  }

  return '';
}

function normalizeHeader(value: unknown): string {
  return toCellString(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function resolveHeaderMap(header: unknown[]): Partial<Record<HeaderKey, number>> {
  const map: Partial<Record<HeaderKey, number>> = {};

  header.forEach((value, index) => {
    const normalized = normalizeHeader(value);

    for (const [key, aliases] of Object.entries(HEADER_ALIASES) as [HeaderKey, string[]][]) {
      if (aliases.includes(normalized)) {
        map[key] = index;
      }
    }
  });

  return map;
}

function columnValue(row: unknown[], index: number | undefined): string {
  return index === undefined ? '' : toCellString(row[index]);
}

function combineDateAndTime(date: string, time: string): string {
  if (!time) {
    return date;
  }

  if (!date || /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(time)) {
    return time;
  }

  return `${date} ${time}`.trim();
}

function normalizePunchType(value: string): string {
  const normalized = value.toUpperCase().trim();

  if (['IN', 'I', 'PUNCH IN', 'PUNCH-IN', 'CLOCK IN', 'CLOCK-IN', 'CHECK IN', 'CHECK-IN'].includes(normalized)) {
    return 'IN';
  }

  if (
    ['OUT', 'O', 'PUNCH OUT', 'PUNCH-OUT', 'CLOCK OUT', 'CLOCK-OUT', 'CHECK OUT', 'CHECK-OUT'].includes(
      normalized,
    )
  ) {
    return 'OUT';
  }

  return normalized;
}

function isBlankRow(row: ClockingImportStagingRow): boolean {
  return CLOCKING_IMPORT_COLUMNS.every(({ field }) => row[field].trim() === '');
}

function isRecognizedDateTime(value: string): boolean {
  if (!Number.isNaN(Date.parse(value))) {
    return true;
  }

  const commonDateTime = value.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s?(AM|PM))?)?$/i,
  );

  if (!commonDateTime) {
    return false;
  }

  const firstDatePart = Number(commonDateTime[1]);
  const secondDatePart = Number(commonDateTime[2]);
  const hours = Number(commonDateTime[4] ?? 0);
  const minutes = Number(commonDateTime[5] ?? 0);
  const seconds = Number(commonDateTime[6] ?? 0);
  const hasValidDateOrder =
    (firstDatePart >= 1 && firstDatePart <= 12 && secondDatePart >= 1 && secondDatePart <= 31) ||
    (firstDatePart >= 1 && firstDatePart <= 31 && secondDatePart >= 1 && secondDatePart <= 12);

  return hasValidDateOrder && hours <= 23 && minutes <= 59 && seconds <= 59;
}

function buildEventRow(
  biometricUserId: string,
  deviceId: string,
  punchDateTime: string,
  punchType: string,
): ClockingImportStagingRow {
  return {
    biometricUserId,
    deviceId,
    punchDateTime,
    punchType: normalizePunchType(punchType),
  };
}

export function buildClockingStagingRows(sourceRows: unknown[][], hasHeader: boolean): ClockingImportStagingRow[] {
  const nonBlankRows = sourceRows.filter((row) => row.some((value) => toCellString(value) !== ''));
  let headerMap = hasHeader ? resolveHeaderMap(nonBlankRows[0] ?? []) : {};
  const dataRows = hasHeader ? nonBlankRows.slice(1) : nonBlankRows;
  const hasRecognizedEventColumns =
    headerMap.biometricUserId !== undefined ||
    headerMap.punchDateTime !== undefined ||
    headerMap.punchIn !== undefined ||
    headerMap.punchOut !== undefined;

  if (hasHeader && !hasRecognizedEventColumns) {
    headerMap = {
      biometricUserId: 0,
      deviceId: 1,
      punchDateTime: 2,
      punchType: 3,
    };
  }

  return dataRows.flatMap((row) => {
    if (!hasHeader) {
      return [
        buildEventRow(
          columnValue(row, 0),
          columnValue(row, 1),
          columnValue(row, 2),
          columnValue(row, 3),
        ),
      ];
    }

    const biometricUserId = columnValue(row, headerMap.biometricUserId);
    const deviceId = columnValue(row, headerMap.deviceId);
    const punchDate = columnValue(row, headerMap.punchDate);
    const punchIn = columnValue(row, headerMap.punchIn);
    const punchOut = columnValue(row, headerMap.punchOut);

    if (punchIn || punchOut) {
      const punchRows: ClockingImportStagingRow[] = [];

      if (punchIn) {
        punchRows.push(
          buildEventRow(
            biometricUserId,
            columnValue(row, headerMap.punchInDeviceId) || deviceId,
            combineDateAndTime(punchDate, punchIn),
            'IN',
          ),
        );
      }

      if (punchOut) {
        punchRows.push(
          buildEventRow(
            biometricUserId,
            columnValue(row, headerMap.punchOutDeviceId) || deviceId,
            combineDateAndTime(punchDate, punchOut),
            'OUT',
          ),
        );
      }

      return punchRows;
    }

    const punchDateTime =
      columnValue(row, headerMap.punchDateTime) ||
      combineDateAndTime(punchDate, columnValue(row, headerMap.punchTime));

    return [
      buildEventRow(
        biometricUserId,
        deviceId,
        punchDateTime,
        columnValue(row, headerMap.punchType),
      ),
    ];
  });
}

export function clockingRowsToGridData(rows: ClockingImportStagingRow[]): string[][] {
  return rows.map((row) => CLOCKING_IMPORT_COLUMNS.map(({ field }) => row[field]));
}

export function gridDataToClockingRows(rows: unknown[][]): ClockingImportStagingRow[] {
  return rows.map((row) => ({
    biometricUserId: columnValue(row, 0),
    deviceId: columnValue(row, 1),
    punchDateTime: columnValue(row, 2),
    punchType: normalizePunchType(columnValue(row, 3)),
  }));
}

export function validateClockingStagingRows(
  rows: ClockingImportStagingRow[],
  defaultDeviceId = '',
): ClockingImportValidation {
  const issues: ClockingImportIssue[] = [];
  const validRows: ClockingImportPayloadRow[] = [];
  const issueRows = new Set<number>();
  let totalRows = 0;
  let blankRows = 0;

  function addIssue(rowNumber: number, field: ClockingImportField, message: string) {
    issues.push({
      id: `${rowNumber}-${field}-${issues.length}`,
      rowNumber,
      field,
      message,
    });
    issueRows.add(rowNumber);
  }

  rows.forEach((row, index) => {
    const rowNumber = index + 1;

    if (isBlankRow(row)) {
      blankRows += 1;
      return;
    }

    totalRows += 1;
    const biometricUserId = row.biometricUserId.trim();
    const deviceId = row.deviceId.trim() || defaultDeviceId.trim();
    const punchDateTime = row.punchDateTime.trim();
    const punchType = normalizePunchType(row.punchType);

    if (!biometricUserId) {
      addIssue(rowNumber, 'biometricUserId', 'Employee / biometric ID is required.');
    } else if (biometricUserId.length > 255) {
      addIssue(rowNumber, 'biometricUserId', 'Employee / biometric ID must be 255 characters or fewer.');
    }

    if (deviceId.length > 255) {
      addIssue(rowNumber, 'deviceId', 'Device / site ID must be 255 characters or fewer.');
    }

    if (!punchDateTime) {
      addIssue(rowNumber, 'punchDateTime', 'Punch date and time is required.');
    } else if (!isRecognizedDateTime(punchDateTime)) {
      addIssue(rowNumber, 'punchDateTime', 'Punch date and time is not a recognized date format.');
    }

    if (punchType && punchType !== 'IN' && punchType !== 'OUT') {
      addIssue(rowNumber, 'punchType', 'Punch type must be IN, OUT, or blank.');
    }

    if (!issueRows.has(rowNumber)) {
      validRows.push({
        biometricUserId,
        deviceId: deviceId || null,
        punchDateTime,
        punchType: punchType === 'IN' || punchType === 'OUT' ? punchType : null,
      });
    }
  });

  return {
    totalRows,
    blankRows,
    issueRowCount: issueRows.size,
    issues,
    validRows,
    exceedsMaximum: validRows.length > MAX_CLOCKING_IMPORT_ROWS,
  };
}
