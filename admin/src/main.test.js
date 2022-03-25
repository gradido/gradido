import { ApolloClient, ApolloLink, InMemoryCache, HttpLink } from 'apollo-boost'
import './main'
import CONFIG from './config'

import Vue from 'vue'
import VueApollo from 'vue-apollo'
import i18n from './i18n'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import store from './store/store'
import router from './router/router'

jest.mock('vue')
jest.mock('vue-apollo')
jest.mock('vuex')
jest.mock('vue-i18n')
jest.mock('./store/store', () => {
  return {
    state: {
      moderator: {
        language: 'es',
      },
    },
  }
})
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

  it('sets the locale from store', () => {
    expect(i18n.locale).toBe('es')
  })
})
