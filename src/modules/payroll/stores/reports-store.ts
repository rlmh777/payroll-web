import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface JournalEntryReportRow {
  accountId: string | null;
  accountNumber: string;
  accountDescription: string;
  debit: number;
  credit: number;
}

export interface JournalEntryReport {
  payrollRunId: string;
  payPeriodGroupId: string;
  payPeriodGroupName: string | null;
  payPeriodStartDate: string;
  payPeriodEndDate: string;
  payPeriodNumber: number;
  rows: JournalEntryReportRow[];
  totals: {
    debit: number;
    credit: number;
  };
}

export interface SalaryReviewEmployeeRow {
  employeeId: string;
  employeeCode?: string | null;
  employeeName: string;
  values: Record<string, number>;
}

export interface SalaryReviewDepartment {
  departmentId: number | null;
  departmentName: string;
  columns: string[];
  rows: SalaryReviewEmployeeRow[];
  totals: Record<string, number>;
}

export interface SalaryReviewReport {
  startDate: string;
  endDate: string;
  departments: SalaryReviewDepartment[];
}

export interface PayrollSummaryEarningColumn {
  id: number;
  key: string;
  name: string;
  source?: string | null;
  showHours: boolean;
}

export interface PayrollSummaryByDepartmentRow {
  employeeId: string;
  employeeCode: string | null;
  employeeName: string;
  hours: Record<string, number>;
  amounts: Record<string, number>;
  grossPay: number;
}

export interface PayrollSummaryByDepartmentDepartment {
  departmentId: number | null;
  departmentName: string;
  rows: PayrollSummaryByDepartmentRow[];
  totals: {
    hours: Record<string, number>;
    amounts: Record<string, number>;
    grossPay: number;
  };
}

export interface PayrollSummaryByDepartmentReport {
  payrollRunId: string;
  payPeriodGroupId: string;
  payPeriodGroupName: string | null;
  payPeriodStartDate: string;
  payPeriodEndDate: string;
  payPeriodNumber: number;
  earningColumns: PayrollSummaryEarningColumn[];
  departments: PayrollSummaryByDepartmentDepartment[];
}

export interface PayrollJournalDepartmentsWorkRow {
  date: string;
  description?: string | null;
  rowType?: 'work' | 'deduction';
  regularHours: number;
  regularRate: number;
  regularTotal: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimeTotal: number;
  holidayHours: number;
  holidayRate: number;
  holidayTotal: number;
  otherPayments: number;
  gross: number;
  tax: number | null;
  social: number | null;
  otherDeductions: number | null;
  netIncome: number;
}

export interface PayrollJournalDepartmentsEmployee {
  employeeId: string;
  employeeCode: string | null;
  employeeName: string;
  bankName: string | null;
  accountNumber: string | null;
  rows: PayrollJournalDepartmentsWorkRow[];
  totals: Omit<PayrollJournalDepartmentsWorkRow, 'date' | 'regularRate' | 'overtimeRate' | 'holidayRate'>;
}

export interface PayrollJournalDepartmentsDepartment {
  departmentId: number | null;
  departmentName: string;
  employees: PayrollJournalDepartmentsEmployee[];
  totals: Omit<PayrollJournalDepartmentsWorkRow, 'date' | 'regularRate' | 'overtimeRate' | 'holidayRate'>;
}

export interface PayrollJournalDepartmentsReport {
  payrollRunId: string;
  payPeriodGroupName: string | null;
  payPeriodStartDate: string;
  payPeriodEndDate: string;
  payPeriodNumber: number;
  departments: PayrollJournalDepartmentsDepartment[];
}

export type ScheduledHoursCostScope = 'company' | 'department';

export type ScheduledHoursCostPeriod = 'dates' | 'payroll_run';

export type ScheduledHoursCostSortKey = 'department' | 'name' | 'position';

export interface ScheduledVsWorkedHoursRow {
  employeeId: string;
  employeeCode: string | null;
  employeeName: string;
  department: string;
  position: string;
  scheduledHours: number;
  scheduledAmount: number;
  workedHours: number;
  workedAmount: number;
  overtimeHours: number;
  overtimeAmount: number;
  tips: number;
  shares: number;
  specialAssignments: number;
}

export interface ScheduledVsWorkedHoursReport {
  period: ScheduledHoursCostPeriod;
  payrollRunId: string | null;
  payPeriodGroupName: string | null;
  startDate: string;
  endDate: string;
  scope: ScheduledHoursCostScope;
  scopeLabel: string;
  departmentId: number | null;
  sortBy: ScheduledHoursCostSortKey[];
  rows: ScheduledVsWorkedHoursRow[];
  totals: Omit<
    ScheduledVsWorkedHoursRow,
    'employeeId' | 'employeeCode' | 'employeeName' | 'department' | 'position'
  >;
  employeeCount: number;
}

export interface PayeEmploymentDetailsRow {
  employeeId: string;
  tin: string;
  taxpayerName: string;
  socialSecurityNumber: string;
  passport: string | null;
  numberOfWeeksEmployed: number;
  totalEmoluments: number;
  taxableBenefits: number;
  commissions: number;
  taxWithheld: number;
}

export interface PayeEmploymentDetailsReport {
  year: number;
  month: number;
  period: string;
  startDate: string;
  endDate: string;
  submitter: {
    tin: string;
    name: string;
    address: string;
  };
  rows: PayeEmploymentDetailsRow[];
  totals: {
    totalEmoluments: number;
    taxableBenefits: number;
    commissions: number;
    taxWithheld: number;
  };
}

export interface PayeReconciliationEmployeeDetailsReport {
  year: number;
  month: number | null;
  period: string;
  startDate: string;
  endDate: string;
  submitter: {
    tin: string;
    name: string;
    address: string;
  };
  rows: PayeEmploymentDetailsRow[];
  totals: {
    totalEmoluments: number;
    taxableBenefits: number;
    commissions: number;
    taxWithheld: number;
  };
}

export interface SocialSecurityPaymentsByMonthRow {
  id: string;
  employeeId: string | null;
  employeeSocialSecurityNumber: string | null;
  companySocialSecurityNumber: string | null;
  year: number;
  monthName: string;
  calendarWeek: number;
  weekMondayDate: string | null;
  weeklyGrossPay: number;
  socialSecurityAmount: number;
  electronicEmployerNumber: string | null;
  dateHired: string | null;
  blank: string;
  firstName: string | null;
  lastName: string | null;
  recordCode: string;
}

export interface SocialSecurityPaymentsByMonthReport {
  id: string | null;
  year: number;
  month: number;
  monthName: string;
  calculatedAt: string | null;
  rows: SocialSecurityPaymentsByMonthRow[];
  totals: {
    weeklyGrossPay: number;
    socialSecurityAmount: number;
    rowCount: number;
  };
}

export interface SocialSecurityPaymentsByMonthPeriods {
  years: number[];
  monthsByYear: Record<string, Array<{ value: number; label: string }>>;
}

export type PayeEmploymentDetailsPeriods = SocialSecurityPaymentsByMonthPeriods;

export interface BankUploadReportRow {
  transactionType: string;
  paymentType: string;
  branchNumber: string;
  default1: number;
  default2: number;
  default3: number;
  accountNumber: string;
  employeeName: string;
  netPay: number;
  payrollNumberLabel: string;
  csvLine: string;
}

