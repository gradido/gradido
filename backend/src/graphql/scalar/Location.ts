import { Location } from '@model/Location'
import { GraphQLScalarType, Kind } from 'graphql'

import { LogError } from '@/server/LogError'

export const LocationScalar = new GraphQLScalarType({
  name: 'Location',
  description:
    'The `Location` scalar type to represent longitude and latitude values of a geo location',

  serialize(value: Location) {
    return value
  },

  parseValue(value): Location {
    try {
      const loc = new Location()

      loc.longitude = value.longitude

      loc.latitude = value.latitude
      return loc
    } catch (err) {
      throw new LogError('Error:', err)
    }
    // return new Location()
  },

  parseLiteral(ast): Location {
    if (ast.kind !== Kind.STRING) {
      throw new TypeError(`${String(ast)} is not a valid Location value.`)
    }
    let loc = new Location()
    try {
      loc = JSON.parse(ast.value) as Location
    } catch (err) {
      throw new LogError('Error:', err)
    }
    return loc
  },
})
