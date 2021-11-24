import { mutations } from './store'

const { token, openCreationsPlus, openCreationsMinus, resetOpenCreations } = mutations

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
})
