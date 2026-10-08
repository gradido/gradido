import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import gql from 'graphql-tag'
import { ApolloClient } from '@apollo/client/core'
import { provideApolloClient } from '@vue/apollo-composable'
import CONFIG from '../config'
import store from '../store/store'
import { redirectTo } from '@/utils/redirect'
import { apolloClient } from './apolloProvider'

vi.mock('@vue/apollo-composable')
vi.mock('@/utils/redirect')
vi.mock('../config', () => ({
  default: {
    GRAPHQL_URI: 'http://test-graphql-uri.com',
    WALLET_LOGIN_URL: 'http://test-wallet-login-url.com',
  },
}))
vi.mock('../store/store', () => ({
  default: {
    state: { token: '' },
    dispatch: vi.fn(),
    commit: vi.fn(),
  },
}))

describe('Apollo Provider Setup', () => {
  // Taken before the first clearAllMocks forgets the call that carried the client.
  const provided = vi.mocked(provideApolloClient).mock.calls.slice()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ★ This file deliberately does NOT mock @apollo/client, so importing the module builds the
  // real chain: if its links could not be chained, ApolloLink.from would throw on import and
  // every test here would fail. The wiring of the outdated-app link is covered separately in
  // apolloOutdatedLink.test.js, which has to mock onError and therefore cannot prove this.
  it('creates an Apollo client', () => {
    expect(apolloClient).toBeInstanceOf(ApolloClient)
  })

  it('hands that client to the composables', () => {
    expect(provided).toEqual([[apolloClient]])
  })

  it('uses the correct GraphQL URI from config', () => {
    expect(CONFIG.GRAPHQL_URI).toBe('http://test-graphql-uri.com')
  })

  // The auth link itself is tested below, through the real client. Here only that the store
  // it reads and writes is the mocked one.

  it('has access to the store', () => {
    expect(store.state.token).toBeDefined()
    expect(store.dispatch).toBeInstanceOf(Function)
    expect(store.commit).toBeInstanceOf(Function)
  })
})

// The chain itself, with nothing of Apollo mocked: a question goes out through the real
// client to a fetch that answers in its place.
describe('a request through the real client', () => {
  // The client the module built, taken where it hands it to the composables.
  const client = () => vi.mocked(provideApolloClient).mock.calls[0][0]
  const calls = vi.mocked(provideApolloClient).mock.calls.slice()
  const QUESTION = gql`
    query {
      answer
    }
  `
  const answers = (body, headers = {}) =>
    vi.fn(
      async () =>
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'content-type': 'application/json', ...headers },
        }),
    )

  beforeEach(() => {
    vi.clearAllMocks()
    // ... which forgets the call that carried the client as well
    vi.mocked(provideApolloClient).mock.calls.push(...calls)
    store.state.token = ''
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the token and the time zone offset, to the configured address', async () => {
    store.state.token = 'the-token'
    const fetch = answers({ data: { answer: 'yes' } })
    vi.stubGlobal('fetch', fetch)

    const result = await client().query({ query: QUESTION, fetchPolicy: 'no-cache' })

    expect(result.data).toEqual({ answer: 'yes' })
    const [uri, request] = fetch.mock.calls[0]
    expect(uri).toBe('http://test-graphql-uri.com')
    // The client writes header names in lower case, which is how the server reads them.
    expect(request.headers.authorization).toBe('Bearer the-token')
    expect(request.headers.clienttimezoneoffset).toBe(new Date().getTimezoneOffset())
    expect(JSON.parse(request.body).query).toContain('answer')
  })

  it('sends an empty Authorization while nobody is signed in', async () => {
    const fetch = answers({ data: { answer: 'yes' } })
    vi.stubGlobal('fetch', fetch)

    await client().query({ query: QUESTION, fetchPolicy: 'no-cache' })

    expect(fetch.mock.calls[0][1].headers.authorization).toBe('')
  })

  it('takes the fresh token an answer carries', async () => {
    vi.stubGlobal('fetch', answers({ data: { answer: 'yes' } }, { token: 'fresh-token' }))

    await client().query({ query: QUESTION, fetchPolicy: 'no-cache' })

    expect(store.commit).toHaveBeenCalledWith('token', 'fresh-token')
  })

  it('leaves the token alone where an answer carries none', async () => {
    vi.stubGlobal('fetch', answers({ data: { answer: 'yes' } }))

    await client().query({ query: QUESTION, fetchPolicy: 'no-cache' })

    expect(store.commit).not.toHaveBeenCalled()
  })

  it('signs out and leaves for the wallet when the session was revoked', async () => {
    vi.stubGlobal(
      'fetch',
      answers({ errors: [{ message: '403.13 - Client certificate revoked' }] }),
    )

    await expect(client().query({ query: QUESTION, fetchPolicy: 'no-cache' })).rejects.toThrow(
      '403.13 - Client certificate revoked',
    )

    expect(store.dispatch).toHaveBeenCalledWith('logout', null)
    expect(redirectTo).toHaveBeenCalledWith('http://test-wallet-login-url.com')
    expect(store.commit).not.toHaveBeenCalled()
  })
})
