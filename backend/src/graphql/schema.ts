import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'
import path from 'path'

import isAuthorized from './directive/isAuthorized'

const schema = async (): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [path.join(__dirname, 'resolver', `*.{js,ts}`)],
    authChecker: isAuthorized,
  })
}

export default schema
