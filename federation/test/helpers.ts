import {
  AppDatabase,
  dbDeleteAllRowsExceptMigrations,
  HOME_COMMUNITY_CHANGED_CHANNEL,
} from 'database'
import { ApolloServer, HTTPGraphQLHead } from '@apollo/server'
import { DocumentNode, GraphQLError } from 'graphql'

import { createServer } from '@/server/createServer'

import { getLogger } from 'config-schema/test/testSetup'

export const headerPushMock = jest.fn((t) => {
  context.token = t.value
})

const context = {
  token: '',
  setHeaders: {
    push: headerPushMock,
    forEach: jest.fn(),
  },
  clientTimezoneOffset: 0,
}

type StringOrAst = string | DocumentNode
interface TestResponse<TData> {
  data?: TData
  errors?: GraphQLError[]
  extensions?: Record<string, unknown>
  http: HTTPGraphQLHead
}

/**
 * What `apollo-server-testing` handed out until Apollo Server 3 dropped the package: `query`
 * and `mutate`, which run an operation against the server without HTTP in between.
 */
export interface ApolloServerTestClient {
  query<TData = any, TVariables = Record<string, any>>(query: {
    query: StringOrAst
    mutation?: undefined
    variables?: TVariables
    operationName?: string
  }): Promise<TestResponse<TData>>
  mutate<TData = any, TVariables = Record<string, any>>(mutation: {
    mutation: StringOrAst
    query?: undefined
    variables?: TVariables
    operationName?: string
  }): Promise<TestResponse<TData>>
}

/**
 * The answer is handed on in the shape the tests read: data, errors and extensions at the
 * top, and each error a GraphQLError again -- the server answers with plain objects, which
 * no `new GraphQLError(...)` of an expectation equals.
 */
export const createTestClient = (server: ApolloServer<any>): ApolloServerTestClient => {
  const test = async ({ query, mutation, ...args }: any): Promise<any> => {
    const operation = query || mutation
    if (!operation || (query && mutation)) {
      throw new Error('Either `query` or `mutation` must be passed, but not both.')
    }
    const response = await server.executeOperation({ query: operation, ...args })
    if (response.body.kind !== 'single') {
      throw new Error('The test client reads no answer that is delivered in parts.')
    }
    const { data, errors, extensions } = response.body.singleResult
    return {
      data,
      errors: errors?.map(
        ({ message, path, extensions }) => new GraphQLError(message, { path, extensions }),
      ),
      extensions,
      http: response.http,
    }
  }
  return { query: test, mutate: test }
}

export const cleanDB = async () => {
  // Every table except `migrations`, in one statement that reads the table list itself - a
  // table with or without a TypeORM entity, and one added tomorrow, alike.
  await dbDeleteAllRowsExceptMigrations()
  
  // The rows are gone past the query functions, so nobody announced it: the cached home
  // community would outlive them. publish() reaches this process at once, Redis or not.
  AppDatabase.getInstance().publish(HOME_COMMUNITY_CHANGED_CHANNEL)
}

export const testEnvironment = async (testLogger = getLogger('apollo') /*, testI18n = i18n */) => {
  const server = await createServer(/* context, */ testLogger /* , testI18n */)
  const con = server.con
  const testClient = createTestClient(server.apollo)
  const mutate = testClient.mutate
  const query = testClient.query
  return { mutate, query, con }
}

export const resetToken = () => {
  context.token = ''
}

// format date string as it comes from the frontend for the contribution date
export const contributionDateFormatter = (date: Date): string => {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
}

export const setClientTimezoneOffset = (offset: number): void => {
  context.clientTimezoneOffset = offset
}
