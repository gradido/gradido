const commonSchema = require('../../../config/common.schema')
const Joi = require('joi')

module.exports = commonSchema.keys({
  PORT: Joi.number()
    .integer()
    .min(1024)
    .max(49151)
    .description('Port for hosting backend, default: 4000')
    .default(4000)
    .required(), 

  // TODO: check format 
  JWT_SECRET: Joi.string()
    .default('secret123')
    .description('jwt secret for jwt tokens used for login')
    .required(),

  // TODO: check format 
  JWT_EXPIRES_IN: Joi.string()
    .default('10m')
    .description('time for jwt token expire, auto logout')
    .required(),

  GDT_API_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('https://gdt.gradido.net')
    .required(), // TODO: only required if gdt is active

})