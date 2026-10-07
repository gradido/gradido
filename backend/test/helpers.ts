import { deflateSync } from 'node:zlib'
import { ApolloServer, HTTPGraphQLHead } from '@apollo/server'
import { DocumentNode, GraphQLError } from 'graphql'
import { dbDeleteAllRowsExceptMigrations } from 'database'
import {
  AppDatabase,
  HOME_COMMUNITY_CHANGED_CHANNEL,
} from 'database'

import { newRequestBudget } from '@/server/context'
import { createApolloServer } from '@/server/createApolloServer'
import { createServer } from '@/server/createServer'

import { getLogger } from 'log4js'
import { reencodeImage } from 'shared-native'

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

// The context of one operation, as the context function makes one for every HTTP request:
// what the tests of a file share -- the token, the offset -- and a budget of its own.
const operationContext = () => ({ ...context, requestBudget: newRequestBudget() })

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
 * `contextFor`: makes the context an operation is run with, a new one each time.
 *
 * The answer is handed on in the shape the tests read: data, errors and extensions at the
 * top, and each error a GraphQLError again -- the server answers with plain objects, which
 * no `new GraphQLError(...)` of an expectation equals.
 */
export const createTestClient = (
  server: ApolloServer<any>,
  contextFor: () => object,
): ApolloServerTestClient => {
  const test = async ({ query, mutation, ...args }: any): Promise<any> => {
    const operation = query || mutation
    if (!operation || (query && mutation)) {
      throw new Error('Either `query` or `mutation` must be passed, but not both.')
    }
    const response = await server.executeOperation(
      { query: operation, ...args },
      { contextValue: contextFor() },
    )
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

// Apollo on the database, and nothing of HTTP: operations run through the test client.
export const testEnvironment = async (testLogger = getLogger('apollo')) => {
  const server = await createApolloServer(testLogger)
  const testClient = createTestClient(server.apollo, operationContext)
  return { mutate: testClient.mutate, query: testClient.query, con: server.con, db: server.db }
}

// The same with the Express application around it (`app`), for a test that asks an address
// outside GraphQL. It is not listening: the test starts it on a port of its own. What comes
// in over that port gets the context of a real request; the test client keeps its own.
export const testEnvironmentWithApp = async (testLogger = getLogger('apollo')) => {
  const server = await createServer(testLogger)
  const testClient = createTestClient(server.apollo, operationContext)
  return {
    mutate: testClient.mutate,
    query: testClient.query,
    con: server.con,
    db: server.db,
    app: server.app,
  }
}

// Taken while it is still the real one - see useFakeTimersForDrizzle.
const realNextTick = process.nextTick

/**
 * `jest.useFakeTimers()` for code that reaches a Drizzle query. Jest 27's modern timers fake
 * `process.nextTick` along with the rest, and mysql2 - Drizzle's driver - hands every result
 * over through it: under the plain call a Drizzle query waits forever, and the test dies on
 * the hook timeout. TypeORM runs on the `mysql` package and does not notice, which is why
 * this only shows once a query moves to Drizzle. Undone as usual by `jest.useRealTimers()`.
 */
export const useFakeTimersForDrizzle = () => {
  jest.useFakeTimers()
  process.nextTick = realNextTick
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

/*
 * Pictures for tests that set an avatar. The server decodes what it is sent and encodes it
 * again, so a few bytes between two JPEG markers no longer pass.
 *
 * ⛔ Each of the three is a picture as the server's own encoder writes it, and comes out of it
 * unchanged: what a test sends is what it reads back. An update of rust-image-ffi that changes
 * the encoder's output breaks that, and UserResolver.test.ts says so first ("come out as they
 * went in") -- then encode the three again and replace them here.
 */
// 4 x 2 grey pixels.
export const TEST_AVATAR_SMALL_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//wAALCAACAAQBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AP//Z'
// 6 x 4 pixels in color: another picture than the small one, or a resolver handing back the
// wrong column would pass.
export const TEST_AVATAR_FULL_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCAAEAAYDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAABf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AIgCDz//2Q=='
// 200 x 200 grey pixels: more than a small rendition may have, well within a full one.
export const TEST_AVATAR_200_PIXELS_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//wAALCADIAMgBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//Z'

// The picture tests send with a chat message, a transfer or a greeting: the small one above,
// and the size the decoder finds in it -- which is what the server stores, whatever size the
// sender gives.
export const TEST_PICTURE_BASE64 = TEST_AVATAR_SMALL_BASE64
export const TEST_PICTURE_SIZE = { width: 4, height: 2 }

/**
 * A JPEG of seeded noise, encoded by the server's own encoder: for the tests that need a picture
 * with weight. Noise is what a JPEG needs the most bytes for -- 200 x 200 come to some 30 KB,
 * about what the wallet's largest chat picture weighs.
 */
export const testNoiseJpeg = async (width: number, height: number): Promise<Buffer> => {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    return c >>> 0
  })
  const chunk = (type: string, data: Buffer): Buffer => {
    const typeAndData = Buffer.concat([Buffer.from(type), data])
    let crc = 0xffffffff
    for (const byte of typeAndData) {
      crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
    }
    const length = Buffer.alloc(4)
    length.writeUInt32BE(data.length)
    const checksum = Buffer.alloc(4)
    checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0)
    return Buffer.concat([length, typeAndData, checksum])
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // bits per channel
  header[9] = 2 // RGB
  const rowBytes = 1 + width * 3
  const rows = Buffer.alloc(height * rowBytes)
  let seed = 1
  for (let i = 0; i < rows.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    // the first byte of a row is its filter: none
    rows[i] = i % rowBytes === 0 ? 0 : seed >>> 24
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 0 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
  const encoded = await reencodeImage(png, { maxOutputBytes: 1024 * 1024, inputFormats: ['png'] })
  if (!encoded.success) {
    throw new Error(encoded.error.name)
  }
  return encoded.value.data
}
