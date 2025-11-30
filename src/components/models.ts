export interface Todo {
  id: number;
  content: string;
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
  id: string;
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
