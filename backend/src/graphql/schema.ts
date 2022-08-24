import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'
import path from 'path'

import isAuthorized from './directive/isAuthorized'
import DecimalScalar from './scalar/Decimal'
import Decimal from 'decimal.js-light'

import { SchemaDirectiveVisitor } from 'graphql-tools'

const schema = async (): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [path.join(__dirname, 'resolver', `!(*.test).{js,ts}`)],
    authChecker: isAuthorized,
    scalarsMap: [{ type: Decimal, scalar: DecimalScalar }],
  })
}

/*
const addDirectives = async (schema: Promise<GraphQLSchema>): Promise<void> => {
  const sc = await schema
  SchemaDirectiveVisitor.visitSchemaDirectives(sc, {
    sample: [path.join(__dirname, 'directive', `!(isAuthorized).{js,ts}`)],
  })
}


addDirectives(schema())
*/

export default schema
