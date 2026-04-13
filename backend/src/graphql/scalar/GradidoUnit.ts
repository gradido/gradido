import Decimal from 'decimal.js-light'
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
    } else if (typeof value === 'number') {
      return GradidoUnit.fromNumber(value)
    } else if (typeof value === 'bigint') {
      return new GradidoUnit(value)
    } else if (value instanceof Decimal) {
      return GradidoUnit.fromDecimal(value)
    }
    throw new TypeError(`${String(value)} is not a valid GradidoUnit value.`)
  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError(`${String(ast)} is not a valid float value.`)
    }

    return GradidoUnit.fromString(ast.value)
  },
})
