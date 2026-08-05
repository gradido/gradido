import { describe, it, expect, vi, beforeEach } from 'vitest'

// Covers the one line the sibling file cannot: what the outdated-app link's handler actually
// does. Mocking onError is the only way to get hold of that handler, and mocking it is also
// what stops this file from proving the real chain assembles -- which is why that assertion
// lives in apolloProvider.test.js, where nothing is mocked. The two belong together.
vi.mock('@apollo/client/link/error')
vi.mock('vue-apollo')
vi.mock('@vue/apollo-composable')
vi.mock('../config', () => ({
  default: {
    GRAPHQL_URI: 'http://test-graphql-uri.com',
    WALLET_LOGIN_URL: 'http://test-wallet-login-url.com',
  },
}))
vi.mock('../store/store', () => ({
  default: { state: { token: '' }, dispatch: vi.fn(), commit: vi.fn() },
}))

describe('the outdated-app link', () => {
  let handler, appOutdated

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    // ⚠️ The stub needs concat(), not just request(): apollo-boost's ApolloLink.from calls
    // concat on every member of the chain. A thinner stub throws there -- which is, in
    // passing, the proof that the real @apollo/client link satisfies the old interface, since
    // the unmocked sibling file assembles the same chain and stays green.
    const errorLinkModule = await import('@apollo/client/link/error')
    const onError = vi.fn((h) => ({ request: h, concat: (next) => next }))
    vi.mocked(errorLinkModule).onError = onError

    await import('./apolloProvider')
    handler = onError.mock.calls[0][0]

    const outdatedModule = await import('@/composables/useAppOutdated')
    outdatedModule.resetAppOutdated()
    appOutdated = outdatedModule.useAppOutdated().appOutdated
  })

  it('raises the flag on a validation failure', () => {
    handler({ graphQLErrors: [{ extensions: { code: 'GRAPHQL_VALIDATION_FAILED' } }] })

    expect(appOutdated.value).toBe(true)
  })

  it('raises the flag when the failure arrives as a network error', () => {
    handler({
      networkError: { result: { errors: [{ extensions: { code: 'GRAPHQL_VALIDATION_FAILED' } }] } },
    })

    expect(appOutdated.value).toBe(true)
  })

  // Reloading does not help against an expired session, and a bar that claims otherwise
  // sends a moderator down the wrong path.
  it('leaves the flag down for every other failure', () => {
    handler({ graphQLErrors: [{ extensions: { code: 'UNAUTHENTICATED' } }] })
    handler({ networkError: { message: 'offline' } })

    expect(appOutdated.value).toBe(false)
  })
})
