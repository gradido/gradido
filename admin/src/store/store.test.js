import store, { mutations, actions } from './store'
import CONFIG from '../config'

jest.mock('../config')

const {
  token,
  openCreationsPlus,
  openCreationsMinus,
  resetOpenCreations,
  setOpenCreations,
  moderator,
} = mutations
const { logout } = actions

CONFIG.DEBUG_DISABLE_AUTH = true

describe('Vuex store', () => {
  describe('mutations', () => {
    describe('token', () => {
      it('sets the state of token', () => {
        const state = { token: null }
        token(state, '1234')
        expect(state.token).toEqual('1234')
      })
    })

    describe('openCreationsPlus', () => {
      it('increases the open creations by a given number', () => {
        const state = { openCreations: 0 }
        openCreationsPlus(state, 12)
        expect(state.openCreations).toEqual(12)
      })
    })

    describe('openCreationsMinus', () => {
      it('decreases the open creations by a given number', () => {
        const state = { openCreations: 12 }
        openCreationsMinus(state, 2)
        expect(state.openCreations).toEqual(10)
      })
    })

    describe('resetOpenCreations', () => {
      it('sets the open creations to 0', () => {
        const state = { openCreations: 24 }
        resetOpenCreations(state)
        expect(state.openCreations).toEqual(0)
      })
    })

    describe('moderator', () => {
      it('sets the moderator object in state', () => {
        const state = { moderator: null }
        moderator(state, { id: 1 })
        expect(state.moderator).toEqual({ id: 1 })
      })
    })

    describe('setOpenCreations', () => {
      it('sets the open creations to given value', () => {
        const state = { openCreations: 24 }
        setOpenCreations(state, 12)
        expect(state.openCreations).toEqual(12)
      })
    })
  })

  describe('actions', () => {
    describe('logout', () => {
      const windowStorageMock = jest.fn()
      const commit = jest.fn()
      const state = {}
      beforeEach(() => {
        jest.clearAllMocks()
        window.localStorage.clear = windowStorageMock
      })

      it('deletes the token in store', () => {
        logout({ commit, state })
        expect(commit).toBeCalledWith('token', null)
      })

      it('deletes the moderator in store', () => {
        logout({ commit, state })
        expect(commit).toBeCalledWith('moderator', null)
      })

      it.skip('clears the window local storage', () => {
        expect(windowStorageMock).toBeCalled()
      })
    })
  })

  describe('state', () => {
    describe('authentication enabled', () => {
      it('has no token', () => {
        expect(store.state.token).toBe(null)
      })
    })

    describe('authentication enabled', () => {
      beforeEach(() => {
        CONFIG.DEBUG_DISABLE_AUTH = false
      })

      it.skip('has a token', () => {
        expect(store.state.token).toBe('validToken')
      })
    })
  })
})
