import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import CONFIG from '../config'

vi.mock('@vue/apollo-option')
vi.mock('@vue/apollo-composable')
vi.mock('@/store/store')
vi.mock('../routes/router')
vi.mock('../i18n')
vi.mock('@apollo/client/core')

describe('apolloProvider', () => {
  let createHttpLink,
    ApolloLink,
    ApolloClient,
    InMemoryCache,
    createApolloProvider,
    provideApolloClient,
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
    ApolloClient = vi.fn()
    InMemoryCache = vi.fn()

    vi.mocked(apolloCore).createHttpLink = createHttpLink
    vi.mocked(apolloCore).ApolloLink = ApolloLink
    vi.mocked(apolloCore).ApolloClient = ApolloClient
    vi.mocked(apolloCore).InMemoryCache = InMemoryCache

    const apolloOption = await import('@vue/apollo-option')
    createApolloProvider = vi.fn()
    vi.mocked(apolloOption).createApolloProvider = createApolloProvider

    const apolloComposable = await import('@vue/apollo-composable')
    provideApolloClient = vi.fn()
    vi.mocked(apolloComposable).provideApolloClient = provideApolloClient

    const storeModule = await import('@/store/store')
    store = {
      state: { token: 'some-token' },
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
  })
})
