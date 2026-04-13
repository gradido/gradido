import { GraphQLScalarType, Kind } from 'graphql'
import { Duration } from 'shared'

export const DurationScalar = new GraphQLScalarType({
  name: 'Duration',
  description: 'The `Duration` scalar type to represent time durations',

  serialize(value: Duration) {
    return value.toString()
  },

  parseValue(value) {
    return new Duration(BigInt(value))
  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError(`${String(ast)} is not a valid float value.`)
    }

    return new Duration(BigInt(ast.value))
  },
})
