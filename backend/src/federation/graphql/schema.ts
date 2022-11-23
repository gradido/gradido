// import { GraphQLSchema } from 'graphql'
// import { buildSchema } from 'type-graphql'
import path from 'path'

/*
import Decimal from 'decimal.js-light'
import isAuthorized from '@/graphql/directive/isAuthorized'
import DecimalScalar from './scalar/Decimal'

const schema = async (): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [path.join(__dirname, 'resolver', `!(*.test).{js,ts}`)],
    authChecker: isAuthorized,
    scalarsMap: [{ type: Decimal, scalar: DecimalScalar }],
  })
}

export default schema
*/
export const federationResolvers = path.join(__dirname, './v0/resolver/*Resolver.{ts,js}')
