import { ObjectSchema } from 'joi'
export * from './commonSchema'

export function validate(schema: ObjectSchema, data: any) {
  const { error } = schema.validate(data)
  const schemaJson = schema.describe()
  if (error) {
    error.details.forEach((err) => {
      if (!err.context) {
        throw new Error('missing context in config validation with joi')
      }
      const key = err.context.key
      if (!key) {
        throw new Error('missing key in config validation with joi')
      }
      const value = err.context.value
      const description = schemaJson.keys[key]
        ? schema.describe().keys[key].flags.description
        : 'No description available'
      if (data[key] === undefined) {
        throw new Error(`Environment Variable '${key}' is missing. ${description}`)
      } else {
        throw new Error(
          `Error on Environment Variable ${key} with value = ${value}: ${err.message}. ${description}`,
        )
      }
    })
  }
}