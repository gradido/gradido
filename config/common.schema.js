const Joi = require('joi')

module.exports = Joi.object({
  browser_protocol: Joi.string()
    .valid('http', 'https')
    .description(
      'Protocol for all URLs in the browser, must be either http or https to prevent mixed content issues.',
    )
    .default('http'),

  community_url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('browser_protocol', {
      is: 'https',
      then: Joi.string().uri({ scheme: 'https' }), 
      otherwise: Joi.string().uri({ scheme: 'http' }),
    })
    .description('The base URL of the community')
    .default('http://0.0.0.0'),

  external_backend_url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('browser_protocol', {
      is: 'https',
      then: Joi.string().uri({ scheme: 'https' }), 
      otherwise: Joi.string().uri({ scheme: 'http' }),
    })
    .description(
      `
      The external URL of the backend service,
      accessible from outside the server (e.g., via Nginx or the server's public URL),
      must use the same protocol as browser_protocol.      
    `,
    )
    .default('http://0.0.0.0/graphql'),

  community_name: Joi.string()
    .min(3)
    .max(100)
    .description('The name of the community')
    .default('Gradido Entwicklung'),  

  community_description: Joi.string()
    .min(10)
    .max(300)
    .description('A short description of the community')
    .default('Die lokale Entwicklungsumgebung von Gradido.'),

  community_support_email: Joi.string()
    .email()
    .description('The support email address for the community will be used in frontend and E-Mails')
    .default('support@supportmail.com'),

  community_location: Joi.string()
    .pattern(/^[-+]?[0-9]{1,2}(\.[0-9]+)?,\s?[-+]?[0-9]{1,3}(\.[0-9]+)?$/)
    .description('Geographical location of the community in "latitude, longitude" format')
    .default('49.280377, 9.690151'),

  gdt_active: Joi.boolean()
    .description('Flag to indicate if gdt (Gradido Transform) service is used.')
    .default(false),

  gms_active: Joi.boolean()
    .description('Flag to indicate if the GMS (Geographic Member Search) service is used.')
    .default(false),

  humhub_active: Joi.boolean()
    .description('Flag to indicate if the HumHub based Community Server is used.')
    .default(false),
})