export interface BankUploadReport {
  payrollRunId: string;
  payrollNumber: number;
  payrollNumberFormatted: string;
  payrollNumberLabel: string;
  payPeriodGroupId: string | null;
  payPeriodGroupName: string | null;
  payPeriodStartDate: string | null;
  payPeriodEndDate: string | null;
  companyName?: string | null;
  generatedOn?: string | null;
  branchNumber: string;
  rows: BankUploadReportRow[];
  totals: {
    rowCount: number;
    netPay: number;
  };
  csv: string;
}

export type LaborCostToDateScope = 'company' | 'department' | 'group';

export type LaborCostToDateColumnType = 'text' | 'money' | 'number' | 'date';

export interface LaborCostToDateColumn {
  key: string;
  label: string;
  type: LaborCostToDateColumnType;
  defaultVisible: boolean;
  earningCodeId?: number;
}

export interface LaborCostToDateRow {
  employeeId: string;
  employeeCode: string | null;
  employeeName: string;
  departments: string;
  values: Record<string, number | string | null>;
}

export type DepartmentHoursAndPayScope = 'company' | 'department' | 'group';

export type DepartmentHoursAndPayPeriod = 'dates' | 'payroll_run';

export type DepartmentHoursAndPaySortKey = 'department' | 'name' | 'position';

export interface DepartmentHoursAndPayRow {
  employeeId: string;
  employeeCode: string | null;
  department: string;
  employeeName: string;
  startDate: string | null;
  shares: number;
  position: string;
  biweeklyBaseSalary: number | null;
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
  vacationHours: number;
  totalHours: number;
  totalPay: number;
  staffGratuity: number;
  tips: number;
  specialPay: number;
  reservationCommission: number;
  combinedYtdPay: number;
}

export interface DepartmentHoursAndPayReport {
  period: DepartmentHoursAndPayPeriod;
  payrollRunId: string | null;
  payPeriodGroupName: string | null;
  startDate: string;
  endDate: string;
  scope: DepartmentHoursAndPayScope;
  scopeLabel: string;
  departmentId: number | null;
  employeeGroupId: string | null;
  sortBy: DepartmentHoursAndPaySortKey[];
  rows: DepartmentHoursAndPayRow[];
  totals: Omit<
    DepartmentHoursAndPayRow,
    'employeeId' | 'employeeCode' | 'department' | 'employeeName' | 'startDate' | 'position'
  >;
  employeeCount: number;
}

export type CompanyPayrollAnalysisPeriod = 'dates' | 'payroll_run';

export interface CompanyPayrollAnalysisDepartmentRow {
  departmentId: number | null;
  departmentName: string;
  employeeCount: number;
  regularHours: number;
  regularPay: number;
  overtimeHours: number;
  overtimePay: number;
  holidayHours: number;
  holidayPay: number;
  vacationHours: number;
  vacationPay: number;
  totalHours: number;
  totalPay: number;
  averagePayPerHour: number;
}

export interface CompanyPayrollAnalysisByDepartmentReport {
  companyName: string;
  title: string;
  period: CompanyPayrollAnalysisPeriod;
  payrollRunId: string | null;
  payrollNumber: number | null;
  payPeriodGroupName: string | null;
  startDate: string;
  endDate: string;
  rows: CompanyPayrollAnalysisDepartmentRow[];
  totals: CompanyPayrollAnalysisDepartmentRow;
  employeeCount: number;
}

export type PayrollMasterSheetScope = 'company' | 'department';

export interface PayrollMasterSheetPeriod {
  year: number;
  month: number;
}

export interface PayrollMasterSheetEarningColumn {
  key: string;
  code: string | null;
  name: string;
  source: string | null;
  payMultiplier: number | null;
}

export interface PayrollMasterSheetEarningValue {
  hours: number;
  amount: number;
}

export interface PayrollMasterSheetEmployeeRow {
  employeeId: string;
  employeeCode: string | null;
  employeeName: string;
  jobDescription: string;
  departmentId: number | null;
  departmentName: string;
  hourlyBase: number;
  earnings: Record<string, PayrollMasterSheetEarningValue>;
  totalHours: number;
  workingTotal: number;
  gratuityPoints: number;
  gratuityPercentWorked: number;
  gratuityPayout: number;
  grossSalary: number;
  totalGrossPerHour: number;
}

export interface PayrollMasterSheetTotals {
  earnings: Record<string, PayrollMasterSheetEarningValue>;
  totalHours: number;
  workingTotal: number;
  gratuityPoints: number;
  gratuityPayout: number;
  grossSalary: number;
  totalGrossPerHour: number;
  employeeCount: number;
}

export interface PayrollMasterSheetDepartment {
  departmentId: number | null;
  departmentName: string;
  rows: PayrollMasterSheetEmployeeRow[];
  totals: PayrollMasterSheetTotals;
}

export interface PayrollMasterSheetMonth {
  year: number;
  month: number;
  label: string;
  sheetName: string;
  startDate: string;
  endDate: string;
  companyName: string;
  gratuityRate: number;
  gratuityPoolAmount: number;
  departments: PayrollMasterSheetDepartment[];
  totals: PayrollMasterSheetTotals;
  employeeCount: number;
}

export type SalaryPaymentsScope = 'company' | 'department';

export type SalaryPaymentsSortKey = 'department' | 'lastName' | 'firstName' | 'employeeCode';

export interface SalaryPaymentsColumn {
  key: string;
  label: string;
  category: string;
  group: string | null;
  type: 'hours' | 'money' | 'text' | 'date' | 'number';
  defaultVisible: boolean;
  total: boolean;
}

export interface SalaryPaymentsRow {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  employeeName: string;
  displayName: string;
  departmentId: number | null;
  departmentName: string;
  values: Record<string, string | number | null>;
}

export interface SalaryPaymentsDepartment {
  departmentId: number | null;
  departmentName: string;
  rows: SalaryPaymentsRow[];
  totals: Record<string, number>;
  employeeCount: number;
}

export interface SalaryPaymentsReport {
  title: string;
  startDate: string;
  endDate: string;
  scope: SalaryPaymentsScope;
  scopeLabel: string;
  departmentId: number | null;
  sortBy: SalaryPaymentsSortKey[];
  columns: SalaryPaymentsColumn[];
  departments: SalaryPaymentsDepartment[];
  rows: SalaryPaymentsRow[];
  totals: Record<string, number>;
  employeeCount: number;
}

export type RegistrySummaryPeriod = 'dates' | 'payroll_run';

export interface RegistrySummaryByOfficeDepartmentRow {
  payrollRunId: string;
  payrollNumber: number;
  branch: string;
  departmentId: number | null;
  department: string;
  processType: string;
  wage: number;
  overtime: number;
  pretaxDeduction: number;
  sickLeaveDeduction: number;
  otherEarnings: number;
  grossPay: number;
  taxes: number;
  ssEmployee: number;
  ssEmployer: number;
  postTaxDeduction: number;
  nonTaxPayout: number;
  netSalary: number;
}

