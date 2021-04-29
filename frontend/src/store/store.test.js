import { mutations, actions } from './store'

const { language, email, session_id } = mutations
const { login, logout } = actions

describe('Vuex store', () => {
  describe('mutations', () => {
    describe('language', () => {
      it('sets the state of language', () => {
        const state = { language: 'en' }
        language(state, 'de')
        expect(state.language).toEqual('de')
      })
    })

    describe('email', () => {
      it('sets the state of email', () => {
        const state = { email: 'nobody@knows.tv' }
        email(state, 'someone@there.is')
        expect(state.email).toEqual('someone@there.is')
      })
    })

    describe('session_id', () => {
      it('sets the state of session_id', () => {
        const state = { session_id: null }
        session_id(state, '1234')
        expect(state.session_id).toEqual('1234')
      })
    })
  })

  describe('actions', () => {
    describe('login', () => {
      const commit = jest.fn()
      const state = {}

      it('calls two commits', () => {
        login({ commit, state }, { session_id: 1234, email: 'someone@there.is' })
        expect(commit).toHaveBeenCalledTimes(2)
      })

      it('commits session_id', () => {
        login({ commit, state }, { session_id: 1234, email: 'someone@there.is' })
        expect(commit).toHaveBeenNthCalledWith(1, 'session_id', 1234)
      })

      it('commits email', () => {
        login({ commit, state }, { session_id: 1234, email: 'someone@there.is' })
        expect(commit).toHaveBeenNthCalledWith(2, 'email', 'someone@there.is')
      })
    })

    describe('logout', () => {
      const commit = jest.fn()
      const state = {}

      it('calls two commits', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenCalledTimes(2)
      })

      it('commits session_id', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(1, 'session_id', null)
      })

      it('commits email', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(2, 'email', null)
      })

      // how can I get this working?
      it.skip('calls sessionStorage.clear()', () => {
        logout({ commit, state })
        const spy = jest.spyOn(sessionStorage, 'clear')
        expect(spy).toHaveBeenCalledTimes(1)
      })
    })
  })
})
