import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'
import path from 'path'

const schema = async (): Promise<GraphQLSchema> => {
  return await buildSchema({
    resolvers: [path.join(__dirname, `./resolver/*Resolver.{ts,js}`)],
  })
}

export default schema
