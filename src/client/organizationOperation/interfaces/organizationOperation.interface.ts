/**
 * organizationOperation Interface
 */

interface organizationOperation {
  id?: number;
  slug: string;
  token: string;
  lastFetchedInfo: string;
  nextFetchInfo: string;
  isFirstSyncComplete: boolean;
  isSuppressionListEnabled: boolean;
  onboardingPage: number;
  onboardingStep: string;
  isDeleted: boolean;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
}

export default organizationOperation;
