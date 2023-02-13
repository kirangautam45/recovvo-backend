/**
 * Organization Interface
 */

interface Organization {
  id?: number;
  url: string;
  name: string;
  organizationType: string;
  organizationSize: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export default Organization;
