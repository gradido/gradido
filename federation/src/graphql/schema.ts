import { Decimal } from 'decimal.js-light'
import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'
import { getApiResolvers } from './api/schema'
// import isAuthorized from './directive/isAuthorized'
import { DecimalScalar } from './scalar/Decimal'

export const schema = async (): Promise<GraphQLSchema> => {
  return await buildSchema({
    resolvers: getApiResolvers(),
    // authChecker: isAuthorized,
    scalarsMap: [{ type: Decimal, scalar: DecimalScalar }],
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
