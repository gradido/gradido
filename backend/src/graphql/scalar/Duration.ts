import { GraphQLScalarType, Kind } from 'graphql'
import { Duration } from 'shared'

export const DurationScalar = new GraphQLScalarType({
  name: 'Duration',
  description: 'The `Duration` scalar type to represent time durations',

  serialize(value: Duration) {
    return value.toString()
  },

  parseValue(value) {
    if (typeof value !== 'string') {
      throw new TypeError(`${String(value)} is not a valid string value.`)
    }
    return new Duration(BigInt(value))
  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError(`${String(ast)} is not a valid string value.`)
    }

    return new Duration(BigInt(ast.value))
  },
})