export interface RegistrySummaryByOfficeDepartmentReport {
  title: string;
  period: RegistrySummaryPeriod;
  startDate: string;
  endDate: string;
  periodLabel: string;
  payrollRunId: string | null;
  payrollNumber: number | null;
  rows: RegistrySummaryByOfficeDepartmentRow[];
  totals: Omit<RegistrySummaryByOfficeDepartmentRow, 'payrollRunId' | 'payrollNumber' | 'branch' | 'departmentId' | 'department' | 'processType'>;
}

export type PayrollRegistryPeriod = 'dates' | 'payroll_run';

export type PayrollRegistryScope = 'company' | 'department';

export type PayrollRegistrySortKey = 'department' | 'lastName' | 'firstName' | 'employeeCode';

export interface PayrollRegistryAmounts {
  regularHours: number;
  regularPay: number;
  overtimeHours: number;
  overtimePay: number;
  doubleTimeHours: number;
  doubleTimePay: number;
  miscPayments: number;
  grossPay: number;
  miscDeduction: number;
  tax: number;
  employeeSocialSecurity: number;
  netPay: number;
  employerSocialSecurity: number;
  employerContribution: number;
}

export interface PayrollRegistryLine extends PayrollRegistryAmounts {
  payrollId: string;
  payrollRunId: string;
  processedDate: string;
  processedDateLabel: string;
  period: number;
  year: number;
  payrollNumber: number;
  departmentId: number | null;
  departmentName: string;
}

export interface PayrollRegistryYear {
  year: number;
  payrollCount: number;
  lines: PayrollRegistryLine[];
  totals: PayrollRegistryAmounts;
}

export interface PayrollRegistryEmployee {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  displayName: string;
  departmentId: number | null;
  departmentName: string;
  years: PayrollRegistryYear[];
  totals: PayrollRegistryAmounts;
}

export interface PayrollRegistryReport {
  title: string;
  company: {
    name: string;
    lines: string[];
    logoUrl: string | null;
  };
  period: PayrollRegistryPeriod;
  periodLabel: string;
  startDate: string;
  endDate: string;
  scope: PayrollRegistryScope;
  scopeLabel: string;
  departmentId: number | null;
  payrollRunId: string | null;
  payrollNumber: number | null;
  sortBy: PayrollRegistrySortKey[];
  employees: PayrollRegistryEmployee[];
  totals: PayrollRegistryAmounts;
  employeeCount: number;
}

export type PayeScope = 'company' | 'department' | 'employee';

export interface PayeRow {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  displayName: string;
  departmentName: string;
  tin: string;
  socialSecurityNumber: string;
  weeksEmployed: number;
  taxableGross: number;
  totalEmoluments: number;
  commissions: number;
  taxWithheld: number;
}

export interface PayeReport {
  title: string;
  company: {
    name: string;
    lines: string[];
    logoUrl: string | null;
  };
  periodLabel: string;
  startDate: string;
  endDate: string;
  scope: PayeScope;
  scopeLabel: string;
  departmentId: number | null;
  employeeId: string | null;
  rows: PayeRow[];
  totals: {
    weeksEmployed: number;
    taxableGross: number;
    totalEmoluments: number;
    commissions: number;
    taxWithheld: number;
  };
  employeeCount: number;
}

export type SocialSecurityContributionsScope = 'company' | 'department';

export type SocialSecurityContributionsSortKey =
  | 'lastName'
  | 'firstName'
  | 'weekNumber'
  | 'socialSecurityNumber'
  | 'department'
  | 'weeklyEarnings';

export interface SocialSecurityContributionsRow {
  employeeId: string;
  firstName: string;
  lastName: string;
  socialSecurityNumber: string;
  weekNumber: number;
  weekYear: number;
  weekThursday: string;
  departmentId: number;
  departmentName: string;
  weeklyEarnings: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
}

export interface SocialSecurityContributionsGroup {
  name: string;
  rows: SocialSecurityContributionsRow[];
}

export interface SocialSecurityContributionsReport {
  title: string;
  generatedAt: string;
  organization: string;
  company: {
    name: string;
    lines: string[];
    logoUrl: string | null;
  };
  yearLabel: string;
  monthLabel: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  scope: SocialSecurityContributionsScope;
  scopeLabel: string;
  departmentIds: number[];
  sortBy: SocialSecurityContributionsSortKey[];
  groups: SocialSecurityContributionsGroup[];
  rows: SocialSecurityContributionsRow[];
  totals: {
    weeklyEarnings: number;
    employeeContribution: number;
    employerContribution: number;
    totalContribution: number;
    rowCount: number;
  };
  employeeCount: number;
}

export type SocialSecurityDeductionScope = 'company' | 'department';

export type SocialSecurityDeductionSortKey =
  | 'lastName'
  | 'firstName'
  | 'socialSecurityNumber'
  | 'department';

export interface SocialSecurityDeductionWeek {
  employeeId: string;
  firstName: string;
  lastName: string;
  socialSecurityNumber: string;
  departmentId: number;
  departmentName: string;
  periodStart: string;
  periodEnd: string;
  periodStartIso: string;
  weekNumber: number;
  weekYear: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
}

export interface SocialSecurityDeductionMoney {
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  weekCount: number;
}

export interface SocialSecurityDeductionEmployee {
  employeeId: string;
  lastName: string;
  firstName: string;
  socialSecurityNumber: string;
  weeks: SocialSecurityDeductionWeek[];
  pageNumber: number;
  weekCount: number;
  totals: SocialSecurityDeductionMoney;
}

export interface SocialSecurityDeductionDepartment {
  departmentId: number;
  name: string;
  employees: SocialSecurityDeductionEmployee[];
  employeeCount: number;
  totals: SocialSecurityDeductionMoney;
}

export interface SocialSecurityDeductionReport {
  title: string;
  organization: string;
  company: {
    name: string;
    lines: string[];
    logoUrl: string | null;
  };
  periodStart: string;
  periodEnd: string;
  startDate: string;
  endDate: string;
  scope: SocialSecurityDeductionScope;
  scopeLabel: string;
  departmentIds: number[];
  sortBy: SocialSecurityDeductionSortKey[];
  departments: SocialSecurityDeductionDepartment[];
  pageCount: number;
  employeeCount: number;
  totals: SocialSecurityDeductionMoney;
}

export type EmolumentsWithheldTaxScope = 'company' | 'department';

export type EmolumentsWithheldTaxSortKey = 'lastName' | 'firstName' | 'tin' | 'department';

export interface EmolumentsMonthValues {
  weeks: number | null;
  emoluments: number;
  taxableBenefit: number;
  commission: number;
  taxWithheld: number;
}

export interface EmolumentsWithheldTaxRow {
  employeeId: string;
  tin: string;
  name: string;
  firstName: string;
  lastName: string;
  departmentName: string;
  months: Record<string, EmolumentsMonthValues | null>;
  total: EmolumentsMonthValues;
}

export interface EmolumentsWithheldTaxReport {
  title: string;
  year: number;
  scope: EmolumentsWithheldTaxScope;
  scopeLabel: string;
  departmentId: number | null;
  sortBy: EmolumentsWithheldTaxSortKey[];
  months: { value: number; label: string }[];
  fields: { key: keyof EmolumentsMonthValues; label: string }[];
  rows: EmolumentsWithheldTaxRow[];
  totals: {
    months: Record<string, EmolumentsMonthValues | null>;
    total: EmolumentsMonthValues;
  };
  employeeCount: number;
}

