/**
 * clientDomainUserMapping Interface.
 */
interface clientDomainUserMapping {
  id?: number;
  providerUserId: number;
  clientDomainId: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export default clientDomainUserMapping;
