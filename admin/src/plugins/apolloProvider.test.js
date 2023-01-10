import { ApolloClient, ApolloLink, HttpLink } from 'apollo-boost'
import './apolloProvider'
import CONFIG from '../config'

import VueApollo from 'vue-apollo'
import store from '../store/store'
import i18n from '../i18n'

jest.mock('vue-apollo')
jest.mock('../store/store')
jest.mock('../i18n')

jest.mock('apollo-boost', () => {
  return {
    __esModule: true,
    ApolloClient: jest.fn(),
    ApolloLink: jest.fn(() => {
      return { concat: jest.fn() }
    }),
    InMemoryCache: jest.fn(),
    HttpLink: jest.fn(),
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
    const storeDispatchMock = jest.fn()
    const storeCommitMock = jest.fn()
    store.state = {
      token: 'some-token',
    }
    store.dispatch = storeDispatchMock
    store.commit = storeCommitMock

    // mock i18n.t
    i18n.t = jest.fn((t) => t)

    // mock apllo response
    const responseMock = {
      errors: [{ message: '403.13 - Client certificate revoked' }],
    }

    const windowLocationMock = jest.fn()
    delete window.location
    window.location = {
      assign: windowLocationMock,
    }
    // mock context
    const setContextMock = jest.fn()
    const getContextMock = jest.fn(() => {
      return {
        response: {
          headers: {
            get: jest.fn(() => 'another-token'),
          },
        },
      }
    })

    // mock apollo link function params
    const operationMock = {
      setContext: setContextMock,
      getContext: getContextMock,
    }

    const forwardMock = jest.fn(() => {
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
        jest.clearAllMocks()
        getContextMock.mockReturnValue({
          response: {
            headers: {
              get: jest.fn(() => null),
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
