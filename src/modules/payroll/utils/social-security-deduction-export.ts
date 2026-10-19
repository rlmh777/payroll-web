import { documentHeaderHtml, saveReportWorkbook } from '@payroll/utils/save-report-workbook';
import * as XLSX from 'xlsx';
import type {
  SocialSecurityDeductionDepartment,
  SocialSecurityDeductionEmployee,
  SocialSecurityDeductionReport,
} from '@payroll/stores/reports-store';

const HEADERS = [
  'Last Name',
  'First Name',
  'SSN',
  'Payroll Period Start',
  'Payroll Period End',
  'Week No',
  'Employee Contrib.',
  'Employer Contrib.',
  'Total Contrib.',
];

function money(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isLastEmployee(department: SocialSecurityDeductionDepartment, employee: SocialSecurityDeductionEmployee): boolean {
  const employees = department.employees;
  return employees[employees.length - 1]?.employeeId === employee.employeeId
    && employees[employees.length - 1]?.pageNumber === employee.pageNumber;
}

export function exportSocialSecurityDeductionExcel(report: SocialSecurityDeductionReport): void {
  const sheetRows: (string | number)[][] = [];

  report.departments.forEach((department, departmentIndex) => {
    department.employees.forEach((employee) => {
      const lastEmployee = isLastEmployee(department, employee);
      const lastPage = departmentIndex === report.departments.length - 1 && lastEmployee;
      sheetRows.push(
        [report.title, '', '', '', '', '', '', `Page ${employee.pageNumber} of ${report.pageCount}`],
        ['Organization', report.organization],
        ['Period', report.periodStart, report.periodEnd],
        [],
        HEADERS,
        [department.name],
        [employee.lastName, employee.firstName],
      );
      employee.weeks.forEach((week) => {
        sheetRows.push([
          '',
          '',
          week.socialSecurityNumber,
          week.periodStart,
          week.periodEnd,
          week.weekNumber,
          Number(week.employeeContribution || 0),
          Number(week.employerContribution || 0),
          Number(week.totalContribution || 0),
        ]);
      });
      sheetRows.push([
        employee.weekCount,
        '',
        '',
        '',
        '',
        'Totals:',
        Number(employee.totals.employeeContribution || 0),
        Number(employee.totals.employerContribution || 0),
        Number(employee.totals.totalContribution || 0),
      ]);
      if (lastEmployee) {
        sheetRows.push([
          `${department.name} Total EEs:`,
          '',
          department.employeeCount,
          '',
          '',
          'Totals',
          Number(department.totals.employeeContribution || 0),
          Number(department.totals.employerContribution || 0),
          Number(department.totals.totalContribution || 0),
        ]);
      }
      if (lastPage) {
        sheetRows.push([
          'Total Employees',
          '',
          report.employeeCount,
          '',
          '',
          'Grand Totals:',
          Number(report.totals.employeeContribution || 0),
          Number(report.totals.employerContribution || 0),
          Number(report.totals.totalContribution || 0),
        ]);
      }
      sheetRows.push([]);
    });
  });

  const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
  sheet['!cols'] = HEADERS.map((label, index) => ({ wch: index < 2 ? 22 : Math.max(14, label.length + 2) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'SS Deduction');
  void saveReportWorkbook(workbook, `social-security-deduction-${report.startDate}-to-${report.endDate}.xlsx`, {
    title: report.title,
    period: `${report.periodStart} to ${report.periodEnd}`,
  });
}

export function exportSocialSecurityDeductionPdf(report: SocialSecurityDeductionReport): boolean {
  const header = documentHeaderHtml({
    title: report.title,
    period: `${report.periodStart} to ${report.periodEnd}`,
  });
  const pages = report.departments.flatMap((department, departmentIndex) => department.employees.map((employee) => {
    const lastEmployee = isLastEmployee(department, employee);
    const lastPage = departmentIndex === report.departments.length - 1 && lastEmployee;
    const weekRows = employee.weeks.map((week) => `
      <tr>
        <td></td>
        <td></td>
        <td>${escapeHtml(week.socialSecurityNumber)}</td>
        <td class="center">${escapeHtml(week.periodStart)}</td>
        <td class="center">${escapeHtml(week.periodEnd)}</td>
        <td class="center">${week.weekNumber}</td>
        <td class="num">${money(week.employeeContribution)}</td>
        <td class="num">${money(week.employerContribution)}</td>
        <td class="num">${money(week.totalContribution)}</td>
      </tr>
    `).join('');

    return `
      <section class="page">
        ${header}
        <div class="top">
          <h1>${escapeHtml(report.title)}</h1>
          <div>Page ${employee.pageNumber} of ${report.pageCount}</div>
        </div>
        <div class="meta"><strong>Organization</strong> ${escapeHtml(report.organization)}</div>
        <div class="meta"><strong>Period</strong> ${escapeHtml(report.periodStart)} &nbsp;&nbsp; ${escapeHtml(report.periodEnd)}</div>
        <table>
          <thead>
            <tr>
              ${HEADERS.map((label) => `<th>${escapeHtml(label)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr class="department"><td colspan="9">${escapeHtml(department.name)}</td></tr>
            <tr class="employee"><td>${escapeHtml(employee.lastName)}</td><td>${escapeHtml(employee.firstName)}</td><td colspan="7"></td></tr>
            ${weekRows}
            <tr class="totals">
              <td>${employee.weekCount}</td>
              <td colspan="4"></td>
              <td class="num">Totals:</td>
              <td class="num">${money(employee.totals.employeeContribution)}</td>
              <td class="num">${money(employee.totals.employerContribution)}</td>
              <td class="num">${money(employee.totals.totalContribution)}</td>
            </tr>
            ${lastEmployee ? `
              <tr class="department-total">
                <td colspan="2">${escapeHtml(department.name)} Total EEs:</td>
                <td>${department.employeeCount}</td>
                <td colspan="2"></td>
                <td class="num">Totals</td>
                <td class="num">${money(department.totals.employeeContribution)}</td>
                <td class="num">${money(department.totals.employerContribution)}</td>
                <td class="num">${money(department.totals.totalContribution)}</td>
              </tr>
            ` : ''}
            ${lastPage ? `
              <tr class="grand">
                <td colspan="2">Total Employees</td>
                <td>${report.employeeCount}</td>
                <td colspan="2"></td>
                <td class="num">Grand Totals:</td>
                <td class="num">${money(report.totals.employeeContribution)}</td>
                <td class="num">${money(report.totals.employerContribution)}</td>
                <td class="num">${money(report.totals.totalContribution)}</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </section>
    `;
  })).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; color: #1a1a1a; margin: 24px; }
    h1 { color: #1f4e9b; font-size: 26px; margin: 0; text-align: center; }
    .top { display: grid; grid-template-columns: 1fr auto; align-items: start; }
    .meta { margin: 2px 0 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #8e8e8e; padding: 3px 6px; }
    th { background: #6f63b6; color: #fff; }
    tr.department td { background: #d9e2f3; font-weight: 700; }
    tr.employee td { background: #eeeeee; font-weight: 700; }
    tr.totals td { background: #e6e6e6; font-weight: 700; }
    tr.department-total td { background: #c5d4ea; font-weight: 700; }
    tr.grand td { background: #1f4e9b; color: #fff; font-weight: 700; }
    .num { text-align: right; }
    .center { text-align: center; }
    .page { break-after: page; page-break-after: always; }
    .page:last-child { break-after: auto; page-break-after: auto; }
  </style>
</head>
<body>${pages}</body>
</html>`;

  const popup = window.open('', '_blank', 'noopener,noreferrer');
  if (!popup) {
    return false;
  }
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
  return true;
}
