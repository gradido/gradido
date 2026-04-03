import { GradidoUnit } from 'shared-native'
import { GraphQLScalarType, Kind } from 'graphql'

export const GradidoUnitScalar = new GraphQLScalarType({
  name: 'GradidoUnit',
  description: 'The `GradidoUnit` scalar type to represent currency values',

  serialize(value: GradidoUnit) {
    return value.toString()
  },

  parseValue(value) {
    return new GradidoUnit(value)
  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError(`${String(ast)} is not a valid float value.`)
    }

    return new GradidoUnit(ast.value)
  },
})
