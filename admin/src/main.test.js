import { ApolloClient, ApolloLink, InMemoryCache, HttpLink } from 'apollo-boost'
import './main'
import CONFIG from './config'

import Vue from 'vue'
import VueApollo from 'vue-apollo'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import moment from 'vue-moment'

jest.mock('vue')
jest.mock('vue-apollo')
jest.mock('vuex')
jest.mock('vue-i18n')
jest.mock('vue-moment')

const storeMock = jest.fn()
Vuex.Store = storeMock

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

  it('calls VueI18n', () => {
    expect(VueI18n).toBeCalled()
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

  it.skip('creates a store', () => {
    expect(storeMock).toBeCalled()
  })
})
