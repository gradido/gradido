import { mutations } from './store'

const { token } = mutations

describe('Vuex store', () => {
  describe('mutations', () => {
    describe('token', () => {
      it('sets the state of token', () => {
        const state = { token: null }
        token(state, '1234')
        expect(state.token).toEqual('1234')
      })
    })
  })
})
