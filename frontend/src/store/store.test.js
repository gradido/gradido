import { mutations, actions } from './store'
import Vuex from 'vuex'
import Vue from 'vue'
import i18n from '@/i18n.js'
import { localeChanged } from 'vee-validate'
import jwtDecode from 'jwt-decode'

jest.mock('vuex')
jest.mock('@/i18n.js')
jest.mock('vee-validate', () => {
  return {
    localeChanged: jest.fn(),
  }
})
jest.mock('jwt-decode', () => {
  return jest.fn(() => {
    return { exp: '1234' }
  })
})

i18n.locale = 'blubb'

const {
  language,
  gradidoID,
  token,
  firstName,
  lastName,
  username,
  newsletterState,
  gmsAllowed,
  gmsPublishName,
  gmsPublishLocation,
  publisherId,
  roles,
  hasElopage,
  hideAmountGDD,
  hideAmountGDT,
  email,
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

      it('sets the i18n locale', () => {
        expect(i18n.locale).toBe('de')
      })

      it('calls localChanged of vee-validate', () => {
        expect(localeChanged).toBeCalledWith('de')
      })
    })

    describe('gradidoID', () => {
      it('sets the state of gradidoID', () => {
        const state = { gradidoID: 'old-id' }
        gradidoID(state, 'new-id')
        expect(state.gradidoID).toEqual('new-id')
      })
    })

    describe('token', () => {
      it('sets the state of token', () => {
        const state = { token: null }
        token(state, '1234')
        expect(state.token).toEqual('1234')
      })

      describe('token has a value', () => {
        it('sets the state of tokenTime', () => {
          const state = { token: null, tokenTime: null }
          token(state, 'token')
          expect(jwtDecode).toBeCalledWith('token')
          expect(state.tokenTime).toEqual('1234')
        })
      })

      describe('token has null value', () => {
        it('sets the state of tokenTime to null', () => {
          jest.clearAllMocks()
          const state = { token: null, tokenTime: '123' }
          token(state, null)
          expect(jwtDecode).not.toBeCalled()
          expect(state.tokenTime).toEqual(null)
        })
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

    describe('username', () => {
      it('sets the state of username', () => {
        const state = { username: null }
        username(state, 'peter')
        expect(state.username).toEqual('peter')
      })
    })

    describe('newsletterState', () => {
      it('sets the state of newsletterState', () => {
        const state = { newsletterState: null }
        newsletterState(state, true)
        expect(state.newsletterState).toEqual(true)
      })
    })

    describe('gmsAllowed', () => {
      it('sets the state of gmsAllowed', () => {
        const state = { gmsAllowed: null }
        gmsAllowed(state, true)
        expect(state.gmsAllowed).toEqual(true)
      })
    })

    describe('gmsPublishName', () => {
      it('sets gmsPublishName', () => {
        const state = { gmsPublishName: null }
        gmsPublishName(state, 'GMS_PUBLISH_NAME_INITIALS')
        expect(state.gmsPublishName).toEqual('GMS_PUBLISH_NAME_INITIALS')
      })
    })

    describe('gmsPublishLocation', () => {
      it('sets gmsPublishLocation', () => {
        const state = { gmsPublishLocation: null }
        gmsPublishLocation(state, 'GMS_LOCATION_TYPE_APPROXIMATE')
        expect(state.gmsPublishLocation).toEqual('GMS_LOCATION_TYPE_APPROXIMATE')
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

    describe('roles', () => {
      it('sets the state of roles', () => {
        const state = { roles: [] }
        roles(state, ['admin'])
        expect(state.roles).toEqual(['admin'])
      })
    })

    describe('hasElopage', () => {
      it('sets the state of hasElopage', () => {
        const state = { hasElopage: false }
        hasElopage(state, true)
        expect(state.hasElopage).toBeTruthy()
      })
    })

    describe('hideAmountGDD', () => {
      it('sets the state of hideAmountGDD', () => {
        const state = { hideAmountGDD: false }
        hideAmountGDD(state, false)
        expect(state.hideAmountGDD).toEqual(false)
      })
    })

    describe('hideAmountGDT', () => {
      it('sets the state of hideAmountGDT', () => {
        const state = { hideAmountGDT: true }
        hideAmountGDT(state, true)
        expect(state.hideAmountGDT).toEqual(true)
      })
    })

    describe('email', () => {
      it('sets the state of email', () => {
        const state = { email: '' }
        email(state, 'peter@luatig.de')
        expect(state.email).toEqual('peter@luatig.de')
      })
    })
  })

  describe('actions', () => {
    describe('login', () => {
      const commit = jest.fn()
      const state = {}
      const commitedData = {
        gradidoID: 'my-gradido-id',
        language: 'de',
        alias: 'peter',
        firstName: 'Peter',
        lastName: 'Lustig',
        klickTipp: {
          newsletterState: true,
        },
        gmsAllowed: true,
        gmsPublishName: 'GMS_PUBLISH_NAME_FULL',
        gmsPublishLocation: 'GMS_LOCATION_TYPE_EXACT',
        hasElopage: false,
        publisherId: 1234,
        roles: ['admin'],
        hideAmountGDD: false,
        hideAmountGDT: true,
      }

      it('calls fifteen commits', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenCalledTimes(15)
      })

      it('commits gradidoID', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(1, 'gradidoID', 'my-gradido-id')
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

      it('commits newsletterState', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(6, 'newsletterState', true)
      })

      it('commits gmsAllowed', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(7, 'gmsAllowed', true)
      })

      it('commits gmsPublishName', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(8, 'gmsPublishName', 'GMS_PUBLISH_NAME_FULL')
      })

      it('commits gmsPublishLocation', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(9, 'gmsPublishLocation', 'GMS_LOCATION_TYPE_EXACT')
      })

      it('commits hasElopage', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(10, 'hasElopage', false)
      })

      it('commits publisherId', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(11, 'publisherId', 1234)
      })

      it('commits roles', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(12, 'roles', ['admin'])
      })

      it('commits hideAmountGDD', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(13, 'hideAmountGDD', false)
      })

      it('commits hideAmountGDT', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenNthCalledWith(14, 'hideAmountGDT', true)
      })
    })

    describe('logout', () => {
      const commit = jest.fn()
      const state = {}

      it('calls seventeen commits', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenCalledTimes(17)
      })

      it('commits token', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(1, 'token', null)
      })

      it('commits username', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(2, 'username', '')
      })

      it('commits gradidoID', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(3, 'gradidoID', null)
      })

      it('commits firstName', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(4, 'firstName', '')
      })

      it('commits lastName', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(5, 'lastName', '')
      })

      it('commits newsletterState', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(6, 'newsletterState', null)
      })

      it('commits gmsAllowed', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(7, 'gmsAllowed', null)
      })

      it('commits gmsPublishName', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(8, 'gmsPublishName', null)
      })

      it('commits gmsPublishLocation', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(9, 'gmsPublishLocation', null)
      })

      it('commits hasElopage', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(10, 'hasElopage', false)
      })

      it('commits publisherId', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(11, 'publisherId', null)
      })

      it('commits roles', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(12, 'roles', null)
      })

      it('commits hideAmountGDD', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(13, 'hideAmountGDD', false)
      })

      it('commits hideAmountGDT', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(14, 'hideAmountGDT', true)
      })

      it('commits email', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenNthCalledWith(15, 'email', '')
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
