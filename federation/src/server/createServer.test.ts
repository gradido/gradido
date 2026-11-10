// AI-GENERATED — not an architecture reference
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { AppDatabase } from 'database'
import { createServer } from './createServer'

let app: Awaited<ReturnType<typeof createServer>>

beforeAll(async () => {
  app = await createServer()
})

afterAll(async () => {
  await AppDatabase.getInstance().destroy()
})

// a path no route answers: cors and helmet set their headers on every answer
const ask = () => app.handle(new Request('http://localhost/nowhere'))

describe('the http server of the federation', () => {
  it('lets every origin read the answer and its token header', async () => {
    const response = await ask()
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
    expect(response.headers.get('access-control-expose-headers')).toBe('token')
    expect(response.headers.get('access-control-allow-credentials')).toBeNull()
  })

  it('sets the security headers', async () => {
    const response = await ask()
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN')
    expect(response.headers.get('cross-origin-resource-policy')).toBe('same-origin')
    expect(response.headers.get('strict-transport-security')).toBe(
      'max-age=15552000; includeSubDomains',
    )
    expect(response.headers.get('content-security-policy')).toStartWith("default-src 'self'")
  })

  it('no longer answers graphql at /api', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/1_0/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: '{ __typename }' }),
      }),
    )
    expect(response.status).toBe(404)
  })
})
