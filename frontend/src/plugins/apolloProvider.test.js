// import { ApolloClient, ApolloLink, HttpLink } from 'apollo-boost'
// import './apolloProvider'
// import CONFIG from '../config'
//
// import VueApollo from 'vue-apollo'
// import { store } from '../store/store.js'
// import router from '../routes/router'
// import i18n from '../i18n'
//
// jest.mock('vue-apollo')
// jest.mock('../store/store')
// jest.mock('../routes/router')
// jest.mock('../i18n')
//
// jest.mock('apollo-boost', () => {
//   return {
//     __esModule: true,
//     ApolloClient: jest.fn(),
//     ApolloLink: jest.fn(() => {
//       return { concat: jest.fn() }
//     }),
//     InMemoryCache: jest.fn(),
//     HttpLink: jest.fn(),
//   }
// })
//
// describe('apolloProvider', () => {
//   it('calls the HttpLink', () => {
//     expect(HttpLink).toBeCalledWith({ uri: CONFIG.GRAPHQL_URI })
//   })
//
//   it('calls the ApolloLink', () => {
//     expect(ApolloLink).toBeCalled()
//   })
//
//   it('calls the ApolloClient', () => {
//     expect(ApolloClient).toBeCalled()
//   })
//
//   it('calls the VueApollo', () => {
//     expect(VueApollo).toBeCalled()
//   })
//
//   describe('ApolloLink', () => {
//     // mock store
//     const storeDispatchMock = jest.fn()
//     const storeCommitMock = jest.fn()
//     store.state = {
//       token: 'some-token',
//     }
//     store.dispatch = storeDispatchMock
//     store.commit = storeCommitMock
//
//     // mock i18n.t
//     i18n.t = jest.fn((t) => t)
//
//     // mock apllo response
//     const responseMock = {
//       errors: [{ message: '403.13 - Client certificate revoked' }],
//     }
//
//     // mock router
//     const routerPushMock = jest.fn()
//     router.push = routerPushMock
//     router.currentRoute = {
//       path: '/overview',
//     }
//
//     // mock context
//     const setContextMock = jest.fn()
//     const getContextMock = jest.fn(() => {
//       return {
//         response: {
//           headers: {
//             get: jest.fn(() => 'another-token'),
//           },
//         },
//       }
//     })
//
//     // mock apollo link function params
//     const operationMock = {
//       setContext: setContextMock,
//       getContext: getContextMock,
//     }
//
//     const forwardMock = jest.fn(() => {
//       return [responseMock]
//     })
//
//     // get apollo link callback
//     const middleware = ApolloLink.mock.calls[0][0]
//
//     describe('with token in store', () => {
//       it('sets authorization header with token', () => {
//         // run the apollo link callback with mocked params
//         middleware(operationMock, forwardMock)
//         expect(setContextMock).toBeCalledWith({
//           headers: {
//             Authorization: 'Bearer some-token',
//             clientTimezoneOffset: expect.any(Number),
//           },
//         })
//       })
//     })
//
//     describe('without token in store', () => {
//       beforeEach(() => {
//         store.state.token = null
//       })
//
//       it('sets authorization header empty', () => {
//         middleware(operationMock, forwardMock)
//         expect(setContextMock).toBeCalledWith({
//           headers: {
//             Authorization: '',
//             clientTimezoneOffset: expect.any(Number),
//           },
//         })
//       })
//     })
//
//     describe('apollo response is 403.13', () => {
//       beforeEach(() => {
//         // run the apollo link callback with mocked params
//         middleware(operationMock, forwardMock)
//       })
//
//       it('dispatches logout', () => {
//         expect(storeDispatchMock).toBeCalledWith('logout', null)
//       })
//
//       describe('current route is not login', () => {
//         it('redirects to logout', () => {
//           expect(routerPushMock).toBeCalledWith('/login')
//         })
//       })
//
//       describe('current route is login', () => {
//         beforeEach(() => {
//           jest.clearAllMocks()
//           router.currentRoute.path = '/login'
//         })
//
//         it('does not redirect to login', () => {
//           expect(routerPushMock).not.toBeCalled()
//         })
//       })
//     })
//
//     describe('apollo response is with new token', () => {
//       beforeEach(() => {
//         delete responseMock.errors
//         middleware(operationMock, forwardMock)
//       })
//
//       it('commits new token to store', () => {
//         expect(storeCommitMock).toBeCalledWith('token', 'another-token')
//       })
//     })
//
//     describe('apollo response is without new token', () => {
//       beforeEach(() => {
//         jest.clearAllMocks()
//         getContextMock.mockReturnValue({
//           response: {
//             headers: {
//               get: jest.fn(() => null),
//             },
//           },
//         })
//         middleware(operationMock, forwardMock)
//       })
//
//       it('does not commit token to store', () => {
//         expect(storeCommitMock).not.toBeCalled()
//       })
//     })
//   })
// })

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHttpLink, ApolloLink, ApolloClient, InMemoryCache } from '@apollo/client/core'
import { createApolloProvider } from '@vue/apollo-option'
import { provideApolloClient } from '@vue/apollo-composable'
import CONFIG from '../config'
import { store } from '@/store/store'
import router from '../routes/router'
import i18n from '../i18n'

