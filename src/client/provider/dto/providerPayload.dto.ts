/**
 *  ProviderPayload Interface.
 */
interface ProviderPayload {
  serviceType: string;
  credentials?: any;
  organizationId?: number;
  delegatedSubject?: string;
}

export default ProviderPayload;
