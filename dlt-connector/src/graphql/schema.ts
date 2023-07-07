import path from 'path'
import glob from 'glob'

import { Decimal } from 'decimal.js-light'
import { GraphQLSchema } from 'graphql'
import { buildSchema, NonEmptyArray } from 'type-graphql'

import { DecimalScalar } from './scalar/Decimal'

export const schema = async (): Promise<GraphQLSchema> => {
  const resolverFiles = glob.sync(path.join(__dirname, 'resolver', '!(*.test).{js,ts}'))
  const importPromises = resolverFiles.map((file) => import(file))
  const importedModules = await Promise.all(importPromises)
  const resolverClasses = importedModules.map((module) => module.default)
  const filteredResolvers = resolverClasses.filter((resolver) => typeof resolver === 'function')

  if (filteredResolvers.length === 0) {
    throw new Error('No resolvers found.')
  }

  return buildSchema({
    // eslint-disable-next-line @typescript-eslint/ban-types
    resolvers: filteredResolvers as NonEmptyArray<Function>,
    scalarsMap: [{ type: Decimal, scalar: DecimalScalar }],
  })
}
