import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import CONFIG from '../config'

vi.mock('@vue/apollo-option')
vi.mock('@vue/apollo-composable')
vi.mock('@/store/store')
vi.mock('../routes/router')
vi.mock('../i18n')
vi.mock('@apollo/client/core')
vi.mock('@apollo/client/link/error')

describe('apolloProvider', () => {
  let createHttpLink,
    ApolloLink,
    ApolloClient,
    InMemoryCache,
    createApolloProvider,
    provideApolloClient,
    onError,
    store,
    router,
    i18n

  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    // Import and re-mock all dependencies for each test
    const apolloCore = await import('@apollo/client/core')
    createHttpLink = vi.fn(() => ({ uri: CONFIG.GRAPHQL_URI }))
    ApolloLink = vi.fn((callback) => {
      return {
        concat: vi.fn(),
        request: callback,
      }
    })
    // The chain is assembled with ApolloLink.from, so the mock needs the static too.
    ApolloLink.from = vi.fn((links) => ({ links }))
    ApolloClient = vi.fn()
    InMemoryCache = vi.fn()

    vi.mocked(apolloCore).createHttpLink = createHttpLink
    vi.mocked(apolloCore).ApolloLink = ApolloLink
    vi.mocked(apolloCore).ApolloClient = ApolloClient
    vi.mocked(apolloCore).InMemoryCache = InMemoryCache

    const errorLinkModule = await import('@apollo/client/link/error')
    onError = vi.fn((handler) => ({ handler }))
    vi.mocked(errorLinkModule).onError = onError

    const apolloOption = await import('@vue/apollo-option')
    createApolloProvider = vi.fn()
    vi.mocked(apolloOption).createApolloProvider = createApolloProvider

    const apolloComposable = await import('@vue/apollo-composable')
    provideApolloClient = vi.fn()
    vi.mocked(apolloComposable).provideApolloClient = provideApolloClient

    const storeModule = await import('@/store/store')
    store = {
      state: { token: 'some-token', gradidoID: 'member-a' },
      dispatch: vi.fn(),
      commit: vi.fn(),
    }
    vi.mocked(storeModule).store = store

    const routerModule = await import('../routes/router')
    router = {
      push: vi.fn(),
      currentRoute: { path: '/overview' },
    }
    vi.mocked(routerModule).default = router

    const i18nModule = await import('../i18n')
    i18n = {
      global: {
        t: vi.fn((t) => t),
      },
    }
    vi.mocked(i18nModule).default = i18n

    await import('./apolloProvider')
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('calls the createHttpLink with correct URI', () => {
    expect(createHttpLink).toHaveBeenCalledWith({ uri: CONFIG.GRAPHQL_URI })
  })

  it('calls the ApolloLink', () => {
    expect(ApolloLink).toHaveBeenCalled()
  })

  it('calls the ApolloClient', () => {
    expect(ApolloClient).toHaveBeenCalled()
  })

  it('calls the createApolloProvider', () => {
    expect(createApolloProvider).toHaveBeenCalled()
  })

  it('calls provideApolloClient', () => {
    expect(provideApolloClient).toHaveBeenCalled()
  })

  describe('ApolloLink', () => {
    let authLink

    beforeEach(() => {
      authLink = ApolloLink.mock.calls[0][0]
    })

    it('sets authorization header with token when token exists', () => {
      const setContextMock = vi.fn()
      const getContextMock = vi.fn()
      const forwardMock = vi.fn().mockReturnValue({
        map: vi.fn().mockReturnValue({}),
      })

      const result = authLink(
        { setContext: setContextMock, getContext: getContextMock },
        forwardMock,
      )

      expect(setContextMock).toHaveBeenCalledWith({
        headers: {
          Authorization: 'Bearer some-token',
          clientTimezoneOffset: expect.any(Number),
        },
      })

      expect(forwardMock).toHaveBeenCalled()
    })

    it('sets empty authorization header when no token exists', () => {
      store.state.token = null
      const setContextMock = vi.fn()
      const getContextMock = vi.fn()
      const forwardMock = vi.fn().mockReturnValue({
        map: vi.fn().mockReturnValue({}),
      })

      authLink({ setContext: setContextMock, getContext: getContextMock }, forwardMock)

      expect(setContextMock).toHaveBeenCalledWith({
        headers: {
          Authorization: '',
          clientTimezoneOffset: expect.any(Number),
        },
      })
    })

    it('handles 403.13 error correctly', () => {
      const setContextMock = vi.fn()
      const getContextMock = vi.fn()
      const forwardMock = vi.fn().mockReturnValue({
        map: vi.fn((callback) =>
          callback({ errors: [{ message: '403.13 - Client certificate revoked' }] }),
        ),
      })

      authLink({ setContext: setContextMock, getContext: getContextMock }, forwardMock)

      expect(store.dispatch).toHaveBeenCalledWith('logout', null)
      expect(router.push).toHaveBeenCalledWith('/login')
    })

    it('commits new token to store when apollo response has new token', () => {
      const setContextMock = vi.fn()
      const getContextMock = vi.fn().mockReturnValue({
        response: {
          headers: {
            get: vi.fn(() => 'new-token'),
          },
        },
      })
      const forwardMock = vi.fn().mockReturnValue({
        map: vi.fn((callback) => callback({})),
      })

      authLink({ setContext: setContextMock, getContext: getContextMock }, forwardMock)

      expect(store.commit).toHaveBeenCalledWith('token', 'new-token')
    })

    /**
     * Every answer carries a fresh token, and taking it moves the idle logout on. A question the
     * member did not cause -- the chat's beat, a list asked again because a message arrived --
     * says `renewSession: false`, and the session clock stays: otherwise a tab left open would
     * never be signed out. The test above is the Gegenprobe: without the flag it IS taken.
     */
    it('leaves the token as it is for a question that renews no session', () => {
      const getContextMock = vi.fn().mockReturnValue({
        renewSession: false,
        response: {
          headers: {
            get: vi.fn(() => 'new-token'),
          },
        },
      })
      const forwardMock = vi.fn().mockReturnValue({
        map: vi.fn((callback) => callback({})),
      })

      authLink({ setContext: vi.fn(), getContext: getContextMock }, forwardMock)

      expect(store.commit).not.toHaveBeenCalledWith('token', expect.anything())
    })

    // Only `false` holds the clock: a context that says nothing about it renews as ever.
    it('takes the token where the context says nothing about the session', () => {
      const getContextMock = vi.fn().mockReturnValue({
        renewSession: undefined,
        response: { headers: { get: vi.fn(() => 'new-token') } },
      })
      const forwardMock = vi.fn().mockReturnValue({
        map: vi.fn((callback) => callback({})),
      })

      authLink({ setContext: vi.fn(), getContext: getContextMock }, forwardMock)

      expect(store.commit).toHaveBeenCalledWith('token', 'new-token')
    })

    /**
     * ⛔ An answer renews the session it was asked in, and no other. A question may still be
     * under way when its session ends, and its answer carries a fresh token of the session that
     * is over. The test "commits new token to store" above is the Gegenprobe: while the member
     * who asked stands in the store, the token IS taken.
     */
    describe('an answer that comes when its session is over', () => {
      let answer

      // The question goes out now; its answer comes when the test says so.
      const ask = () => {
        const getContextMock = vi.fn().mockReturnValue({
          response: { headers: { get: vi.fn(() => 'new-token') } },
        })
        const forwardMock = vi.fn().mockReturnValue({
          map: vi.fn((callback) => {
            answer = callback
          }),
        })
        authLink({ setContext: vi.fn(), getContext: getContextMock }, forwardMock)
      }

      it('takes the token where the member who asked is still the one signed in', () => {
        ask()

        answer({ data: { transactionList: {} } })

        expect(store.commit).toHaveBeenCalledWith('token', 'new-token')
      })

      it('leaves the store alone where the member signed out meanwhile', () => {
        ask()
        store.state.token = null
        store.state.gradidoID = null

        answer({ data: { createTransactionLink: {} } })

        expect(store.commit).not.toHaveBeenCalled()
      })

      it('leaves the store alone where somebody else signed in meanwhile', () => {
        ask()
        store.state.token = 'the-token-of-member-b'
        store.state.gradidoID = 'member-b'

        answer({ data: { createTransactionLink: {} } })

        expect(store.commit).not.toHaveBeenCalled()
      })

      // Signed out, and the same member signed in again: the answer is theirs either way.
      it('takes the token where the same member signed in again', () => {
        ask()
        store.state.token = 'a-later-token-of-member-a'

        answer({ data: { createTransactionLink: {} } })

        expect(store.commit).toHaveBeenCalledWith('token', 'new-token')
      })

      describe('to a sign-in', () => {
        it('is taken in a wallet nobody is signed in to', () => {
          store.state.token = null
          store.state.gradidoID = null
          ask()

          answer({ data: { login: { gradidoID: 'member-b' } } })

          expect(store.commit).toHaveBeenCalledWith('token', 'new-token')
        })

        // Signing in over an open session: the form is asked as the member before.
        it('is taken over the session of the member before', () => {
          ask()

          answer({ data: { login: { gradidoID: 'member-b' } } })

          expect(store.commit).toHaveBeenCalledWith('token', 'new-token')
        })

        // The session before ended while the form was under way: the sign-in still counts.
        it('is taken whatever became of the session it was asked in', () => {
          ask()
          store.state.token = null
          store.state.gradidoID = null

          answer({ data: { login: { gradidoID: 'member-b' } } })

          expect(store.commit).toHaveBeenCalledWith('token', 'new-token')
        })

        it('is no sign-in where the server refused it', () => {
          ask()
          store.state.token = null
          store.state.gradidoID = null

          answer({ data: null, errors: [{ message: 'No user with this credentials' }] })

          expect(store.commit).not.toHaveBeenCalled()
        })
      })
    })
  })

  // Without this the wiring is untested: the checks above only prove that onError was
  // called, not what its handler does. Here the handler is taken out of the mock and run,
  // which is the only place the two halves -- the rule and the flag -- are seen together.
  describe('the outdated-app link', () => {
    let handler, appOutdated

    beforeEach(async () => {
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
        networkError: {
          result: { errors: [{ extensions: { code: 'GRAPHQL_VALIDATION_FAILED' } }] },
        },
      })

      expect(appOutdated.value).toBe(true)
    })

    // Reloading does not help against an expired session or a rejected amount, and a bar
    // that says otherwise sends people down the wrong path.
    it('leaves the flag down for every other failure', () => {
      handler({ graphQLErrors: [{ extensions: { code: 'UNAUTHENTICATED' } }] })
      handler({ networkError: { message: 'offline' } })

      expect(appOutdated.value).toBe(false)
    })
  })
})
