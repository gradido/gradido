import { GraphQLScalarType, Kind } from 'graphql'
import { GradidoUnit } from 'shared'

export const GradidoUnitScalar = new GraphQLScalarType({
  name: 'GradidoUnit',
  description: 'The `GradidoUnit` scalar type to represent currency values',

  serialize(value: GradidoUnit) {
    // TODO: Talk about this, maybe it is better to send it with fixed after comma digits
    // this is to ensure same functionality like Decimal.toString what was used before
    return value.toStringSmart(2)
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
