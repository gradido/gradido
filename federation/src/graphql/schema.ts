// import isAuthorized from './directive/isAuthorized'
import { DateTimeScalar, GradidoUnitScalar } from 'core'
import { GraphQLSchema } from 'graphql'
import { GradidoUnit } from 'shared'
import { buildSchema } from 'type-graphql'
import { getApiResolvers } from './api/schema'

// ⛔ Built once per process, and handed out again after that. type-graphql 2 (2.0.0-rc.3) adds
// the parameters of every resolver to its metadata again with each build: after a second
// buildSchema a method is called with its arguments doubled -- (ref, context) becomes
// (ref, ref, context, context) -- so the parameter that should be the context is the first
// argument instead. Nothing fails at build time; the resolvers just read the wrong objects.
let built: Promise<GraphQLSchema> | undefined

export const schema = (): Promise<GraphQLSchema> => {
  built ??= buildSchema({
    resolvers: getApiResolvers(),
    // authChecker: isAuthorized,
    scalarsMap: [
      { type: GradidoUnit, scalar: GradidoUnitScalar },
      { type: Date, scalar: DateTimeScalar },
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
  return built
}
