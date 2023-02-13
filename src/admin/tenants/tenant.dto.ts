/**
 * Tenant Interface.
 */
interface Tenant {
  id: number;
  slug: string;
  isSchemaCreated: boolean;
  organizationName: string;
  organizationAdminFirstName: string;
  organizationAdminLastName: string;
  organizationAdminEmail: string;
  addById?: number;
  isActive: boolean;
}

export default Tenant;
