import Joi from 'joi';

/**
 * Oauth Schema.
 */
const oAuthValidator: any = Joi.object({
  tokenId: Joi.string().label('tokenId').required()
});

export { oAuthValidator };
