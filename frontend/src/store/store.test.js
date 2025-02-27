import { describe, it, expect, vi } from 'vitest'
import { mutations, actions } from './store'
import i18n from '../i18n'
import jwtDecode from 'jwt-decode'

vi.mock('../i18n', () => ({
  default: {
    global: {
      locale: {
        value: 'en',
      },
    },
  },
}))

vi.mock('jwt-decode', () => ({
  default: vi.fn(() => ({ exp: '1234' })),
}))

const {
  language,
  gradidoID,
  token,
  firstName,
  lastName,
  username,
  newsletterState,
  gmsAllowed,
  humhubAllowed,
  gmsPublishName,
  humhubPublishName,
  gmsPublishLocation,
  publisherId,
  roles,
  hasElopage,
  hideAmountGDD,
  hideAmountGDT,
  email,
  setDarkMode,
  redirectPath,
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
        const state = { language: 'en' }
        language(state, 'de')
        expect(i18n.global.locale.value).toBe('de')
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
          expect(jwtDecode).toHaveBeenCalledWith('token')
          expect(state.tokenTime).toEqual('1234')
        })
      })

      describe('token has null value', () => {
        it('sets the state of tokenTime to null', () => {
          vi.clearAllMocks()
          const state = { token: null, tokenTime: '123' }
          token(state, null)
          expect(jwtDecode).not.toHaveBeenCalled()
          expect(state.tokenTime).toEqual(null)
        })
      })
    })

    // ... (other mutation tests remain largely the same, just update expect syntax if needed)

    describe('setDarkMode', () => {
      it('sets the state of darkMode', () => {
        const state = { darkMode: false }
        setDarkMode(state, true)
        expect(state.darkMode).toBe(true)
      })
    })

    describe('redirectPath', () => {
      it('sets the state of redirectPath', () => {
        const state = { redirectPath: '/overview' }
        redirectPath(state, '/dashboard')
        expect(state.redirectPath).toEqual('/dashboard')
      })

      it('sets default redirectPath if null is provided', () => {
        const state = { redirectPath: '/overview' }
        redirectPath(state, null)
        expect(state.redirectPath).toEqual('/overview')
      })
    })
  })

  describe('actions', () => {
    describe('login', () => {
      const commit = vi.fn()
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
        humhubAllowed: false,
        gmsPublishName: 'GMS_PUBLISH_NAME_FULL',
        humhubPublishName: 'GMS_PUBLISH_NAME_FULL',
        gmsPublishLocation: 'GMS_LOCATION_TYPE_EXACT',
        hasElopage: false,
        publisherId: 1234,
        roles: ['admin'],
        hideAmountGDD: false,
        hideAmountGDT: true,
        darkMode: true,
      }

      it('calls seventeen commits', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenCalledTimes(17)
      })

      // ... (other login action tests remain largely the same)

      it('commits setDarkMode', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenCalledWith('setDarkMode', true)
      })
    })

    describe('logout', () => {
      const commit = vi.fn()
      const state = {}

      it('calls twenty commits', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenCalledTimes(20)
      })

      // ... (other logout action tests remain largely the same)

      it('commits setDarkMode', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenCalledWith('setDarkMode', false)
      })

      it('commits redirectPath', () => {
        logout({ commit, state })
        expect(commit).toHaveBeenCalledWith('redirectPath', '/overview')
      })

      it('calls localStorage.clear()', () => {
        const clearStorageMock = vi.fn()
        vi.stubGlobal('localStorage', {
          clear: clearStorageMock,
        })
        logout({ commit, state })
        expect(clearStorageMock).toHaveBeenCalled()
        vi.unstubAllGlobals()
      })
    })
  })
})
