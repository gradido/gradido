import store, { mutations, actions } from './store'

const { token, openCreationsPlus, openCreationsMinus, resetOpenCreations } = mutations
const { logout } = actions

const CONFIG = {
  DEBUG_DISABLE_AUTH: true,
}

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
