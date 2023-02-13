/**
 * Provider Interface.
 */
interface Provider {
  serviceType: string;
  credentials: any;
  organizationId: number;
  delegatedSubject: string;
}

export default Provider;
