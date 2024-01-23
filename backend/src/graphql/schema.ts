import path from 'path'

import { Decimal } from 'decimal.js-light'
import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'

import { Location } from '@model/Location'

import { isAuthorized } from './directive/isAuthorized'
import { DecimalScalar } from './scalar/Decimal'
import { LocationScalar } from './scalar/Location'

export const schema = async (): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [path.join(__dirname, 'resolver', `!(*.test).{js,ts}`)],
    authChecker: isAuthorized,
    scalarsMap: [
      { type: Decimal, scalar: DecimalScalar },
      { type: Location, scalar: LocationScalar },
    ],
    validate: {
      validationError: { target: false },
      skipMissingProperties: true,
      skipNullProperties: true,
      skipUndefinedProperties: true,
      forbidUnknownValues: false,
      stopAtFirstError: false,
    },
  })
}