vi.mock('../config', () => ({
  default: {
    GRAPHQL_URI: 'http://example.com/graphql',
  },
}))

vi.mock('@/store/store', () => ({
  store: {
    state: {
      token: 'mock-token',
    },
    dispatch: vi.fn(),
    commit: vi.fn(),
  },
}))

vi.mock('../routes/router', () => ({
  default: {
    currentRoute: { path: '/overview' },
    push: vi.fn(),
  },
}))

vi.mock('../i18n', () => ({
  default: {
    global: {
      t: vi.fn((key) => key),
    },
  },
}))

vi.mock('@apollo/client/core', async () => {
  const actual = await vi.importActual('@apollo/client/core')
  return {
    ...actual,
    ApolloClient: vi.fn(),
    createHttpLink: vi.fn(() => ({ uri: CONFIG.GRAPHQL_URI })),
    ApolloLink: {
      from: vi.fn((links) => links),
    },
  }
})

vi.mock('@vue/apollo-option', () => ({
  createApolloProvider: vi.fn(),
}))

vi.mock('@vue/apollo-composable', () => ({
  provideApolloClient: vi.fn(),
}))

describe('apolloProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // We need to re-import the module under test to reset its state
    vi.resetModules()
    import('./apolloProvider')
  })

  it('creates an Apollo Client with the correct configuration', () => {
    expect(ApolloClient).toHaveBeenCalledWith(
      expect.objectContaining({
        link: expect.any(Array),
        cache: expect.any(InMemoryCache),
      }),
    )

    const apolloClientConfig = ApolloClient.mock.calls[0][0]
    expect(apolloClientConfig.link).toHaveLength(2) // authLink and httpLink
    expect(createHttpLink).toHaveBeenCalledWith({ uri: CONFIG.GRAPHQL_URI })
  })

  it('creates and provides an Apollo Provider', () => {
    expect(createApolloProvider).toHaveBeenCalled()
    expect(provideApolloClient).toHaveBeenCalled()
  })

  it('sets up the auth link correctly', () => {
    const apolloClientConfig = ApolloClient.mock.calls[0][0]
    const authLink = apolloClientConfig.link[0]

    const operation = {
      setContext: vi.fn(),
    }
    const forward = vi.fn(() => Promise.resolve({ data: {} }))

    authLink(operation, forward)

    expect(operation.setContext).toHaveBeenCalledWith({
      headers: {
        Authorization: 'Bearer mock-token',
        clientTimezoneOffset: expect.any(Number),
      },
    })
  })

  it('handles 403.13 errors correctly', async () => {
    const apolloClientConfig = ApolloClient.mock.calls[0][0]
    const authLink = apolloClientConfig.link[0]

    const operation = {
      setContext: vi.fn(),
    }
    const forward = vi.fn(() =>
      Promise.resolve({
        errors: [{ message: '403.13 - Client certificate revoked' }],
      }),
    )

    await authLink(operation, forward)

    expect(store.dispatch).toHaveBeenCalledWith('logout', null)
    expect(router.push).toHaveBeenCalledWith('/login')
  })

  it('updates the token when a new one is received', async () => {
    const apolloClientConfig = ApolloClient.mock.calls[0][0]
    const authLink = apolloClientConfig.link[0]

    const operation = {
      setContext: vi.fn(),
      getContext: vi.fn(() => ({
        response: {
          headers: {
            get: vi.fn(() => 'new-token'),
          },
        },
      })),
    }
    const forward = vi.fn(() => Promise.resolve({ data: {} }))

    await authLink(operation, forward)

    expect(store.commit).toHaveBeenCalledWith('token', 'new-token')
  })
})
