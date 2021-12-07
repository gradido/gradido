import { ApolloClient, ApolloLink, InMemoryCache, HttpLink } from 'apollo-boost'
import './apolloProvider'
import CONFIG from '../config'

import VueApollo from 'vue-apollo'
import { store } from '../store/store.js'
import router from '../routes/router'
import i18n from '../i18n'

jest.mock('vue-apollo')
jest.mock('../store/store')
jest.mock('../routes/router')
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
    store.state = {
      token: 'some-token',
    }
    store.dispatch = storeDispatchMock

    // mock i18n.t
    i18n.t = jest.fn((t) => t)

    // mock apllo response
    const responseMock = {
      errors: [{ message: '403.13 - Client certificate revoked' }],
    }

    // mock router
    const routerPushMock = jest.fn()
    router.push = routerPushMock
    router.currentRoute = {
      path: '/overview',
    }

    // mock context
    const setContextMock = jest.fn()
    const getContextMock = jest.fn(() => {
      return {
        response: {
          headers: {
            get: jest.fn(),
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

    beforeEach(() => {
      jest.clearAllMocks()
      // run the callback with mocked params
      middleware(operationMock, forwardMock)
    })

    it('sets authorization header', () => {
      expect(setContextMock).toBeCalledWith({
        headers: {
          Authorization: 'Bearer some-token',
        },
      })
    })

    describe('apollo response is 403.13', () => {
      it.skip('dispatches logout', () => {
        expect(storeDispatchMock).toBeCalledWith('logout', null)
      })

      it.skip('redirects to logout', () => {
        expect(routerPushMock).toBeCalledWith('/logout')
      })
    })
  })
})
