// AI-GENERATED — not an architecture reference
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { AppDatabase } from 'database'
import type { AnyElysia } from 'elysia'
import { getLogger } from 'log4js'
import { createServer } from './createServer'

let app: AnyElysia

beforeAll(async () => {
  app = (await createServer(getLogger('apollo'))).app
})

afterAll(async () => {
  await AppDatabase.getInstance().destroy()
})

const post = (body: unknown): Promise<Response> =>
  app.handle(
    new Request('http://localhost/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )

describe('the http server of the federation', () => {
  it('answers a posted operation with apollo', async () => {
    const response = await post({ query: '{ __typename }' })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ data: { __typename: 'Query' } })
  })

  it('turns down a persisted query', async () => {
    const response = await post({
      query: '{ __typename }',
      extensions: { persistedQuery: { version: 1, sha256Hash: 'a'.repeat(64) } },
    })
    const { errors } = await response.json()
    expect(errors[0].extensions.code).toBe('PERSISTED_QUERY_NOT_SUPPORTED')
  })

  it('lets every origin read the answer and its token header', async () => {
    const response = await post({ query: '{ __typename }' })
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
    expect(response.headers.get('access-control-expose-headers')).toBe('token')
    expect(response.headers.get('access-control-allow-credentials')).toBeNull()
  })

  it('sets the security headers on an answer of apollo', async () => {
    const response = await post({ query: '{ __typename }' })
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN')
    expect(response.headers.get('cross-origin-resource-policy')).toBe('same-origin')
    expect(response.headers.get('strict-transport-security')).toBe(
      'max-age=15552000; includeSubDomains',
    )
    expect(response.headers.get('content-security-policy')).toStartWith("default-src 'self'")
  })

  it('answers an operation asked for with a bare GET, as the backend sends it, with apollo', async () => {
    const response = await app.handle(
      new Request(
        `http://localhost/?query=${encodeURIComponent('{ __typename }')}&variables=%7B%7D`,
      ),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ data: { __typename: 'Query' } })
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('shows no landing page', async () => {
    const response = await app.handle(
      new Request('http://localhost/', { headers: { accept: 'text/html' } }),
    )
    expect(response.status).toBe(406)
    expect(response.headers.get('content-type') ?? '').not.toContain('text/html')
  })
})