export type Td4SupplementaryScope = 'company' | 'department' | 'employee';

export type Td4SupplementarySortKey =
  | 'lastName'
  | 'firstName'
  | 'department'
  | 'socialSecurity'
  | 'employeeTin'
  | 'weeks'
  | 'totalIncome'
  | 'taxableIncome'
  | 'nonTaxableIncome'
  | 'commissions'
  | 'taxDeducted';

export interface Td4SupplementarySlip {
  employeeName: string;
  firstName: string;
  lastName: string;
  departmentName: string;
  addressLines: string[];
  socialSecurity: string;
  weeks: number;
  totalIncome: number;
  taxableIncome: number;
  nonTaxableIncome: number;
  commissions: number;
  taxDeducted: number;
  employeeTin: string;
}

export interface Td4SupplementaryEmployer {
  name: string;
  addressLines: string[];
  tin: string;
}

export interface Td4SupplementaryReport {
  year: number;
  startDate: string;
  endDate: string;
  periodLabel: string;
  scope: Td4SupplementaryScope;
  scopeLabel: string;
  departmentId: number | null;
  employeeId: string | null;
  sortBy: Td4SupplementarySortKey[];
  employer: Td4SupplementaryEmployer;
  slips: Td4SupplementarySlip[];
  employeeCount: number;
}

export interface Td4SummaryReport {
  title: string;
  subtitle: string;
  year: number;
  yearEndingLabel: string;
  employerName: string;
  addressLines: string[];
  taxIdentificationNumber: string;
  emolumentsPaid: number;
  casualWagesPaid: number;
  totalEmoluments: number;
  incomeTaxWithheld: number;
  generatedAt: string;
  payrollCount: number;
}

export interface PayrollMasterSheetReport {
  companyName: string;
  title: string;
  scope: PayrollMasterSheetScope;
  scopeLabel: string;
  departmentId: number | null;
  earningColumns: PayrollMasterSheetEarningColumn[];
  months: PayrollMasterSheetMonth[];
}

export interface LaborCostToDateReport {
  startDate: string;
  endDate: string;
  scope: LaborCostToDateScope;
  scopeLabel: string;
  departmentId: number | null;
  employeeGroupId: string | null;
  columns: LaborCostToDateColumn[];
  rows: LaborCostToDateRow[];
  totals: Record<string, number>;
  employeeCount: number;
}

