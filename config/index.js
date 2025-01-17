const joi = require('joi')
const pkg = require('../package')

// Function to map and transform environment variables to match the schema
function mapEnvVariablesToSchema(schema) {
  const mappedEnvVariables = {}

  // Iterate over all schema keys
  for (const [key, value] of Object.entries(schema.describe().keys)) {
    const lowerKey = key.toLowerCase() // Convert key to lowercase to match environment variable keys

    // Check if the environment variable exists and map it
    const envValue = process.env[lowerKey]
    if (envValue) {
      // If the value is 'true' or 'false', convert it to a boolean
      if (envValue === 'true' || envValue === 'false') {
        mappedEnvVariables[lowerKey] = envValue === 'true'
      }
      // If the value is a number (check if it's a valid number), convert it
      else if (!isNaN(envValue)) {
        mappedEnvVariables[lowerKey] = Number(envValue) // Convert string to number
      }
      // For all other cases, keep the value as it is
      else {
        mappedEnvVariables[lowerKey] = envValue
      }
    } else {
      // If no environment variable exists, use the default from the schema (if defined)
      if (value.flags) {
        let defaultValue = null
        if (typeof value.flags.default === 'function') {
          defaultValue = value.flags.default(schema)
        } else {
          defaultValue = value.flags.default
        }
        mappedEnvVariables[lowerKey] = defaultValue !== undefined ? defaultValue : null
        // console.log({ key, value: mappedEnvVariables[lowerKey] })        
      }
    }
  }

  return mappedEnvVariables
}

const constants = {
  DECAY_START_TIME: new Date('2021-05-13 17:46:31-0000'), // GMT+0
}

const version = {
  APP_VERSION: pkg.version,
  BUILD_COMMIT: process.env.BUILD_COMMIT ?? null,
  // self reference of `version.BUILD_COMMIT` is not possible at this point, hence the duplicate code
  BUILD_COMMIT_SHORT: (process.env.BUILD_COMMIT ?? '0000000').slice(0, 7),
}

const environment = {
  NODE_ENV: process.env.NODE_ENV,
  DEBUG: process.env.NODE_ENV !== 'production' ?? false,
  PRODUCTION: process.env.NODE_ENV === 'production' ?? false,
  DEFAULT_PUBLISHER_ID: process.env.DEFAULT_PUBLISHER_ID ?? 2896,
}

export function validateAndExport(schema) {
  const envMappedToSchema = mapEnvVariablesToSchema(schema)
  // validate env against schema
  joi.attempt(envMappedToSchema, schema)
  const finalEnvVariables = {}
  for (const [key, value] of Object.entries(envMappedToSchema)) {
    const upperKey = key.toUpperCase() // Convert key back to uppercase
    finalEnvVariables[upperKey] = value
  }
  return {
    ...constants,
    ...version,
    ...environment,
    ...finalEnvVariables
  }
}
