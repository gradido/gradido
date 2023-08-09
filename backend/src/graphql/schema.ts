import path from 'path'

import { validate } from 'class-validator'
import { Decimal } from 'decimal.js-light'
import { GraphQLSchema } from 'graphql'
import { buildSchema } from 'type-graphql'

import { LogError } from '@/server/LogError'

import { isAuthorized } from './directive/isAuthorized'
import { DecimalScalar } from './scalar/Decimal'

export const schema = async (): Promise<GraphQLSchema> => {
  return buildSchema({
    resolvers: [path.join(__dirname, 'resolver', `!(*.test).{js,ts}`)],
    authChecker: isAuthorized,
    scalarsMap: [{ type: Decimal, scalar: DecimalScalar }],
    validate: (argValue) => {
      if (argValue) {
        validate(argValue)
          .then((errors) => {
            if (errors.length > 0) {
              throw new LogError('validation failed. errors: ', errors)
            } else {
              return true
            }
          })
          .catch((e) => {
            throw new LogError('validation throw an exception: ', e)
          })
      }
    },
  })
}
