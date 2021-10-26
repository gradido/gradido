import { ApolloClient, ApolloLink, InMemoryCache, HttpLink } from 'apollo-boost'
import './main'
import CONFIG from './config'

import Vue from 'vue'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'

jest.mock('vue')
jest.mock('vuex')
jest.mock('vue-i18n')

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

  it.skip('creates a store', () => {
    expect(storeMock).toBeCalled()
  })
})
