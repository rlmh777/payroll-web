import type { CitizenshipStatus, Country, Gender, Honorific, Locality } from './models';

export interface Person {
  id: string;
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
  socialSecurityExpirationDate?: string | null;
  taxIdentificationNumber?: string | null;
  passportNumber?: string | null;
  votersId?: string | null;
  citizenshipStatusId?: number | null;
  nationalityId?: string | null;
  notes?: string | null;
  picturePath?: string | null;
  health?: string | null;
  unionMembership?: string | null;
  locality?: Locality | null;
  honorific?: Honorific | null;
  gender?: Gender | null;
  citizenshipStatus?: CitizenshipStatus | null;
  nationality?: Country | null;
}
