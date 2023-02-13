import Joi from 'joi';

/**
 * Onboarding validator
 */
const onboardingValidator: any = Joi.object({
  currentStep: Joi.string().label('CurrentStep').required()
});

export { onboardingValidator };
