/**
 * User Interface.
 */
interface User {
  id?: number;
  name: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  email: string;
  roleId: number;
  password: string;
  isAdmin: boolean;
  isSupervisor: boolean;
  passwordChangedDate?: Date;
  isSuppressed: boolean;
  isActive: boolean;
  hasSignedUp: boolean;
  isSystemUser: boolean;
  invitedById?: number;
  createdBy?: string;
  organizationId: number;
  companyName: string;
  roles: Array<string>;
  clientDomains?: Array<string>;
  clientDomainCount?: number;
  supervisors?: Array<string>;
  createdAt: string;
  updatedAt: string;
  clientDomainObject?: Array<unknown>;
  emailsCount?: number;
  isVerified?: boolean;
  isAppUser?: boolean;
  isDeleted?: boolean;
}

export default User;
