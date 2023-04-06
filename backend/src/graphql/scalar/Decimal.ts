/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Decimal } from 'decimal.js-light'
import { GraphQLScalarType, Kind } from 'graphql'

export const DecimalScalar = new GraphQLScalarType({
  name: 'Decimal',
  description: 'The `Decimal` scalar type to represent currency values',

  serialize(value: Decimal) {
    return value.toString()
  },

  parseValue(value) {
    return new Decimal(value)
  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError(`${String(ast)} is not a valid decimal value.`)
    }

    return new Decimal(ast.value)
  },
})