export const useReportsStore = defineStore('reports', {
  state: () => ({
    journalEntryReport: null as JournalEntryReport | null,
    salaryReviewReport: null as SalaryReviewReport | null,
    payrollSummaryByDepartmentReport: null as PayrollSummaryByDepartmentReport | null,
    payrollJournalDepartmentsReport: null as PayrollJournalDepartmentsReport | null,
    scheduledVsWorkedHoursReport: null as ScheduledVsWorkedHoursReport | null,
    payeEmploymentDetailsReport: null as PayeEmploymentDetailsReport | null,
    payeEmploymentDetailsPeriods: null as PayeEmploymentDetailsPeriods | null,
    payeReconciliationEmployeeDetailsReport: null as PayeReconciliationEmployeeDetailsReport | null,
    payeReconciliationEmployeeDetailsPeriods: null as PayeEmploymentDetailsPeriods | null,
    socialSecurityPaymentsByMonthReport: null as SocialSecurityPaymentsByMonthReport | null,
    socialSecurityPaymentsByMonthPeriods: null as SocialSecurityPaymentsByMonthPeriods | null,
    bankUploadReport: null as BankUploadReport | null,
    laborCostToDateReport: null as LaborCostToDateReport | null,
    departmentHoursAndPayReport: null as DepartmentHoursAndPayReport | null,
    companyPayrollAnalysisByDepartmentReport: null as CompanyPayrollAnalysisByDepartmentReport | null,
    payrollMasterSheetReport: null as PayrollMasterSheetReport | null,
    salaryPaymentsReport: null as SalaryPaymentsReport | null,
    payrollRegistryReport: null as PayrollRegistryReport | null,
    registrySummaryByOfficeDepartmentReport: null as RegistrySummaryByOfficeDepartmentReport | null,
    payeReport: null as PayeReport | null,
    td4SummaryReport: null as Td4SummaryReport | null,
    td4SummaryYears: [] as number[],
    td4SupplementaryReport: null as Td4SupplementaryReport | null,
    emolumentsWithheldTaxReport: null as EmolumentsWithheldTaxReport | null,
    emolumentsWithheldTaxYears: [] as number[],
    socialSecurityContributionsReport: null as SocialSecurityContributionsReport | null,
    socialSecurityDeductionReport: null as SocialSecurityDeductionReport | null,
    isLoadingJournalEntries: false,
    isLoadingSalaryReview: false,
    isLoadingPayrollSummaryByDepartment: false,
    isLoadingPayrollJournalDepartments: false,
    isLoadingScheduledVsWorkedHours: false,
    isLoadingPayeEmploymentDetails: false,
    isLoadingPayeEmploymentDetailsPeriods: false,
    isLoadingPayeReconciliationEmployeeDetails: false,
    isLoadingPayeReconciliationEmployeeDetailsPeriods: false,
    isLoadingSocialSecurityPaymentsByMonth: false,
    isLoadingSocialSecurityPaymentsByMonthPeriods: false,
    isRecalculatingSocialSecurityPaymentsByMonth: false,
    isLoadingBankUpload: false,
    isLoadingLaborCostToDate: false,
    isLoadingDepartmentHoursAndPay: false,
    isLoadingCompanyPayrollAnalysisByDepartment: false,
    isLoadingPayrollMasterSheet: false,
    isLoadingSalaryPayments: false,
    isLoadingPayrollRegistry: false,
    isLoadingRegistrySummaryByOfficeDepartment: false,
    isLoadingPaye: false,
    isLoadingTd4Summary: false,
    isLoadingTd4SummaryYears: false,
    isLoadingTd4Supplementary: false,
    isLoadingEmolumentsWithheldTax: false,
    isLoadingEmolumentsWithheldTaxYears: false,
    isLoadingSocialSecurityContributions: false,
    isLoadingSocialSecurityDeduction: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
      }

      return headers;
    },

    parseError(body: Record<string, unknown>, fallback: string): string {
      if (typeof body.message === 'string' && body.message.trim() !== '') {
        return body.message;
      }

      return fallback;
    },

    async fetchJournalEntriesReport(payrollRunId: string): Promise<boolean> {
      this.isLoadingJournalEntries = true;
      this.error = null;

      try {
        const response = await fetch(
          `${API_URL}/payroll-runs/${payrollRunId}/journal-entries-report`,
          { headers: this.buildHeaders() },
        );

        const body = await response.json().catch(() => ({} as Record<string, unknown>));

        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load journal entries report.'));
        }

        this.journalEntryReport = body as JournalEntryReport;
        return true;
      } catch (error) {
        this.journalEntryReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load journal entries report.';
        return false;
      } finally {
        this.isLoadingJournalEntries = false;
      }
    },

    clearJournalEntryReport() {
      this.journalEntryReport = null;
      this.error = null;
    },

    async fetchSalaryReviewReport(startDate: string, endDate: string): Promise<boolean> {
      this.isLoadingSalaryReview = true;
      this.error = null;

      try {
        const params = new URLSearchParams({
          start_date: startDate,
          end_date: endDate,
        });
        const response = await fetch(
          `${API_URL}/reports/salary-review?${params.toString()}`,
          { headers: this.buildHeaders() },
        );

        const body = await response.json().catch(() => ({} as Record<string, unknown>));

        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load salary review report.'));
        }

        this.salaryReviewReport = body as SalaryReviewReport;
        return true;
      } catch (error) {
        this.salaryReviewReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load salary review report.';
        return false;
      } finally {
        this.isLoadingSalaryReview = false;
      }
    },

    clearSalaryReviewReport() {
      this.salaryReviewReport = null;
      this.error = null;
    },

    async fetchPayrollSummaryByDepartmentReport(payrollRunId: string): Promise<boolean> {
      this.isLoadingPayrollSummaryByDepartment = true;
      this.error = null;

      try {
        const response = await fetch(
          `${API_URL}/payroll-runs/${payrollRunId}/payroll-summary-by-department-report`,
          { headers: this.buildHeaders() },
        );

        const body = await response.json().catch(() => ({} as Record<string, unknown>));

        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load payroll summary by department report.'));
        }

        this.payrollSummaryByDepartmentReport = body as PayrollSummaryByDepartmentReport;
        return true;
      } catch (error) {
        this.payrollSummaryByDepartmentReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load payroll summary by department report.';
        return false;
      } finally {
        this.isLoadingPayrollSummaryByDepartment = false;
      }
    },

    clearPayrollSummaryByDepartmentReport() {
      this.payrollSummaryByDepartmentReport = null;
      this.error = null;
    },

    async fetchPayrollJournalDepartmentsReport(payrollRunId: string): Promise<boolean> {
      this.isLoadingPayrollJournalDepartments = true;
      this.error = null;

      try {
        const response = await fetch(
          `${API_URL}/payroll-runs/${payrollRunId}/payroll-journal-departments-report`,
          { headers: this.buildHeaders() },
        );

        const body = await response.json().catch(() => ({} as Record<string, unknown>));

        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load payroll journal departments report.'));
        }

        this.payrollJournalDepartmentsReport = body as PayrollJournalDepartmentsReport;
        return true;
      } catch (error) {
        this.payrollJournalDepartmentsReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load payroll journal departments report.';
        return false;
      } finally {
        this.isLoadingPayrollJournalDepartments = false;
      }
    },

    clearPayrollJournalDepartmentsReport() {
      this.payrollJournalDepartmentsReport = null;
      this.error = null;
    },

    async fetchScheduledVsWorkedHoursReport(params: {
      period: ScheduledHoursCostPeriod;
      payrollRunId?: string | null;
      startDate?: string | null;
      endDate?: string | null;
      scope: ScheduledHoursCostScope;
      departmentId?: number | null;
      sortBy?: ScheduledHoursCostSortKey[];
    }): Promise<boolean> {
      this.isLoadingScheduledVsWorkedHours = true;
      this.error = null;

      try {
        const query = new URLSearchParams({
          period: params.period,
          scope: params.scope,
        });
        if (params.period === 'payroll_run' && params.payrollRunId) {
          query.set('payroll_run_id', params.payrollRunId);
        }
        if (params.period === 'dates' && params.startDate && params.endDate) {
          query.set('start_date', params.startDate);
          query.set('end_date', params.endDate);
        }
        if (params.scope === 'department' && params.departmentId != null) {
          query.set('department_id', String(params.departmentId));
        }
        for (const key of params.sortBy ?? []) {
          query.append('sort[]', key);
        }

        const response = await fetch(
          `${API_URL}/reports/scheduled-vs-worked-hours?${query.toString()}`,
          { headers: this.buildHeaders() },
        );

        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load scheduled hours cost vs actual report.'));
        }

        this.scheduledVsWorkedHoursReport = body as ScheduledVsWorkedHoursReport;
        return true;
      } catch (error) {
        this.scheduledVsWorkedHoursReport = null;
        this.error =
          error instanceof Error ? error.message : 'Failed to load scheduled hours cost vs actual report.';
        return false;
      } finally {
        this.isLoadingScheduledVsWorkedHours = false;
      }
    },

    clearScheduledVsWorkedHoursReport() {
      this.scheduledVsWorkedHoursReport = null;
      this.error = null;
    },

    async fetchPayeEmploymentDetailsReport(params: {
      year: number;
      month: number;
    }): Promise<boolean> {
      this.isLoadingPayeEmploymentDetails = true;
      this.error = null;

      try {
        const query = new URLSearchParams({
          year: String(params.year),
          month: String(params.month),
        });

        const response = await fetch(
          `${API_URL}/reports/paye-employment-details?${query.toString()}`,
          { headers: this.buildHeaders() },
        );

        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load PAYE employee details.'));
        }

        this.payeEmploymentDetailsReport = body as PayeEmploymentDetailsReport;
        return true;
      } catch (error) {
        this.payeEmploymentDetailsReport = null;
        this.error = error instanceof Error
          ? error.message
          : 'Failed to load PAYE employee details.';
        return false;
      } finally {
        this.isLoadingPayeEmploymentDetails = false;
      }
    },

    clearPayeEmploymentDetailsReport() {
      this.payeEmploymentDetailsReport = null;
      this.error = null;
    },

    async fetchPayeEmploymentDetailsPeriods(): Promise<boolean> {
      this.isLoadingPayeEmploymentDetailsPeriods = true;
      this.error = null;

      try {
        const response = await fetch(
          `${API_URL}/reports/paye-employment-details/periods`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load available payroll periods.'));
        }

        this.payeEmploymentDetailsPeriods = body as PayeEmploymentDetailsPeriods;
        return true;
      } catch (error) {
        this.payeEmploymentDetailsPeriods = null;
        this.error = error instanceof Error
          ? error.message
          : 'Failed to load available payroll periods.';
        return false;
      } finally {
        this.isLoadingPayeEmploymentDetailsPeriods = false;
      }
    },

    async fetchPayeReconciliationEmployeeDetailsReport(params: {
      year: number;
      period: 'annual' | number;
    }): Promise<boolean> {
      this.isLoadingPayeReconciliationEmployeeDetails = true;
      this.error = null;

      try {
        const query = new URLSearchParams({
          year: String(params.year),
          period: params.period === 'annual' ? 'annual' : String(params.period),
        });

        const response = await fetch(
          `${API_URL}/reports/paye-reconciliation-employee-details?${query.toString()}`,
          { headers: this.buildHeaders() },
        );

        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load PAYE reconciliation employee details.'));
        }

        this.payeReconciliationEmployeeDetailsReport = body as PayeReconciliationEmployeeDetailsReport;
        return true;
      } catch (error) {
        this.payeReconciliationEmployeeDetailsReport = null;
        this.error = error instanceof Error
          ? error.message
          : 'Failed to load PAYE reconciliation employee details.';
        return false;
      } finally {
        this.isLoadingPayeReconciliationEmployeeDetails = false;
      }
    },

    clearPayeReconciliationEmployeeDetailsReport() {
      this.payeReconciliationEmployeeDetailsReport = null;
      this.error = null;
    },

    async fetchPayeReconciliationEmployeeDetailsPeriods(): Promise<boolean> {
      this.isLoadingPayeReconciliationEmployeeDetailsPeriods = true;
      this.error = null;

      try {
        const response = await fetch(
          `${API_URL}/reports/paye-reconciliation-employee-details/periods`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load available payroll periods.'));
        }

        this.payeReconciliationEmployeeDetailsPeriods = body as PayeEmploymentDetailsPeriods;
        return true;
      } catch (error) {
        this.payeReconciliationEmployeeDetailsPeriods = null;
        this.error = error instanceof Error
          ? error.message
          : 'Failed to load available payroll periods.';
        return false;
      } finally {
        this.isLoadingPayeReconciliationEmployeeDetailsPeriods = false;
      }
    },

    async fetchSocialSecurityPaymentsByMonthPeriods(): Promise<boolean> {
      this.isLoadingSocialSecurityPaymentsByMonthPeriods = true;
      this.error = null;

      try {
        const response = await fetch(
          `${API_URL}/reports/social-security-payments-by-month/periods`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load available payroll periods.'));
        }

        this.socialSecurityPaymentsByMonthPeriods = body as SocialSecurityPaymentsByMonthPeriods;
        return true;
      } catch (error) {
        this.socialSecurityPaymentsByMonthPeriods = null;
        this.error = error instanceof Error
          ? error.message
          : 'Failed to load available payroll periods.';
        return false;
      } finally {
        this.isLoadingSocialSecurityPaymentsByMonthPeriods = false;
      }
    },

    async fetchSocialSecurityPaymentsByMonthReport(year: number, month: number): Promise<boolean> {
      this.isLoadingSocialSecurityPaymentsByMonth = true;
      this.error = null;

      try {
        const query = new URLSearchParams({
          year: String(year),
          month: String(month),
        });
        const response = await fetch(
          `${API_URL}/reports/social-security-payments-by-month?${query.toString()}`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load social security payments report.'));
        }

        this.socialSecurityPaymentsByMonthReport = body as SocialSecurityPaymentsByMonthReport;
        return true;
      } catch (error) {
        this.socialSecurityPaymentsByMonthReport = null;
        this.error = error instanceof Error
          ? error.message
          : 'Failed to load social security payments report.';
        return false;
      } finally {
        this.isLoadingSocialSecurityPaymentsByMonth = false;
      }
    },

    async recalculateSocialSecurityPaymentsByMonthReport(year: number, month: number): Promise<boolean> {
      this.isRecalculatingSocialSecurityPaymentsByMonth = true;
      this.error = null;

      try {
        const response = await fetch(
          `${API_URL}/reports/social-security-payments-by-month/recalculate`,
          {
            method: 'POST',
            headers: this.buildHeaders(),
            body: JSON.stringify({ year, month }),
          },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to recalculate social security payments report.'));
        }

        this.socialSecurityPaymentsByMonthReport = body as SocialSecurityPaymentsByMonthReport;
        return true;
      } catch (error) {
        this.error = error instanceof Error
          ? error.message
          : 'Failed to recalculate social security payments report.';
        return false;
      } finally {
        this.isRecalculatingSocialSecurityPaymentsByMonth = false;
      }
    },

    clearSocialSecurityPaymentsByMonthReport() {
      this.socialSecurityPaymentsByMonthReport = null;
      this.error = null;
    },

    async fetchBankUploadReport(payrollRunId: string): Promise<boolean> {
      this.isLoadingBankUpload = true;
      this.error = null;

      try {
        const params = new URLSearchParams({ payroll_run_id: payrollRunId });
        const response = await fetch(
          `${API_URL}/reports/bank-upload?${params.toString()}`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to generate bank upload report.'));
        }

        this.bankUploadReport = body as BankUploadReport;
        return true;
      } catch (error) {
        this.bankUploadReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to generate bank upload report.';
        return false;
      } finally {
        this.isLoadingBankUpload = false;
      }
    },

    clearBankUploadReport() {
      this.bankUploadReport = null;
      this.error = null;
    },

    async fetchLaborCostToDateReport(params: {
      startDate: string;
      endDate: string;
      scope: LaborCostToDateScope;
      departmentId?: number | null;
      employeeGroupId?: string | null;
    }): Promise<boolean> {
      this.isLoadingLaborCostToDate = true;
      this.error = null;

      try {
        const query = new URLSearchParams({
          start_date: params.startDate,
          end_date: params.endDate,
          scope: params.scope,
        });
        if (params.scope === 'department' && params.departmentId != null) {
          query.set('department_id', String(params.departmentId));
        }
        if (params.scope === 'group' && params.employeeGroupId) {
          query.set('employee_group_id', params.employeeGroupId);
        }

        const response = await fetch(
          `${API_URL}/reports/labor-cost-to-date?${query.toString()}`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load labor cost to date report.'));
        }

        this.laborCostToDateReport = body as LaborCostToDateReport;
        return true;
      } catch (error) {
        this.laborCostToDateReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load labor cost to date report.';
        return false;
      } finally {
        this.isLoadingLaborCostToDate = false;
      }
    },

    clearLaborCostToDateReport() {
      this.laborCostToDateReport = null;
      this.error = null;
    },

    async fetchDepartmentHoursAndPayReport(params: {
      period: DepartmentHoursAndPayPeriod;
      payrollRunId?: string | null;
      startDate?: string | null;
      endDate?: string | null;
      scope: DepartmentHoursAndPayScope;
      departmentId?: number | null;
      employeeGroupId?: string | null;
      sortBy?: DepartmentHoursAndPaySortKey[];
    }): Promise<boolean> {
      this.isLoadingDepartmentHoursAndPay = true;
      this.error = null;

      try {
        const query = new URLSearchParams({
          period: params.period,
          scope: params.scope,
        });
        if (params.period === 'payroll_run' && params.payrollRunId) {
          query.set('payroll_run_id', params.payrollRunId);
        }
        if (params.period === 'dates' && params.startDate && params.endDate) {
          query.set('start_date', params.startDate);
          query.set('end_date', params.endDate);
        }
        if (params.scope === 'department' && params.departmentId != null) {
          query.set('department_id', String(params.departmentId));
        }
        if (params.scope === 'group' && params.employeeGroupId) {
          query.set('employee_group_id', params.employeeGroupId);
        }
        for (const key of params.sortBy ?? []) {
          query.append('sort[]', key);
        }

        const response = await fetch(
          `${API_URL}/reports/department-hours-and-pay?${query.toString()}`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load department hours and pay report.'));
        }

        this.departmentHoursAndPayReport = body as DepartmentHoursAndPayReport;
        return true;
      } catch (error) {
        this.departmentHoursAndPayReport = null;
        this.error =
          error instanceof Error ? error.message : 'Failed to load department hours and pay report.';
        return false;
      } finally {
        this.isLoadingDepartmentHoursAndPay = false;
      }
    },

    clearDepartmentHoursAndPayReport() {
      this.departmentHoursAndPayReport = null;
      this.error = null;
    },

    async fetchCompanyPayrollAnalysisByDepartmentReport(params: {
      period: CompanyPayrollAnalysisPeriod;
      payrollRunId?: string | null;
      startDate?: string | null;
      endDate?: string | null;
    }): Promise<boolean> {
      this.isLoadingCompanyPayrollAnalysisByDepartment = true;
      this.error = null;

      try {
        const query = new URLSearchParams({ period: params.period });
        if (params.period === 'payroll_run' && params.payrollRunId) {
          query.set('payroll_run_id', params.payrollRunId);
        }
        if (params.period === 'dates' && params.startDate && params.endDate) {
          query.set('start_date', params.startDate);
          query.set('end_date', params.endDate);
        }

        const response = await fetch(
          `${API_URL}/reports/company-payroll-analysis-by-department?${query.toString()}`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load company payroll analysis by department.'));
        }

        this.companyPayrollAnalysisByDepartmentReport = body as CompanyPayrollAnalysisByDepartmentReport;
        return true;
      } catch (error) {
        this.companyPayrollAnalysisByDepartmentReport = null;
        this.error =
          error instanceof Error ? error.message : 'Failed to load company payroll analysis by department.';
        return false;
      } finally {
        this.isLoadingCompanyPayrollAnalysisByDepartment = false;
      }
    },

    clearCompanyPayrollAnalysisByDepartmentReport() {
      this.companyPayrollAnalysisByDepartmentReport = null;
      this.error = null;
    },

    async fetchPayrollMasterSheetReport(params: {
      scope: PayrollMasterSheetScope;
      departmentId?: number | null;
      periods: PayrollMasterSheetPeriod[];
    }): Promise<boolean> {
      this.isLoadingPayrollMasterSheet = true;
      this.error = null;

      try {
        const query = new URLSearchParams({ scope: params.scope });
        if (params.scope === 'department' && params.departmentId != null) {
          query.set('department_id', String(params.departmentId));
        }
        params.periods.forEach((period, index) => {
          query.set(`periods[${index}][year]`, String(period.year));
          query.set(`periods[${index}][month]`, String(period.month));
        });

        const response = await fetch(
          `${API_URL}/reports/payroll-master-sheet?${query.toString()}`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load payroll master sheet.'));
        }

        this.payrollMasterSheetReport = body as PayrollMasterSheetReport;
        return true;
      } catch (error) {
        this.payrollMasterSheetReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load payroll master sheet.';
        return false;
      } finally {
        this.isLoadingPayrollMasterSheet = false;
      }
    },

    clearPayrollMasterSheetReport() {
      this.payrollMasterSheetReport = null;
      this.error = null;
    },

    async fetchSalaryPaymentsReport(params: {
      startDate: string;
      endDate: string;
      scope: SalaryPaymentsScope;
      departmentId?: number | null;
      sortBy?: SalaryPaymentsSortKey[];
    }): Promise<boolean> {
      this.isLoadingSalaryPayments = true;
      this.error = null;

      try {
        const query = new URLSearchParams({
          start_date: params.startDate,
          end_date: params.endDate,
          scope: params.scope,
        });
        if (params.scope === 'department' && params.departmentId != null) {
          query.set('department_id', String(params.departmentId));
        }
        for (const key of params.sortBy ?? []) {
          query.append('sort[]', key);
        }

        const response = await fetch(
          `${API_URL}/reports/salary-payments?${query.toString()}`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load salary payments report.'));
        }

        this.salaryPaymentsReport = body as SalaryPaymentsReport;
        return true;
      } catch (error) {
        this.salaryPaymentsReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load salary payments report.';
        return false;
      } finally {
        this.isLoadingSalaryPayments = false;
      }
    },

    clearSalaryPaymentsReport() {
      this.salaryPaymentsReport = null;
      this.error = null;
    },

    async fetchPayrollRegistryReport(params: {
      period: PayrollRegistryPeriod;
      payrollRunId?: string | null;
      startDate?: string | null;
      endDate?: string | null;
      scope: PayrollRegistryScope;
      departmentId?: number | null;
      sortBy?: PayrollRegistrySortKey[];
    }): Promise<boolean> {
      this.isLoadingPayrollRegistry = true;
      this.error = null;

      try {
        const query = new URLSearchParams({
          period: params.period,
          scope: params.scope,
        });
        if (params.period === 'payroll_run' && params.payrollRunId) {
          query.set('payroll_run_id', params.payrollRunId);
        }
        if (params.period === 'dates' && params.startDate && params.endDate) {
          query.set('start_date', params.startDate);
          query.set('end_date', params.endDate);
        }
        if (params.scope === 'department' && params.departmentId != null) {
          query.set('department_id', String(params.departmentId));
        }
        for (const key of params.sortBy ?? []) {
          query.append('sort[]', key);
        }

        const response = await fetch(
          `${API_URL}/reports/payroll-registry?${query.toString()}`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load payroll registry.'));
        }

        this.payrollRegistryReport = body as PayrollRegistryReport;
        return true;
      } catch (error) {
        this.payrollRegistryReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load payroll registry.';
        return false;
      } finally {
        this.isLoadingPayrollRegistry = false;
      }
    },

    clearPayrollRegistryReport() {
      this.payrollRegistryReport = null;
      this.error = null;
    },

    async fetchRegistrySummaryByOfficeDepartmentReport(params: {
      period: RegistrySummaryPeriod;
      payrollRunId?: string | null;
      startDate?: string | null;
      endDate?: string | null;
    }): Promise<boolean> {
      this.isLoadingRegistrySummaryByOfficeDepartment = true;
      this.error = null;

      try {
        const query = new URLSearchParams({
          period: params.period,
        });
        if (params.period === 'payroll_run' && params.payrollRunId) {
          query.set('payroll_run_id', params.payrollRunId);
        }
        if (params.period === 'dates' && params.startDate && params.endDate) {
          query.set('start_date', params.startDate);
          query.set('end_date', params.endDate);
        }

        const response = await fetch(
          `${API_URL}/reports/registry-summary-by-office-department?${query.toString()}`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load registry summary.'));
        }

        this.registrySummaryByOfficeDepartmentReport = body as RegistrySummaryByOfficeDepartmentReport;
        return true;
      } catch (error) {
        this.registrySummaryByOfficeDepartmentReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load registry summary.';
        return false;
      } finally {
        this.isLoadingRegistrySummaryByOfficeDepartment = false;
      }
    },

    clearRegistrySummaryByOfficeDepartmentReport() {
      this.registrySummaryByOfficeDepartmentReport = null;
      this.error = null;
    },

    async fetchPayeReport(params: {
      startDate: string;
      endDate: string;
      scope: PayeScope;
      departmentId?: number | null;
      employeeId?: string | null;
    }): Promise<boolean> {
      this.isLoadingPaye = true;
      this.error = null;

      try {
        const query = new URLSearchParams({
          start_date: params.startDate,
          end_date: params.endDate,
          scope: params.scope,
        });
        if (params.scope === 'department' && params.departmentId != null) {
          query.set('department_id', String(params.departmentId));
        }
        if (params.scope === 'employee' && params.employeeId) {
          query.set('employee_id', params.employeeId);
        }

        const response = await fetch(
          `${API_URL}/reports/paye?${query.toString()}`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load PAYE report.'));
        }

        this.payeReport = body as PayeReport;
        return true;
      } catch (error) {
        this.payeReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load PAYE report.';
        return false;
      } finally {
        this.isLoadingPaye = false;
      }
    },

    clearPayeReport() {
      this.payeReport = null;
      this.error = null;
    },

    async fetchEmolumentsWithheldTaxYears(): Promise<boolean> {
      this.isLoadingEmolumentsWithheldTaxYears = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/reports/emoluments-withheld-tax/years`, {
          headers: this.buildHeaders(),
        });
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load payroll years.'));
        }

        const years = Array.isArray(body.years) ? body.years : [];
        this.emolumentsWithheldTaxYears = years
          .map((year: unknown) => Number(year))
          .filter((year: number) => Number.isFinite(year));
        return true;
      } catch (error) {
        this.emolumentsWithheldTaxYears = [];
        this.error = error instanceof Error ? error.message : 'Failed to load payroll years.';
        return false;
      } finally {
        this.isLoadingEmolumentsWithheldTaxYears = false;
      }
    },

    async fetchEmolumentsWithheldTaxReport(params: {
      year: number;
      scope: EmolumentsWithheldTaxScope;
      departmentId?: number | null;
      sortBy?: EmolumentsWithheldTaxSortKey[];
    }): Promise<boolean> {
      this.isLoadingEmolumentsWithheldTax = true;
      this.error = null;

      try {
        const query = new URLSearchParams({
          year: String(params.year),
          scope: params.scope,
        });
        if (params.scope === 'department' && params.departmentId != null) {
          query.set('department_id', String(params.departmentId));
        }
        for (const key of params.sortBy ?? []) {
          query.append('sort[]', key);
        }

        const response = await fetch(
          `${API_URL}/reports/emoluments-withheld-tax?${query.toString()}`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load emoluments and withheld tax.'));
        }

        this.emolumentsWithheldTaxReport = body as EmolumentsWithheldTaxReport;
        return true;
      } catch (error) {
        this.emolumentsWithheldTaxReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load emoluments and withheld tax.';
        return false;
      } finally {
        this.isLoadingEmolumentsWithheldTax = false;
      }
    },

    clearEmolumentsWithheldTaxReport() {
      this.emolumentsWithheldTaxReport = null;
      this.error = null;
    },

    async fetchTd4SummaryYears(): Promise<boolean> {
      this.isLoadingTd4SummaryYears = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/reports/td4-summary/years`, {
          headers: this.buildHeaders(),
        });
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load payroll years.'));
        }

        const years = Array.isArray(body.years) ? body.years : [];
        this.td4SummaryYears = years
          .map((year: unknown) => Number(year))
          .filter((year: number) => Number.isFinite(year));
        return true;
      } catch (error) {
        this.td4SummaryYears = [];
        this.error = error instanceof Error ? error.message : 'Failed to load payroll years.';
        return false;
      } finally {
        this.isLoadingTd4SummaryYears = false;
      }
    },

    async fetchTd4SummaryReport(year: number): Promise<boolean> {
      this.isLoadingTd4Summary = true;
      this.error = null;

      try {
        const query = new URLSearchParams({ year: String(year) });
        const response = await fetch(
          `${API_URL}/reports/td4-summary?${query.toString()}`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load TD4 summary.'));
        }

        this.td4SummaryReport = body as Td4SummaryReport;
        return true;
      } catch (error) {
        this.td4SummaryReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load TD4 summary.';
        return false;
      } finally {
        this.isLoadingTd4Summary = false;
      }
    },

    async fetchTd4SupplementaryReport(params: {
      startDate: string;
      endDate: string;
      scope: Td4SupplementaryScope;
      departmentId?: number | null;
      employeeId?: string | null;
      sortBy?: Td4SupplementarySortKey[];
    }): Promise<boolean> {
      this.isLoadingTd4Supplementary = true;
      this.error = null;

      try {
        const query = new URLSearchParams({
          start_date: params.startDate,
          end_date: params.endDate,
          scope: params.scope,
        });
        if (params.scope === 'department' && params.departmentId != null) {
          query.set('department_id', String(params.departmentId));
        }
        if (params.scope === 'employee' && params.employeeId) {
          query.set('employee_id', params.employeeId);
        }
        for (const key of params.sortBy ?? []) {
          query.append('sort[]', key);
        }

        const response = await fetch(
          `${API_URL}/reports/td4-supplementary?${query.toString()}`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load TD4 supplementary.'));
        }

        this.td4SupplementaryReport = body as Td4SupplementaryReport;
        return true;
      } catch (error) {
        this.td4SupplementaryReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load TD4 supplementary.';
        return false;
      } finally {
        this.isLoadingTd4Supplementary = false;
      }
    },

    clearTd4SupplementaryReport() {
      this.td4SupplementaryReport = null;
    },

    clearTd4SummaryReport() {
      this.td4SummaryReport = null;
      this.error = null;
    },

    async fetchSocialSecurityContributionsReport(params: {
      startDate: string;
      endDate: string;
      scope: SocialSecurityContributionsScope;
      departmentIds?: number[];
      sortBy?: SocialSecurityContributionsSortKey[];
    }): Promise<boolean> {
      this.isLoadingSocialSecurityContributions = true;
      this.error = null;

      try {
        const query = new URLSearchParams({
          start_date: params.startDate,
          end_date: params.endDate,
          scope: params.scope,
        });
        if (params.scope === 'department') {
          for (const id of params.departmentIds ?? []) {
            query.append('department_ids[]', String(id));
          }
        }
        for (const key of params.sortBy ?? []) {
          query.append('sort[]', key);
        }

        const response = await fetch(
          `${API_URL}/reports/social-security-contributions?${query.toString()}`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load social security contributions.'));
        }

        this.socialSecurityContributionsReport = body as SocialSecurityContributionsReport;
        return true;
      } catch (error) {
        this.socialSecurityContributionsReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load social security contributions.';
        return false;
      } finally {
        this.isLoadingSocialSecurityContributions = false;
      }
    },

    clearSocialSecurityContributionsReport() {
      this.socialSecurityContributionsReport = null;
      this.error = null;
    },

    async fetchSocialSecurityDeductionReport(params: {
      startDate: string;
      endDate: string;
      scope: SocialSecurityDeductionScope;
      departmentIds?: number[];
      sortBy?: SocialSecurityDeductionSortKey[];
    }): Promise<boolean> {
      this.isLoadingSocialSecurityDeduction = true;
      this.error = null;

      try {
        const query = new URLSearchParams({
          start_date: params.startDate,
          end_date: params.endDate,
          scope: params.scope,
        });
        if (params.scope === 'department') {
          for (const id of params.departmentIds ?? []) {
            query.append('department_ids[]', String(id));
          }
        }
        for (const key of params.sortBy ?? []) {
          query.append('sort[]', key);
        }

        const response = await fetch(
          `${API_URL}/reports/social-security-deduction?${query.toString()}`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load social security deduction report.'));
        }

        this.socialSecurityDeductionReport = body as SocialSecurityDeductionReport;
        return true;
      } catch (error) {
        this.socialSecurityDeductionReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load social security deduction report.';
        return false;
      } finally {
        this.isLoadingSocialSecurityDeduction = false;
      }
    },

    clearSocialSecurityDeductionReport() {
      this.socialSecurityDeductionReport = null;
      this.error = null;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReportsStore, import.meta.hot));
}
