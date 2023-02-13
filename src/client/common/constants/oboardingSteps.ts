/**
 * List of onboarding steps
 */
const OnboardingStatuses: any = {
  onboardingStatus: {
    NOT_STARTED: { onboardingPage: 0, value: 'not-started' },
    COMPANY_INFO: { onboardingPage: 1, value: 'company-info' },
    CREDENTIAL_UPLOAD: { onboardingPage: 2, value: 'credential-upload' },
    DOMAINS_UPLOAD: { onboardingPage: 3, value: 'domains-upload' },
    AWAITING_FETCH: { onboardingPage: 4, value: 'awaiting-fetch' },
    COMPLETED: { onboardingPage: 5, value: 'completed' }
  }
};

export default OnboardingStatuses;
