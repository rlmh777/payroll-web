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
  honorificId?: string | null;
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
  citizenshipStatusId?: string | null;
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
  defaultPayrateFrequency?: PayrateFrequency | null;
  paymentMethods?: PaymentMethod | null;
  employmentDetails?: EmploymentDetail[];
}
