/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { GraphQLScalarType, Kind } from 'graphql'

import { Location } from '@model/Location'

export const LocationScalar = new GraphQLScalarType({
  name: 'Location',
  description:
    'The `Location` scalar type to represent longitude and latitude values of a geo location',

  serialize(value: Location) {
    console.log('serialize LocationScalar:', value)
    return value
  },

  parseValue(value): Location {
    console.log('parseValue LocationScalar:', value)
    try {
      const loc = new Location()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      loc.longitude = value.longitude
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      loc.latitude = value.latitude
      console.log('parsed:', loc)
      return loc
    } catch (err) {
      console.log('Error:', err)
    }
    return new Location()
  },

  parseLiteral(ast): Location {
    console.log('parseLiteral LocationScalar:', ast)
    if (ast.kind !== Kind.STRING) {
      throw new TypeError(`${String(ast)} is not a valid Location value.`)
    }
    let loc = new Location()
    try {
      loc = JSON.parse(ast.value) as Location
      console.log('parsed:', loc)
    } catch (err) {
      console.log('Error:', err)
    }
    return loc
  },
})
