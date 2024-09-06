// import { ApolloClient, ApolloLink, HttpLink } from 'apollo-boost'
// import './apolloProvider'
// import CONFIG from '../config'
//
// import VueApollo from 'vue-apollo'
// import store from '../store/store'
// import i18n from '../i18n'
//
// jest.mock('vue-apollo')
// jest.mock('../store/store')
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
//     const windowLocationMock = jest.fn()
//     delete window.location
//     window.location = {
//       assign: windowLocationMock,
//     }
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
//       it('redirects to logout', () => {
//         expect(windowLocationMock).toBeCalledWith('http://localhost/login')
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
import { ApolloClient, ApolloLink, InMemoryCache, HttpLink } from 'apollo-boost'
import VueApollo from 'vue-apollo'
import CONFIG from '../config'
import store from '../store/store'
import { provideApolloClient } from '@vue/apollo-composable'

vi.mock('apollo-boost', async () => {
  const actual = await vi.importActual('apollo-boost')
  return {
    ...actual,
    ApolloClient: vi.fn(() => ({
      // Mocked ApolloClient instance
    })),
    HttpLink: vi.fn(() => ({
      // Mocked HttpLink instance
    })),
    InMemoryCache: vi.fn(),
  }
})

vi.mock('vue-apollo', () => ({
  default: vi.fn(() => ({
    // Mocked VueApollo instance
  })),
}))

vi.mock('@vue/apollo-composable', () => ({
  provideApolloClient: vi.fn(),
}))

vi.mock('../config', () => ({
  default: {
    GRAPHQL_URI: 'http://test.graphql.uri',
    WALLET_LOGIN_URL: 'http://test.wallet.login',
  },
}))

vi.mock('../store/store', () => ({
  default: {
    state: {
      token: null,
    },
    dispatch: vi.fn(),
    commit: vi.fn(),
  },
}))

describe('apolloProvider', () => {
  let apolloLinkSpy

  beforeEach(() => {
    vi.clearAllMocks()
    apolloLinkSpy = vi.spyOn(ApolloLink, 'from').mockImplementation((links) => {
      // Return a mock link that will call the first link's request function
      return {
        request: links[0].request,
      }
    })
  })

  // Import after spies are set up
  // const { apolloProvider } = require('./apolloProvider')

  it('creates HttpLink with correct URI', () => {
    expect(HttpLink).toHaveBeenCalledWith({ uri: CONFIG.GRAPHQL_URI })
  })

  it('creates ApolloClient', () => {
    expect(ApolloClient).toHaveBeenCalledWith(
      expect.objectContaining({
        link: expect.anything(),
        cache: expect.any(InMemoryCache),
      }),
    )
  })

  it('provides Apollo client', () => {
    expect(provideApolloClient).toHaveBeenCalled()
  })

  it('creates VueApollo provider', () => {
    expect(VueApollo).toHaveBeenCalledWith({
      defaultClient: expect.anything(),
    })
  })

  describe('Auth Link', () => {
    let operation
    let forward

    beforeEach(() => {
      operation = {
        setContext: vi.fn(),
        getContext: vi.fn(() => ({
          response: {
            headers: {
              get: vi.fn(),
            },
          },
        })),
      }
      forward = vi.fn(() => ({
        map: vi.fn((callback) => callback({ errors: null })),
      }))
    })

    it('sets Authorization header with token when available', () => {
      store.state.token = 'test-token'
      apolloLinkSpy.mock.results[0].value.request(operation, forward)
      expect(operation.setContext).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      )
    })

    it('sets empty Authorization header when no token', () => {
      store.state.token = null
      apolloLinkSpy.mock.results[0].value.request(operation, forward)
      expect(operation.setContext).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: '',
          }),
        }),
      )
    })

    it('handles 403.13 error', () => {
      const response = {
        errors: [{ message: '403.13 - Client certificate revoked' }],
      }
      forward.mockReturnValueOnce({
        map: vi.fn((callback) => callback(response)),
      })

      global.window = Object.create(window)
      Object.defineProperty(window, 'location', {
        value: { assign: vi.fn() },
        writable: true,
      })

      apolloLinkSpy.mock.results[0].value.request(operation, forward)

      expect(store.dispatch).toHaveBeenCalledWith('logout', null)
      expect(window.location.assign).toHaveBeenCalledWith(CONFIG.WALLET_LOGIN_URL)
    })

    it('commits new token when present in response', () => {
      operation.getContext.mockReturnValueOnce({
        response: {
          headers: {
            get: vi.fn().mockReturnValueOnce('new-token'),
          },
        },
      })
      apolloLinkSpy.mock.results[0].value.request(operation, forward)
      expect(store.commit).toHaveBeenCalledWith('token', 'new-token')
    })

    it('does not commit token when not present in response', () => {
      apolloLinkSpy.mock.results[0].value.request(operation, forward)
      expect(store.commit).not.toHaveBeenCalled()
    })
  })
})
