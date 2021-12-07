import { ApolloClient, ApolloLink, InMemoryCache, HttpLink } from 'apollo-boost'
import './main'
import CONFIG from './config'

import Vue from 'vue'
import VueApollo from 'vue-apollo'
import i18n from './i18n'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import moment from 'vue-moment'
import store from './store/store'
import router from './router/router'

jest.mock('vue')
jest.mock('vue-apollo')
jest.mock('vuex')
jest.mock('vue-i18n')
jest.mock('vue-moment')
jest.mock('./store/store')
jest.mock('./i18n')
jest.mock('./router/router')

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

jest.mock('bootstrap-vue', () => {
  return {
    __esModule: true,
    BootstrapVue: jest.fn(),
    IconsPlugin: jest.fn(() => {
      return { concat: jest.fn() }
    }),
  }
})

describe('main', () => {
  it('calls the HttpLink', () => {
    expect(HttpLink).toBeCalledWith({ uri: CONFIG.GRAPHQL_URI })
  })

  it('calls the ApolloLink', () => {
    expect(ApolloLink).toBeCalled()
  })

  it('calls the ApolloClient', () => {
    expect(ApolloClient).toBeCalled()
  })

  it('calls the InMemoryCache', () => {
    expect(InMemoryCache).toBeCalled()
  })

  it('calls the VueApollo', () => {
    expect(VueApollo).toBeCalled()
  })

  it('calls Vue', () => {
    expect(Vue).toBeCalled()
  })

  it('calls i18n', () => {
    expect(Vue).toBeCalledWith(
      expect.objectContaining({
        i18n,
      }),
    )
  })

  it('calls BootstrapVue', () => {
    expect(Vue.use).toBeCalledWith(BootstrapVue)
  })

  it('calls IconsPlugin', () => {
    expect(Vue.use).toBeCalledWith(IconsPlugin)
  })

  it('calls Moment', () => {
    expect(Vue.use).toBeCalledWith(moment)
  })

  it('creates a store', () => {
    expect(Vue).toBeCalledWith(
      expect.objectContaining({
        store,
      }),
    )
  })

  it('creates a router', () => {
    expect(Vue).toBeCalledWith(
      expect.objectContaining({
        router,
      }),
    )
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
