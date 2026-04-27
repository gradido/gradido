import { Decimal } from 'decimal.js-light'
import { GraphQLSchema } from 'graphql'
import { GradidoUnit } from 'shared'
import { buildSchema } from 'type-graphql'
import { getApiResolvers } from './api/schema'
// import isAuthorized from './directive/isAuthorized'
import { DecimalScalar } from './scalar/Decimal'
import { GradidoUnitScalar } from './scalar/GradidoUnit'

export const schema = async (): Promise<GraphQLSchema> => {
  return await buildSchema({
    resolvers: getApiResolvers(),
    // authChecker: isAuthorized,
    scalarsMap: [
      { type: Decimal, scalar: DecimalScalar },
      { type: GradidoUnit, scalar: GradidoUnitScalar },
    ],
    /*
    validate: {
      validationError: { target: false },
      skipMissingProperties: true,
      skipNullProperties: true,
      skipUndefinedProperties: false,
      forbidUnknownValues: true,
      stopAtFirstError: true,
    },
    */
  })
}
