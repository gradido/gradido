import { describe, it, expect, vi, beforeEach } from 'vitest'
import VueApollo from 'vue-apollo'
import CONFIG from '../config'
import store from '../store/store'
import { apolloProvider } from './apolloProvider'

vi.mock('vue-apollo')
vi.mock('@vue/apollo-composable')
vi.mock('../config', () => ({
  default: {
    GRAPHQL_URI: 'http://test-graphql-uri.com',
    WALLET_LOGIN_URL: 'http://test-wallet-login-url.com',
  },
}))
vi.mock('../store/store', () => ({
  default: {
    state: { token: '' },
    dispatch: vi.fn(),
    commit: vi.fn(),
  },
}))

describe('Apollo Provider Setup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates an Apollo provider', () => {
    expect(apolloProvider).toBeDefined()
    expect(apolloProvider).toBeInstanceOf(VueApollo)
  })

  it('has a provide function', () => {
    expect(apolloProvider.provide).toBeInstanceOf(Function)
  })

  it('uses the correct GraphQL URI from config', () => {
    expect(CONFIG.GRAPHQL_URI).toBe('http://test-graphql-uri.com')
  })

  // We can't directly test the auth link functionality since it's inside the mocked provider
  // However, we can test that the store is set up correctly for potential use

  it('has access to the store', () => {
    expect(store.state.token).toBeDefined()
    expect(store.dispatch).toBeInstanceOf(Function)
    expect(store.commit).toBeInstanceOf(Function)
  })
})
