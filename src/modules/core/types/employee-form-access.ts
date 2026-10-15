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
  key: string;
  label: string;
  group: string;
}

export type EmployeeFormFieldInputType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'toggle';

export interface EmployeeFormFieldOption {
  label: string;
  value: string;
}

export interface EmployeeFormFieldCatalogItem {
  id?: string;
  key: string;
  label: string;
  tab: string;
  input_type?: EmployeeFormFieldInputType;
  is_required?: boolean;
  options?: EmployeeFormFieldOption[];
  help_text?: string | null;
  is_system?: boolean;
  is_active?: boolean;
  sort?: number;
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
    internalId1: 'edit',
    internalId2: 'edit',
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

const SELF_VIEW_TABS: EmployeeFormTabKey[] = [
  'personal',
  'address',
  'employment',
  'education',
  'payment_details',
  'contact',
  'contracts',
  'documents',
];

export const SELF_VIEW_EMPLOYEE_FORM_ACCESS: EmployeeFormAccess = {
  tabs: Object.fromEntries(
    Object.keys(FULL_EMPLOYEE_FORM_ACCESS.tabs).map((key) => [
      key,
      SELF_VIEW_TABS.includes(key as EmployeeFormTabKey) ? 'view' : 'hidden',
    ]),
  ) as EmployeeFormAccess['tabs'],
  fields: Object.fromEntries(
    Object.keys(FULL_EMPLOYEE_FORM_ACCESS.fields).map((key) => [key, 'view']),
  ) as EmployeeFormAccess['fields'],
};
