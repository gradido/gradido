// import isAuthorized from './directive/isAuthorized'
import { GradidoUnitScalar } from 'core'
import { GraphQLSchema } from 'graphql'
import { GradidoUnit } from 'shared'
import { buildSchema } from 'type-graphql'
import { getApiResolvers } from './api/schema'

export const schema = async (): Promise<GraphQLSchema> => {
  return await buildSchema({
    resolvers: getApiResolvers(),
    // authChecker: isAuthorized,
    scalarsMap: [{ type: GradidoUnit, scalar: GradidoUnitScalar }],
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
