// AI-GENERATED — not an architecture reference
import { request as httpRequest, IncomingHttpHeaders, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { cleanDB, testEnvironmentWithApp } from '@test/helpers'
import { listenOnFreePort } from '@test/listenOnFreePort'
import { AppDatabase } from 'database'
import { GRADIDO_REALM } from 'shared'
import { verifyGmsHandshakeJWTToken } from '@/apis/gms/GmsClient'
import { CONFIG } from '@/config'

// The real client, with the check of a token wrapped so that one test can have it throw.
jest.mock('@/apis/gms/GmsClient', () => {
  const original = jest.requireActual('@/apis/gms/GmsClient')
  return {
    __esModule: true,
    ...original,
    verifyGmsHandshakeJWTToken: jest.fn(original.verifyGmsHandshakeJWTToken),
  }
})

type Answer = { status: number; headers: IncomingHttpHeaders; body: string }

let server: Server
let port: number
let db: AppDatabase

beforeAll(async () => {
  const testEnv = await testEnvironmentWithApp()
  db = testEnv.db
  server = await listenOnFreePort(testEnv.app)
  port = (server.address() as AddressInfo).port
  await cleanDB()
})

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve))
  await cleanDB()
  await db.destroy()
})

/** A path of this server, asked over HTTP. */
const ask = (
  path: string,
  { method = 'GET', headers = {}, body }: RequestOptions = {},
): Promise<Answer> =>
  new Promise((resolve, reject) => {
    const req = httpRequest({ host: '127.0.0.1', port, path, method, headers }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () =>
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        }),
      )
    })
    req.on('error', reject)
    req.end(body)
  })
type RequestOptions = { method?: string; headers?: Record<string, string>; body?: string }

const operation = (body: unknown): Promise<Answer> =>
  ask('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('the http server of the backend', () => {
  describe('GraphQL', () => {
    it('answers a posted operation with apollo', async () => {
      const answer = await operation({ query: '{ __typename }' })
      expect(answer.status).toBe(200)
      expect(JSON.parse(answer.body)).toEqual({ data: { __typename: 'Query' } })
    })

    it('turns down a persisted query', async () => {
      const answer = await operation({
        query: '{ __typename }',
        extensions: { persistedQuery: { version: 1, sha256Hash: 'a'.repeat(64) } },
      })
      expect(JSON.parse(answer.body).errors[0].extensions.code).toBe(
        'PERSISTED_QUERY_NOT_SUPPORTED',
      )
    })

    it('lets every origin read the answer and its token header', async () => {
      const { headers } = await operation({ query: '{ __typename }' })
      expect(headers['access-control-allow-origin']).toBe('*')
      expect(headers['access-control-expose-headers']).toBe('token')
      expect(headers['access-control-allow-credentials']).toBeUndefined()
    })

    it('sets the security headers on an answer of apollo', async () => {
      const { headers } = await operation({ query: '{ __typename }' })
      expect(headers['x-content-type-options']).toBe('nosniff')
      expect(headers['x-frame-options']).toBe('SAMEORIGIN')
      expect(headers['cross-origin-resource-policy']).toBe('same-origin')
      expect(headers['cross-origin-embedder-policy']).toBe('require-corp')
      expect(headers['strict-transport-security']).toBe('max-age=15552000; includeSubDomains')
    })

    it('shows no landing page', async () => {
      const answer = await ask('/graphql')
      expect(answer.status).toBe(404)
      expect(answer.headers['content-type'] ?? '').not.toContain('text/html')
    })

    it('refuses a body that announces more than it takes', async () => {
      const answer = await operation({
        query: '{ __typename }',
        variables: { x: 'a'.repeat(110_000) },
      })
      expect(answer.status).toBe(413)
    })

    it('refuses a body that does not announce its length', async () => {
      const answer = await new Promise<number>((resolve, reject) => {
        const req = httpRequest(
          {
            host: '127.0.0.1',
            port,
            path: '/graphql',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked' },
          },
          (res) => {
            res.resume()
            res.on('end', () => resolve(res.statusCode ?? 0))
          },
        )
        req.on('error', reject)
        req.end(JSON.stringify({ query: '{ __typename }' }))
      })
      expect(answer).toBe(411)
    })
  })

  it('names its build at /api/version', async () => {
    const answer = await ask('/api/version')
    expect(answer.status).toBe(200)
    expect(JSON.parse(answer.body)).toEqual({ commit: 'dev', source: 'unknown' })
  })

  it('names issuer and keys in the OpenID configuration', async () => {
    const answer = await ask(`/realms/${GRADIDO_REALM}/.well-known/openid-configuration`)
    expect(answer.status).toBe(200)
    expect(JSON.parse(answer.body)).toEqual({
      issuer: expect.stringContaining(CONFIG.COMMUNITY_URL),
      jwks_uri: expect.stringContaining(`/realms/${GRADIDO_REALM}/protocol/openid-connect/certs`),
    })
  })

  it('refuses the GMS hook without a token', async () => {
    const answer = await ask(`/hook/gms/${CONFIG.GMS_WEBHOOK_SECRET}`)
    expect(answer.status).toBe(400)
    expect(JSON.parse(answer.body)).toEqual({ message: 'false' })
  })

  it('answers what a route throws without its message', async () => {
    jest.mocked(verifyGmsHandshakeJWTToken).mockImplementationOnce(() => {
      throw new Error('select from users where gradido_id = secret')
    })
    const answer = await ask(`/hook/gms/${CONFIG.GMS_WEBHOOK_SECRET}?token=x`)
    expect(answer.status).toBe(500)
    expect(answer.body).toBe('Internal Server Error')
  })
})
