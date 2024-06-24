/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { GraphQLScalarType, Kind } from 'graphql'

import { Point } from '@/graphql/model/Point'

export const PointScalar = new GraphQLScalarType({
  name: 'Point',
  description:
    'The `Point` scalar type to represent longitude and latitude values of a geo location',

  serialize(value: Point) {
    // Check type of value
    if (value.type !== 'Point') {
      throw new Error(`PointScalar can only serialize Geometry type 'Point' values`)
    }
    return value
  },

  parseValue(value): Point {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (value.type !== 'Point') {
      throw new Error(`PointScalar can only deserialize Geometry type 'Point' values`)
    }
    return value as Point
  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError(`${String(ast)} is not a valid Geometry value.`)
    }

    const point = JSON.parse(ast.value) as Point
    return point
  },
})
