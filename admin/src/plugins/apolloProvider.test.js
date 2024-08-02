import { ApolloClient, ApolloLink, HttpLink } from 'apollo-boost'
import './apolloProvider'
import CONFIG from '../config'
import { vi, describe, beforeEach, it, expect } from 'vitest'

import VueApollo from 'vue-apollo'
import store from '../store/store'
import i18n from '../i18n'

vi.mock('vue-apollo')
vi.mock('../store/store')
vi.mock('../i18n')

vi.mock('apollo-boost', () => {
  return {
    __esModule: true,
    ApolloClient: vi.fn(),
    ApolloLink: vi.fn(() => {
      return { concat: vi.fn() }
    }),
    InMemoryCache: vi.fn(),
    HttpLink: vi.fn(),
  }
})

describe('apolloProvider', () => {
  it('calls the HttpLink', () => {
    expect(HttpLink).toBeCalledWith({ uri: CONFIG.GRAPHQL_URI })
  })

  it('calls the ApolloLink', () => {
    expect(ApolloLink).toBeCalled()
  })

  it('calls the ApolloClient', () => {
    expect(ApolloClient).toBeCalled()
  })

  it('calls the VueApollo', () => {
    expect(VueApollo).toBeCalled()
  })

  describe('ApolloLink', () => {
    // mock store
    const storeDispatchMock = vi.fn()
    const storeCommitMock = vi.fn()
    store.state = {
      token: 'some-token',
    }
    store.dispatch = storeDispatchMock
    store.commit = storeCommitMock

    // mock i18n.t
    i18n.t = vi.fn((t) => t)

    // mock apllo response
    const responseMock = {
      errors: [{ message: '403.13 - Client certificate revoked' }],
    }

    const windowLocationMock = vi.fn()
    delete window.location
    window.location = {
      assign: windowLocationMock,
    }
    // mock context
    const setContextMock = vi.fn()
    const getContextMock = vi.fn(() => {
      return {
        response: {
          headers: {
            get: vi.fn(() => 'another-token'),
          },
        },
      }
    })

    // mock apollo link function params
    const operationMock = {
      setContext: setContextMock,
      getContext: getContextMock,
    }

    const forwardMock = vi.fn(() => {
      return [responseMock]
    })

    // get apollo link callback
    const middleware = ApolloLink.mock.calls[0][0]

    describe('with token in store', () => {
      it('sets authorization header with token', () => {
        // run the apollo link callback with mocked params
        middleware(operationMock, forwardMock)
        expect(setContextMock).toBeCalledWith({
          headers: {
            Authorization: 'Bearer some-token',
            clientTimezoneOffset: expect.any(Number),
          },
        })
      })
    })

    describe('without token in store', () => {
      beforeEach(() => {
        store.state.token = null
      })

      it('sets authorization header empty', () => {
        middleware(operationMock, forwardMock)
        expect(setContextMock).toBeCalledWith({
          headers: {
            Authorization: '',
            clientTimezoneOffset: expect.any(Number),
          },
        })
      })
    })

    describe('apollo response is 403.13', () => {
      beforeEach(() => {
        // run the apollo link callback with mocked params
        middleware(operationMock, forwardMock)
      })

      it('dispatches logout', () => {
        expect(storeDispatchMock).toBeCalledWith('logout', null)
      })

      it('redirects to logout', () => {
        expect(windowLocationMock).toBeCalledWith('http://localhost/login')
      })
    })

    describe('apollo response is with new token', () => {
      beforeEach(() => {
        delete responseMock.errors
        middleware(operationMock, forwardMock)
      })

      it('commits new token to store', () => {
        expect(storeCommitMock).toBeCalledWith('token', 'another-token')
      })
    })

    describe('apollo response is without new token', () => {
      beforeEach(() => {
        vi.clearAllMocks()
        getContextMock.mockReturnValue({
          response: {
            headers: {
              get: vi.fn(() => null),
            },
          },
        })
        middleware(operationMock, forwardMock)
      })

      it('does not commit token to store', () => {
        expect(storeCommitMock).not.toBeCalled()
      })
    })
  })
})
