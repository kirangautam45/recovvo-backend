interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  role?: string;
  onboardingStatus?: { onboardingStep: string };
  organizationId?: number;
  schema: string;
}

export default TokenResponse;
