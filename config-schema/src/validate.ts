import { ObjectSchema } from 'joi'

export function validate(schema: ObjectSchema, data: any) {
  const { error } = schema.validate(data)
  const schemaJson = schema.describe()
  if (error) {
    error.details.forEach((err) => {
      const details = JSON.stringify(err, null, 2)
      if (!err.context) {
        throw new Error('missing context in config validation with joi: ' + details)
      }
      if (!schemaJson) {
        throw new Error('invalid schema in config validation with joi: ' + details)
      }
      const key = err.context.key
      if (key === undefined) {
        throw new Error('missing key in config validation with joi: ' + details)
      }
      const value = err.context.value
      try {
        const description = schemaJson.keys[key]
          ? schema.describe().keys[key].flags.description
          : 'No description available'
          if (data[key] === undefined) {
            throw new Error(
              `Environment Variable '${key}' is missing. ${description}, details: ${details}`,
            )
          } else {
            throw new Error(
              `Error on Environment Variable ${key} with value = ${value}: ${err.message}. ${description}`,
            )
          }
      } catch (e) {
        console.error('Error getting description for key ' + key + ': ' + e)
        throw e
      }
    })
  }
}
