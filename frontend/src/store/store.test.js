import { mutations, actions } from './store'
import Vuex from 'vuex'
import Vue from 'vue'

jest.mock('vuex')

const {
  language,
  email,
  token,
  username,
  firstName,
  lastName,
  description,
  coinanimation,
  newsletterState,
  publisherId,
  isAdmin,
  community,
  hasElopage,
} = mutations
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

    describe('coinanimation', () => {
      it('sets the state of coinanimation', () => {
        const state = { coinanimation: true }
        coinanimation(state, false)
        expect(state.coinanimation).toEqual(false)
      })
    })

    describe('newsletterState', () => {
      it('sets the state of newsletterState', () => {
        const state = { newsletterState: null }
        newsletterState(state, true)
        expect(state.newsletterState).toEqual(true)
      })
    })

    describe('publisherId', () => {
      it('sets the state of publisherId', () => {
        const state = {}
        publisherId(state, 42)
        expect(state.publisherId).toEqual(42)
      })

      it('sets publisherId to null with NaN', () => {
        const state = {}
        publisherId(state, 'abc')
        expect(state.publisherId).toEqual(null)
      })
    })

    describe('isAdmin', () => {
      it('sets the state of isAdmin', () => {
        const state = { isAdmin: null }
        isAdmin(state, true)
        expect(state.isAdmin).toEqual(true)
      })
    })

    describe('community', () => {
      it('sets the state of community', () => {
        const state = {}
        community(state, {
          name: 'test12',
          description: 'test community 12',
          url: 'http://test12.test12/',
          registerUrl: 'http://test12.test12/vue/register',
        })
        expect(state.community).toEqual({
          name: 'test12',
          description: 'test community 12',
          url: 'http://test12.test12/',
          registerUrl: 'http://test12.test12/vue/register',
        })
      })
    })

    describe('hasElopage', () => {
      it('sets the state of hasElopage', () => {
        const state = { hasElopage: false }
        hasElopage(state, true)
        expect(state.hasElopage).toBeTruthy()
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
        coinanimation: false,
        klickTipp: {
          newsletterState: true,
        },
        hasElopage: false,
        publisherId: 1234,
        isAdmin: true,
      }

      it('calls eleven commits', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenCalledTimes(11)
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

      it('commits coinanimation', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(7, 'coinanimation', false)
      })

      it('commits newsletterState', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(8, 'newsletterState', true)
      })

      it('commits hasElopage', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(9, 'hasElopage', false)
      })

      it('commits publisherId', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(10, 'publisherId', 1234)
      })

      it('commits isAdmin', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(11, 'isAdmin', true)
      })
    })

    describe('logout', () => {
      const commit = jest.fn()
      const state = {}

      it('calls eleven commits', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenCalledTimes(11)
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

      it('commits coinanimation', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(7, 'coinanimation', true)
      })

      it('commits newsletterState', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(8, 'newsletterState', null)
      })

      it('commits hasElopage', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(9, 'hasElopage', false)
      })

      it('commits publisherId', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(10, 'publisherId', null)
      })

      it('commits isAdmin', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(11, 'isAdmin', false)
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

  describe('creation of store fails', () => {
    const consoleErrorMock = jest.fn()
    const warnHandler = Vue.config.warnHandler
    beforeEach(() => {
      Vue.config.warnHandler = (w) => {}
      // eslint-disable-next-line no-console
      console.error = consoleErrorMock
      Vuex.Store = () => {
        throw new Error('no-cookies-allowed')
      }
    })

    afterEach(() => {
      Vue.config.warnHandler = warnHandler
    })

    it.skip('logs an error message', () => {
      expect(consoleErrorMock).toBeCalledWith('no-cookies-allowed')
    })
  })
})
