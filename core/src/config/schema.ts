import Joi from 'joi'

export const schema = Joi.object({
  FEDERATION_BACKEND_SEND_ON_API: Joi.string()
    .pattern(/^\d+_\d+$/)
    .default('1_0')
    .description('API Version of sending requests to another communities, e.g., "1_0"')
    .required(),

  FEDERATION_XCOM_SENDCOINS_ENABLED: Joi.boolean()
    .default(false)
    .description('Enable or disable the federation send coins feature')
    .optional(),

  FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID: Joi.string()
    .uuid()
    .default('56a55482-909e-46a4-bfa2-cd025e894ebc')
    .description(
      'UUID of the receiver community for federation cross-community transactions if the receiver is unknown',
    )
    .required(),

  FEDERATION_XCOM_MAXREPEAT_REVERTSENDCOINS: Joi.number()
    .integer()
    .min(0)
    .default(3)
    .description('Maximum number of retries for reverting send coins transactions')
    .required(),
})
