import { describe, it, expect, vi } from 'vitest'
import { mutations, actions, THEME_MODE_STORAGE_KEY } from './store'
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

// `vi.hoisted`, because `vi.mock` is lifted above every import and every `const` in
// this file. The arrow below would defer the access far enough to work, which is
// exactly what makes it a trap: shorten it to `clearApolloCache: clearApolloCacheMock`
// and it breaks with a ReferenceError that points nowhere near the cause.
const { clearApolloCacheMock } = vi.hoisted(() => ({ clearApolloCacheMock: vi.fn() }))
vi.mock('../plugins/apolloCache', () => ({
  clearApolloCache: clearApolloCacheMock,
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
  setThemeMode,
  redirectPath,
} = mutations

const { login, logout, applyTheme } = actions

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

    describe('setThemeMode', () => {
      it('sets a valid theme mode', () => {
        const state = { themeMode: 'system' }
        setThemeMode(state, 'dark')
        expect(state.themeMode).toBe('dark')
      })

      it('falls back to system for an invalid value', () => {
        const state = { themeMode: 'dark' }
        setThemeMode(state, 'nonsense')
        expect(state.themeMode).toBe('system')
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

      it('calls nineteen commits', () => {
        login({ commit, state }, commitedData)
        expect(commit).toHaveBeenCalledTimes(19)
      })

      // Not read from the payload -- the login mutation cannot carry a picture -- but
      // cleared, because the persisted store routinely still holds the previous member's
      // avatar when the next one logs in on the same browser.
      it("forgets the previous member's picture", () => {
        const localCommit = vi.fn()
        login({ commit: localCommit, state: {} }, commitedData)
        expect(localCommit).toHaveBeenCalledWith('avatar', null)
      })

      it('uses the account language when there is no deliberate pre-login choice', () => {
        const localCommit = vi.fn()
        login({ commit: localCommit, state: {} }, commitedData)
        expect(localCommit).toHaveBeenCalledWith('language', 'de')
      })

      it('prefers a deliberate pre-login language over the account language and clears it', () => {
        const localCommit = vi.fn()
        login({ commit: localCommit, state: { preLoginLanguage: 'it' } }, commitedData)
        expect(localCommit).toHaveBeenCalledWith('language', 'it')
        expect(localCommit).toHaveBeenCalledWith('setPreLoginLanguage', null)
      })

      // ... (other login action tests remain largely the same)

      it('does not set the theme from server data (theme is device-local)', () => {
        login({ commit, state }, commitedData)
        expect(commit).not.toHaveBeenCalledWith('setDarkMode', expect.anything())
        expect(commit).not.toHaveBeenCalledWith('setThemeMode', expect.anything())
      })
    })

    describe('logout', () => {
      const commit = vi.fn()
      const dispatch = vi.fn()
      const state = { themeMode: 'dark' }

      it('calls twenty-two commits', () => {
        logout({ commit, state, dispatch })
        expect(commit).toHaveBeenCalledTimes(22)
      })

      // ... (other logout action tests remain largely the same)

      it('keeps the device-local theme across logout', () => {
        logout({ commit, state, dispatch })
        expect(commit).toHaveBeenCalledWith('setThemeMode', 'dark')
        expect(dispatch).toHaveBeenCalledWith('applyTheme')
        expect(commit).not.toHaveBeenCalledWith('setDarkMode', false)
      })

      it('commits redirectPath', () => {
        logout({ commit, state, dispatch })
        expect(commit).toHaveBeenCalledWith('redirectPath', '/overview')
      })

      // Nothing here reloads the page, so the previous member's answers stay in the
      // Apollo cache unless they are thrown out by hand. `aliasStatus` has no variables
      // and therefore one single key: the next member to sign in was shown their
      // predecessor's remaining name changes, and the window at first login stayed away
      // because the cached answer said the question had been settled.
      it('throws out the previous member´s cached answers', async () => {
        clearApolloCacheMock.mockClear()
        await logout({ commit, state, dispatch })
        expect(clearApolloCacheMock).toHaveBeenCalled()
      })

      it('removes only its own storage blob', () => {
        const removeItemMock = vi.fn()
        const clearMock = vi.fn()
        vi.stubGlobal('localStorage', {
          removeItem: removeItemMock,
          clear: clearMock,
        })
        logout({ commit, state, dispatch })
        expect(removeItemMock).toHaveBeenCalledWith('gradido-frontend')
        expect(clearMock).not.toHaveBeenCalled()
        vi.unstubAllGlobals()
      })
    })

    describe('applyTheme', () => {
      it('sets darkMode true when themeMode is dark', () => {
        const commit = vi.fn()
        applyTheme({ state: { themeMode: 'dark' }, commit })
        expect(commit).toHaveBeenCalledWith('setDarkMode', true)
      })

      it('sets darkMode false when themeMode is light', () => {
        const commit = vi.fn()
        applyTheme({ state: { themeMode: 'light' }, commit })
        expect(commit).toHaveBeenCalledWith('setDarkMode', false)
      })

      it('follows the OS preference when themeMode is system', () => {
        const commit = vi.fn()
        const original = window.matchMedia
        window.matchMedia = vi.fn(() => ({ matches: true }))
        applyTheme({ state: { themeMode: 'system' }, commit })
        expect(commit).toHaveBeenCalledWith('setDarkMode', true)
        window.matchMedia = original
      })

      it('mirrors the theme mode into the dedicated storage key', () => {
        const commit = vi.fn()
        const setItem = vi.fn()
        vi.stubGlobal('localStorage', { setItem })
        applyTheme({ state: { themeMode: 'dark' }, commit })
        expect(setItem).toHaveBeenCalledWith(THEME_MODE_STORAGE_KEY, 'dark')
        vi.unstubAllGlobals()
      })
    })
  })
})
