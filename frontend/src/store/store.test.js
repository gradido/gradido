import { mutations, actions } from './store'

const { language, email, token, username, firstName, lastName, description } = mutations
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

    describe('token', () => {
      it('sets the state of token', () => {
        const state = { token: null }
        token(state, '1234')
        expect(state.token).toEqual('1234')
      })
    })

    describe('username', () => {
      it('sets the state of username', () => {
        const state = { username: null }
        username(state, 'user')
        expect(state.username).toEqual('user')
      })
    })

    describe('firstName', () => {
      it('sets the state of firstName', () => {
        const state = { firstName: null }
        firstName(state, 'Peter')
        expect(state.firstName).toEqual('Peter')
      })
    })

    describe('lastName', () => {
      it('sets the state of lastName', () => {
        const state = { lastName: null }
        lastName(state, 'Lustig')
        expect(state.lastName).toEqual('Lustig')
      })
    })

    describe('description', () => {
      it('sets the state of description', () => {
        const state = { description: null }
        description(state, 'Nickelbrille')
        expect(state.description).toEqual('Nickelbrille')
      })
    })
  })

  describe('actions', () => {
    describe('login', () => {
      const commit = jest.fn()
      const state = {}
      const commitedData = {
        email: 'user@example.org',
        language: 'de',
        username: 'peter',
        firstName: 'Peter',
        lastName: 'Lustig',
        description: 'Nickelbrille',
      }

      it('calls seven commits', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenCalledTimes(6)
      })

      it('commits email', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(1, 'email', 'user@example.org')
      })

      it('commits language', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(2, 'language', 'de')
      })

      it('commits username', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(3, 'username', 'peter')
      })

      it('commits firstName', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(4, 'firstName', 'Peter')
      })

      it('commits lastName', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(5, 'lastName', 'Lustig')
      })

      it('commits description', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(6, 'description', 'Nickelbrille')
      })
    })

    describe('logout', () => {
      const commit = jest.fn()
      const state = {}

      it('calls six commits', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenCalledTimes(6)
      })

      it('commits token', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(1, 'token', null)
      })

      it('commits email', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(2, 'email', null)
      })

      it('commits username', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(3, 'username', '')
      })

      it('commits firstName', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(4, 'firstName', '')
      })

      it('commits lastName', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(5, 'lastName', '')
      })

      it('commits description', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(6, 'description', '')
      })

      // how to get this working?
      it.skip('calls localStorage.clear()', () => {
        const clearStorageMock = jest.fn()
        global.sessionStorage = jest.fn(() => {
          return {
            clear: clearStorageMock,
          }
        })
        logout({ commit, state })
        expect(clearStorageMock).toBeCalled()
      })
    })
  })
})
