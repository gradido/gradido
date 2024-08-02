import { ApolloClient, ApolloLink, InMemoryCache, HttpLink } from 'apollo-boost'
import './main'
import CONFIG from './config'
import { vi, describe, it, expect } from 'vitest'

import Vue from 'vue'
import VueApollo from 'vue-apollo'
import i18n from './i18n'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import store from './store/store'
import router from './router/router'

vi.mock('vue')
vi.mock('vue-apollo')
vi.mock('vuex')
vi.mock('vue-i18n')
vi.mock('./store/store', () => {
  return {
    state: {
      moderator: {
        language: 'es',
      },
    },
  }
})
vi.mock('./i18n')
vi.mock('./router/router')

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

vi.mock('bootstrap-vue', () => {
  return {
    __esModule: true,
    BootstrapVue: vi.fn(),
    IconsPlugin: vi.fn(() => {
      return { concat: vi.fn() }
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
