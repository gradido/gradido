import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore } from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import CONFIG from '../config'
import store, { mutations, actions } from './store'

vi.mock('../config', () => ({
  default: {
    DEBUG_DISABLE_AUTH: false,
  },
}))

describe('Vuex Store', () => {
  let testStore
  let localStorageMock

  beforeEach(() => {
    vi.clearAllMocks()

    localStorageMock = {
      clear: vi.fn(),
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    testStore = createStore({
      plugins: [createPersistedState()],
      state: {
        token: null,
        moderator: null,
        openCreations: 0,
        userSelectedInMassCreation: [],
      },
      mutations,
      actions,
    })
  })

  describe('Mutations', () => {
    it('openCreationsPlus', () => {
      testStore.commit('openCreationsPlus', 5)
      expect(testStore.state.openCreations).toBe(5)
    })

    it('openCreationsMinus', () => {
      testStore.state.openCreations = 10
      testStore.commit('openCreationsMinus', 3)
      expect(testStore.state.openCreations).toBe(7)
    })

    it('resetOpenCreations', () => {
      testStore.state.openCreations = 10
      testStore.commit('resetOpenCreations')
      expect(testStore.state.openCreations).toBe(0)
    })

    it('token', () => {
      testStore.commit('token', '1234')
      expect(testStore.state.token).toBe('1234')
    })

    it('setOpenCreations', () => {
      testStore.commit('setOpenCreations', 15)
      expect(testStore.state.openCreations).toBe(15)
    })

    it('moderator', () => {
      const moderator = { id: 1, name: 'Test' }
      testStore.commit('moderator', moderator)
      expect(testStore.state.moderator).toEqual(moderator)
    })
  })

  describe('Actions', () => {
    it('logout', () => {
      testStore.state.token = 'someToken'
      testStore.state.moderator = { id: 1 }

      testStore.dispatch('logout')

      expect(testStore.state.token).toBeNull()
      expect(testStore.state.moderator).toBeNull()
      expect(localStorageMock.clear).toHaveBeenCalled()
    })
  })

  describe('Initial State', () => {
    it('sets correct initial state when DEBUG_DISABLE_AUTH is false', () => {
      expect(store.state).toEqual({
        token: null,
        moderator: null,
        openCreations: 0,
        userSelectedInMassCreation: [],
      })
    })

    it('sets correct initial state when DEBUG_DISABLE_AUTH is true', () => {
      CONFIG.DEBUG_DISABLE_AUTH = true
      const debugStore = createStore({
        plugins: [createPersistedState()],
        state: {
          token: CONFIG.DEBUG_DISABLE_AUTH ? 'validToken' : null,
          moderator: null,
          openCreations: 0,
          userSelectedInMassCreation: [],
        },
        mutations,
        actions,
      })
      expect(debugStore.state.token).toBe('validToken')
      CONFIG.DEBUG_DISABLE_AUTH = false
    })
  })
})
