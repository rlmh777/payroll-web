export type EmployeeFormTabMode = 'hidden' | 'view' | 'edit';
export type EmployeeFormFieldMode = 'hidden' | 'view' | 'locked' | 'edit';

export type EmployeeFormTabKey =
  | 'personal'
  | 'address'
  | 'employment'
  | 'education'
  | 'payment_details'
  | 'contact'
  | 'contracts'
  | 'compensation'
  | 'documents'
  | 'incidents'
  | 'time_travel'
  | 'allowances'
  | 'deductions'
  | 'ss_benefit';

export interface EmployeeFormAccess {
  tabs: Record<string, EmployeeFormTabMode>;
  fields: Record<string, EmployeeFormFieldMode>;
}

export interface EmployeeFormTabCatalogItem {
  key: EmployeeFormTabKey;
  label: string;
  group: 'stepper' | 'details';
}

export interface EmployeeFormFieldCatalogItem {
  key: string;
  label: string;
  tab: string;
}

export const FULL_EMPLOYEE_FORM_ACCESS: EmployeeFormAccess = {
  tabs: {
    personal: 'edit',
    address: 'edit',
    employment: 'edit',
    education: 'edit',
    payment_details: 'edit',
    contact: 'edit',
    contracts: 'edit',
    compensation: 'edit',
    documents: 'edit',
    incidents: 'edit',
    time_travel: 'edit',
    allowances: 'edit',
    deductions: 'edit',
    ss_benefit: 'edit',
  },
  fields: {
    code: 'edit',
    honorificId: 'edit',
    firstName: 'edit',
    lastName: 'edit',
    middleName: 'edit',
    maidenName: 'edit',
    birthdate: 'edit',
    socialSecurityNumber: 'edit',
    socialSecurityExpirationDate: 'edit',
    passportNumber: 'edit',
    votersId: 'edit',
    taxIdentificationNumber: 'edit',
    phone: 'edit',
    email: 'edit',
    genderId: 'edit',
    nationalityId: 'edit',
    citizenshipStatusId: 'edit',
    address1: 'edit',
    address2: 'edit',
    localityId: 'edit',
    unionMembership: 'edit',
    health: 'edit',
    employmentStatusId: 'edit',
    employeeStatusId: 'edit',
    timesheetTemplateId: 'edit',
    supervisorId: 'edit',
    paymentMethodId: 'edit',
  },
};
