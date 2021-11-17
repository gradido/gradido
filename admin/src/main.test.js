import { ApolloClient, ApolloLink, InMemoryCache, HttpLink } from 'apollo-boost'
import './main'
import CONFIG from './config'

import Vue from 'vue'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import moment from 'vue-moment'

jest.mock('vue')
jest.mock('vuex')
jest.mock('vue-i18n')
jest.mock('moment')

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

  it('calls Vue', () => {
    expect(Vue).toBeCalled()
  })

  it('calls VueI18n', () => {
    expect(VueI18n).toBeCalled()
  })

  it('calls BootstrapVue', () => {
    expect(BootstrapVue).toBeCalled()
  })

  it('calls IconsPlugin', () => {
    expect(IconsPlugin).toBeCalled()
  })

  it('calls Moment', () => {
    expect(moment).toBeCalled()
  })

  it.skip('creates a store', () => {
    expect(storeMock).toBeCalled()
  })
})
