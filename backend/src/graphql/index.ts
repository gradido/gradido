import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'

import resolvers from './resolvers'
import { isAuthorized } from '../auth/auth'

const schema = async (): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: resolvers(),
    authChecker: isAuthorized,
  })
}

export { schema }
