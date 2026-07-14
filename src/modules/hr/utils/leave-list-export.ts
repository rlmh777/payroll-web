import * as XLSX from 'xlsx';
import { formatLeaveStatus } from '@hr/utils/leave-status';
import type { TeamLeaveRow } from '@hr/stores/employee-leave-store';

function formatDays(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '';
  }
  return Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 2);
}

export function exportTeamLeavesToExcel(rows: TeamLeaveRow[]): void {
  const sheetRows = [
    [
      'Employee',
      'Employee code',
      'Date range',
      'Start date',
      'End date',
      'Leave type',
      'Department',
      'Work site',
      'Net leave balance (days)',
      'Requested days',
      'Status',
      'Request notes',
      'Decision comment',
    ],
    ...rows.map((row) => [
      row.employeeName,
      row.employeeCode ?? '',
      row.dateRange,
      row.startDate ?? '',
      row.endDate ?? '',
      row.leaveType ?? '',
      row.departmentName ?? '',
      row.worksiteName ?? '',
      formatDays(row.netLeaveBalance),
      formatDays(row.requestedDays),
      formatLeaveStatus(row.statusCode, row.statusName),
      row.notes ?? '',
      row.statusNote ?? '',
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leave List');

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `leave-list_${stamp}.xlsx`);
}
