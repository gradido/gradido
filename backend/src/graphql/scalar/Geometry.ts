/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Geometry as DbGeometry } from '@dbTools/typeorm'
import { GraphQLScalarType, Kind } from 'graphql'

import { Location } from '@model/Location'

export const GeometryScalar = new GraphQLScalarType({
  name: 'Geometry',
  description:
    'The `Geometry` scalar type to represent longitude and latitude values of a geo location',

  serialize(value: DbGeometry): Location {
    // Check type of value
    if (value.type !== 'Point') {
      throw new Error(`GeometryScalar can only serialize Geometry type 'Point' values`)
    }

    return new Location(value.coordinates[0], value.coordinates[1])
  },

  parseValue(value): DbGeometry {
    const geometry: DbGeometry = JSON.parse(value) as DbGeometry
    return geometry
  },

  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError(`${String(ast)} is not a valid Geometry value.`)
    }

    return JSON.parse(ast.value) as DbGeometry
  },
})
