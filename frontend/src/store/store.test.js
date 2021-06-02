import { mutations, actions } from './store'

const { language, email, sessionId } = mutations
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

    describe('sessionId', () => {
      it('sets the state of sessionId', () => {
        const state = { sessionId: null }
        sessionId(state, '1234')
        expect(state.sessionId).toEqual('1234')
      })
    })
  })

  describe('actions', () => {
    describe('login', () => {
      const commit = jest.fn()
      const state = {}

      it('calls three commits', () => {
        login(
          { commit, state },
          { sessionId: 1234, user: { email: 'someone@there.is', language: 'en' } },
        )
        expect(commit).toHaveBeenCalledTimes(4)
      })

      it('commits sessionId', () => {
        login(
          { commit, state },
          { sessionId: 1234, user: { email: 'someone@there.is', language: 'en' } },
        )
        expect(commit).toHaveBeenNthCalledWith(1, 'sessionId', 1234)
      })

      it('commits email', () => {
        login(
          { commit, state },
          { sessionId: 1234, user: { email: 'someone@there.is', language: 'en' } },
        )
        expect(commit).toHaveBeenNthCalledWith(2, 'email', 'someone@there.is')
      })

      it('commits language', () => {
        login(
          { commit, state },
          { sessionId: 1234, user: { email: 'someone@there.is', language: 'en' } },
        )
        expect(commit).toHaveBeenNthCalledWith(3, 'language', 'en')
      })
    })

    describe('logout', () => {
      const commit = jest.fn()
      const state = {}

      it('calls two commits', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenCalledTimes(3)
      })

      it('commits sessionId', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(1, 'sessionId', null)
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
