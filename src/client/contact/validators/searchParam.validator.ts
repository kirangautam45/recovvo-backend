import Joi from 'joi';

/**
 * contact update schema.
 */
const searchParamValidator: any = Joi.object({
  me: Joi.boolean().label('Me').allow('', null),

  subordinates: Joi.alternatives()
    .try(Joi.array().items(Joi.number()).allow(null), Joi.string())
    .label('Subordinates'),

  aliases: Joi.alternatives()
    .try(Joi.array().items(Joi.number()).allow(null), Joi.string())
    .label('Aliases'),

  collaborators: Joi.alternatives()
    .try(Joi.array().items(Joi.number()).allow(null), Joi.string())
    .label('Collaborators')
});

export { searchParamValidator };
