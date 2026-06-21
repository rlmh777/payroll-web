export interface Todo {
  id: number;
  content: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  employee?: {
    id: string;
    code: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface Meta {
  totalCount: number;
}

// Employee Model Interfaces
export interface Gender {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  parentId?: string | null;
}

export interface Locality {
  id: string;
  name?: string;
  district?: {
    id: string;
    name: string;
    country?: {
      id: string;
      name: string;
      code1?: string;
      code2?: string;
      nationalityName?: string;
    };
  };
}

export interface District {
  id: string;
  name: string;
  countryId?: string;
}

export interface Honorific {
  id: string;
  name?: string;
}

export interface CitizenshipStatus {
  id: string;
  name?: string;
}

export interface Country {
  id: string;
  name?: string;
  code1?: string;
  code2?: string;
  nationalityName?: string;
}

export interface PayrateFrequency {
  id: number;
  name?: string;
}

export interface PaymentMethod {
  id: string;
  name?: string;
}

export interface LeaveType {
  id: string;
  name?: string;
}

export interface EmployeeLeave {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  fromTime: string;
  toTime: string;
  duration: string;
  totalDays: number;
  notes?: string | null;
  multiplier?: number;
  employee?: Employee | null;
  leave_type?: LeaveType | null;
}

export interface EmploymentDetail {
  id: string;
  employeeId: string;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  payscalePoint?: number | null;
  hourlyRate?: number | null;
  totalRate?: number | null;
  payrateFrequencyId?: string | null;
  benefits?: string | null;
  accountId?: string | null;
  contractTypeId?: string | null;
  employmentPolicies?: string | null;
  contractAgreementPath?: string | null;
  employmentStatusId?: string | null;
  departmentId?: string | null;
  worksiteId?: string | null;
  employeeStatusId?: string | null;
  department?: Department | null;
}

export interface Employee {
  id: string;
  code: string;
  internalId1?: string | null;
  internalId2?: string | null;
  honorificId?: number | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  maidenName?: string | null;
  birthdate: string;
  address1: string;
  address2?: string | null;
  localityId: string;
  phone?: string | null;
  email?: string | null;
  genderId?: number | null;
  socialSecurityNumber: string;
  taxIdentificationNumber?: string | null;
  passportNumber?: string | null;
  votersId?: string | null;
  citizenshipStatusId?: number | null;
  nationalityId?: string | null;
  payrateFrequencyId: string;
  paymentMethodId: string;
  notes?: string | null;
  picturePath?: string | null;
  health?: string | null;
  unionMembership?: string | null;
  // Relationships
  locality?: Locality | null;
  honorific?: Honorific | null;
  gender?: Gender | null;
  citizenshipStatus?: CitizenshipStatus | null;
  nationality?: Country | null;
  employmentDetails?: EmploymentDetail[];
}

export interface Institution {
  id: string;
  name?: string;
}

export interface Degree {
  id: string;
  name?: string;
}

export interface Allowance {
  id: string;
  name: string;
  isTaxable?: boolean;
  isSocialSecurityDeductable?: boolean;
  note?: string | null;
  defaultAmount: number;
}

export interface AccountType {
  id: number;
  name: string;
  normal_balance?: string | null;
  statement?: string | null;
}

export interface Account {
  id: string;
  name: string;
  description?: string | null;
  code1?: string | null;
  code2?: string | null;
  balance?: number | null;
  parent_id?: string | null;
  account_type_id?: number | null;
  parent?: Account | null;
  children?: Account[];
  accountType?: AccountType | null;
}

export interface DeductionType {
    id: number;
    name: string;
  isTaxable?: boolean;
  isSocialSecurityDeductable?: boolean;
  note?: string | null;
  defaultAmount?: number;
}

export interface EmployeeDefaultAllowance {
  id: string;
  employeeId: string;
  allowanceId: string;
  frequencyId: number;
  accountId: string;
  note: string;
  amount: number;
  employee?: Employee | null;
  allowance?: Allowance | null;
  payrate_frequency?: PayrateFrequency | null;
  chart_of_account?: Account | null;
}

export interface Bank {
  id: string;
  name: string;
  code?: string | null;
}

export interface Vendor {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  bankId?: string | null;
  accountNumber?: string | null;
  bank?: Bank | null;
}

export interface EmployeeDefaultDeduction {
  id: string;
  employeeId: string;
  deductionTypeId: number;
  bankId: string;
  accountNumber: string;
  frequencyId: number;
  accountId: string;
  note?: string | null;
  amount: number;
  allowPartialDeduction: boolean;
  applicationRule?: string | null;
  priority: number;
  employee?: Employee | null;
  deduction?: DeductionType | null;
  deductionType?: DeductionType | null;
  payrate_frequency?: PayrateFrequency | null;
  chart_of_account?: Account | null;
  bank?: Bank | null;
}

export interface HistoricalEmployeeDeduction {
  id: string;
  employeeId: string;
  paymentToId: string;
  amount: number;
  note: string;
  payroll_run_id: string;
  accountId: string;
  deductionTypeId: number;
  carryForwardShortfall: number;
  priority: number;
  employee?: Employee | null;
  vendor?: Vendor | null;
  payroll_run?: { id: string } | null;
  chart_of_account?: Account | null;
  deductionType?: DeductionType | null;
}
