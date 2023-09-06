/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Decimal } from 'decimal.js-light'
import { GraphQLScalarType, Kind, ValueNode } from 'graphql'

export const DecimalScalar = new GraphQLScalarType({
  name: 'Decimal',
  description: 'The `Decimal` scalar type to represent currency values',

  serialize(value: unknown): string {
    if (!(value instanceof Decimal)) {
      throw new TypeError(`Value is not a Decimal: ${value}`)
    }
    return value.toString()
  },

  parseValue(value: unknown): Decimal {
    if (typeof value !== 'string') {
      throw new TypeError('Decimal values must be strings')
    }
    return new Decimal(value)
  },

  parseLiteral(ast: ValueNode): Decimal {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError(`${String(ast)} is not a valid decimal value.`)
    }

    return new Decimal(ast.value)
  },
})
