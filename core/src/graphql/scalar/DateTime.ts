// AI-GENERATED — not an architecture reference
import { GraphQLScalarType, Kind } from 'graphql'

const convertStringToDate = (dateString: string): Date => {
  try {
    return new Date(dateString)
  } catch {
    throw new Error('Provided date string is invalid and cannot be parsed')
  }
}

/**
 * The scalar a `Date` travels as, under the name and with the behaviour type-graphql 1 gave
 * it (its GraphQLISODateTime, copied). type-graphql 2 puts `DateTimeISO` of graphql-scalars
 * in its place: another type name in the schema -- which a client that declares a variable
 * `DateTime` no longer finds, another community's server among them -- and a stricter
 * reading of what a date string may be.
 */
export const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description:
    'The javascript `Date` as string. Type represents date and time as the ISO Date string.',

  serialize(value: unknown) {
    if (!(value instanceof Date)) {
      throw new Error(`Unable to serialize value '${value}' as it's not an instance of 'Date'`)
    }
    return value.toISOString()
  },

  parseValue(value: unknown) {
    if (typeof value !== 'string') {
      throw new Error(
        `Unable to parse value '${value}' as GraphQLISODateTime scalar supports only string values`,
      )
    }
    return convertStringToDate(value)
  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new Error(
        `Unable to parse literal value of kind '${ast.kind}' as GraphQLISODateTime scalar supports only '${Kind.STRING}' ones`,
      )
    }
    return convertStringToDate(ast.value)
  },
})
