import { GraphQLScalarType, Kind } from 'graphql'
import { GradidoUnit } from 'shared'

export const GradidoUnitScalar = new GraphQLScalarType({
  name: 'GradidoUnit',
  description: 'The `GradidoUnit` scalar type to represent currency values',

  serialize(value: GradidoUnit) {
    return value.toString()
  },

  parseValue(value) {
    if (typeof value === 'string') {
      return GradidoUnit.fromString(value)
    }
    throw new TypeError(
      `${String(value)} is not a string, please transport GradidoUnit only as string ro prevent precision lost.`,
    )
  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError(`${String(ast)} is not a valid string value.`)
    }

    return GradidoUnit.fromString(ast.value)
  },
})
