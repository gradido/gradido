const commonSchema = require('../../../config/common.schema')
const Joi = require('joi')

module.exports = commonSchema.keys({
  // export default Joi.object({
  frontend_vite_host: Joi.alternatives()
    .try(
      Joi.string().valid('localhost').messages({ 'any.invalid': 'Must be localhost' }),
      Joi.string()
        .ip({ version: ['ipv4'] })
        .messages({ 'string.ip': 'Must be a valid IPv4 address' }),
      Joi.string().domain().messages({ 'string.domain': 'Must be a valid domain' }),
    )
    .description(
      `
      Host (domain, IPv4, or localhost) for the frontend when running Vite as a standalone Node.js instance;
      internally, nginx forward requests to this address.
      `,
    )
    .default('0.0.0.0'),

  frontend_vite_port: Joi.number()
    .integer()
    .min(1024)
    .max(49151)
    .description('Port for hosting Frontend with Vite as a Node.js instance')
    .default(3000),

  admin_auth_url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('browser_protocol', {
      is: 'https',
      then: Joi.string().uri({ scheme: 'https' }),
      otherwise: Joi.string().uri({ scheme: 'http' }),
    })
    .description('Extern Url for admin-frontend')
    .default('http://0.0.0.0/admin/authenticate?token='),

  meta_url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .description('The base URL for the meta tags.')
    .default('http://localhost'),

  meta_title_de: Joi.string()
    .description('Meta title in German.')
    .default('Gradido – Dein Dankbarkeitskonto'),

  meta_title_en: Joi.string()
    .description('Meta title in English.')
    .default('Gradido - Your gratitude account'),

  meta_description_de: Joi.string()
    .description('Meta description in German.')
    .default(
      'Dankbarkeit ist die Währung der neuen Zeit. Immer mehr Menschen entfalten ihr Potenzial und gestalten eine gute Zukunft für alle.',
    ),

  meta_description_en: Joi.string()
    .description('Meta description in English.')
    .default(
      'Gratitude is the currency of the new age. More and more people are unleashing their potential and shaping a good future for all.',
    ),

  meta_keywords_de: Joi.string()
    .description('Meta keywords in German.')
    .default(
      'Grundeinkommen, Währung, Dankbarkeit, Schenk-Ökonomie, Natürliche Ökonomie des Lebens, Ökonomie, Ökologie, Potenzialentfaltung, Schenken und Danken, Kreislauf des Lebens, Geldsystem',
    ),

  meta_keywords_en: Joi.string()
    .description('Meta keywords in English.')
    .default(
      'Basic Income, Currency, Gratitude, Gift Economy, Natural Economy of Life, Economy, Ecology, Potential Development, Giving and Thanking, Cycle of Life, Monetary System',
    ),

  meta_author: Joi.string()
    .description('The author for the meta tags.')
    .default('Bernd Hückstädt - Gradido-Akademie'),
})
