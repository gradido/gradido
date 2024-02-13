/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Point as DbPoint } from '@dbTools/typeorm'
import { GraphQLScalarType, Kind } from 'graphql'

export const PointScalar = new GraphQLScalarType({
  name: 'Point',
  description:
    'The `Point` scalar type to represent longitude and latitude values of a geo location',

  serialize(value: DbPoint) {
    // Check type of value
    if (value.type !== 'Point') {
      throw new Error(`PointScalar can only serialize Geometry type 'Point' values`)
    }
    return value
  },

  parseValue(value): DbPoint {
    const point = JSON.parse(value) as DbPoint
    return point
  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError(`${String(ast)} is not a valid Geometry value.`)
    }

    const point = JSON.parse(ast.value) as DbPoint
    return point
  },
})
