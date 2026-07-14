import { createStore } from 'vuex'
import createPersistedState from 'vuex-persistedstate'
// import { localeChanged } from 'vee-validate'

import jwtDecode from 'jwt-decode'
import i18n from '../i18n'

// Dedicated localStorage key mirroring state.themeMode. The pre-paint script in
// index.html reads it with a single getItem, so it never has to parse the whole
// persisted-state blob on the blocking boot path. Kept in sync by applyTheme.
export const THEME_MODE_STORAGE_KEY = 'gradido-theme-mode'

export const mutations = {
  language: (state, language) => {
    i18n.global.locale.value = language
    // localeChanged(language)
    state.language = language
  },
  setPreLoginLanguage: (state, preLoginLanguage) => {
    state.preLoginLanguage = preLoginLanguage
  },
  gradidoID: (state, gradidoID) => {
    state.gradidoID = gradidoID
  },
  username: (state, username) => {
    state.username = username
  },
  firstName: (state, firstName) => {
    state.firstName = firstName
  },
  lastName: (state, lastName) => {
    state.lastName = lastName
  },
  token: (state, token) => {
    state.token = token
    if (token) {
      state.tokenTime = jwtDecode(token).exp
    } else {
      state.tokenTime = null
    }
  },
  newsletterState: (state, newsletterState) => {
    state.newsletterState = newsletterState
  },
  gmsAllowed: (state, gmsAllowed) => {
    state.gmsAllowed = gmsAllowed
  },
  humhubAllowed: (state, humhubAllowed) => {
    state.humhubAllowed = humhubAllowed
  },
  gmsPublishName: (state, gmsPublishName) => {
    state.gmsPublishName = gmsPublishName
  },
  humhubPublishName: (state, humhubPublishName) => {
    state.humhubPublishName = humhubPublishName
  },
  gmsPublishLocation: (state, gmsPublishLocation) => {
    state.gmsPublishLocation = gmsPublishLocation
  },
  project: (state, project) => {
    state.project = project
  },
  publisherId: (state, publisherId) => {
    let pubId = parseInt(publisherId)
    if (isNaN(pubId)) pubId = null
    state.publisherId = pubId
  },
  roles(state, roles) {
    state.roles = roles
  },
  hasElopage: (state, hasElopage) => {
    state.hasElopage = hasElopage
  },
  hideAmountGDD: (state, hideAmountGDD) => {
    state.hideAmountGDD = !!hideAmountGDD
  },
  hideAmountGDT: (state, hideAmountGDT) => {
    state.hideAmountGDT = !!hideAmountGDT
  },
  email: (state, email) => {
    state.email = email || ''
  },
  setDarkMode: (state, darkMode) => {
    state.darkMode = !!darkMode
  },
  setThemeMode: (state, themeMode) => {
    state.themeMode = ['system', 'light', 'dark'].includes(themeMode) ? themeMode : 'system'
  },
  userLocation: (state, userLocation) => {
    state.userLocation = userLocation
  },
  redirectPath: (state, redirectPath) => {
    state.redirectPath = redirectPath || '/overview'
  },
  setTransactionToHighlightId: (state, id) => {
    state.transactionToHighlightId = id
  },
}

export const actions = {
  login: ({ commit, state }, data) => {
    commit('gradidoID', data.gradidoID)
    // A language deliberately chosen on the login page wins over the account
    // language, then is cleared once consumed. Browser auto-detection does not set
    // preLoginLanguage, so it never overrides the account language here.
    commit('language', state.preLoginLanguage || data.language)
    commit('setPreLoginLanguage', null)
    commit('username', data.alias)
    commit('firstName', data.firstName)
    commit('lastName', data.lastName)
    commit('newsletterState', data.klickTipp.newsletterState)
    commit('gmsAllowed', data.gmsAllowed)
    commit('humhubAllowed', data.humhubAllowed)
    commit('gmsPublishName', data.gmsPublishName)
    commit('humhubPublishName', data.humhubPublishName)
    commit('gmsPublishLocation', data.gmsPublishLocation)
    commit('hasElopage', data.hasElopage)
    commit('publisherId', data.publisherId)
    commit('roles', data.roles)
    commit('hideAmountGDD', data.hideAmountGDD)
    commit('hideAmountGDT', data.hideAmountGDT)
    commit('userLocation', data.userLocation)
  },
  logout: ({ commit, state, dispatch }) => {
    commit('token', null)
    commit('username', '')
    commit('gradidoID', null)
    commit('firstName', '')
    commit('lastName', '')
    commit('newsletterState', null)
    commit('gmsAllowed', null)
    commit('humhubAllowed', null)
    commit('gmsPublishName', null)
    commit('humhubPublishName', null)
    commit('gmsPublishLocation', null)
    commit('hasElopage', false)
    commit('project', null)
    commit('publisherId', null)
    commit('roles', null)
    commit('hideAmountGDD', false)
    commit('hideAmountGDT', true)
    commit('email', '')
    commit('userLocation', null)
    commit('redirectPath', '/overview')
    const themeMode = state.themeMode
    // Remove only this app's own persisted state (session + token live in this blob).
    // The wallet and admin share one origin, so localStorage.clear() would also wipe
    // the other app's session and the shared dark-mode theme key. Re-commit the theme
    // so the recreated blob keeps the device-local choice for the next session.
    localStorage.removeItem('gradido-frontend')
    commit('setThemeMode', themeMode)
    dispatch('applyTheme')
  },
  // Compute the effective dark mode from the device-local themeMode
  // (system | light | dark) plus the OS preference, then set the darkMode flag
  // that App.vue and the dark stylesheet consume.
  // It also mirrors themeMode into THEME_MODE_STORAGE_KEY. applyTheme runs on boot,
  // on every theme change and on OS changes, so the key that the pre-paint script
  // in index.html reads stays in sync without that script parsing the whole blob.
  applyTheme: ({ state, commit }) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(THEME_MODE_STORAGE_KEY, state.themeMode)
      }
    } catch (e) {
      // storage can be unavailable (private mode); the theme still applies below
    }
    const systemDark =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false
    const effective = state.themeMode === 'dark' || (state.themeMode === 'system' && systemDark)
    commit('setDarkMode', effective)
  },
  changeTransactionToHighlightId({ commit }, id) {
    commit('setTransactionToHighlightId', id)
  },
}

let store

try {
  store = createStore({
    plugins: [
      createPersistedState({
        key: 'gradido-frontend',
        storage: window.localStorage,
      }),
    ],
    state: {
      language: null,
      preLoginLanguage: null,
      gradidoID: null,
      firstName: '',
      lastName: '',
      // username: '',
      token: null,
      tokenTime: null,
      roles: [],
      newsletterState: null,
      gmsAllowed: null,
      humhubAllowed: null,
      gmsPublishName: null,
      humhubPublishName: null,
      gmsPublishLocation: null,
      hasElopage: false,
      project: null,
      publisherId: null,
      hideAmountGDD: null,
      hideAmountGDT: null,
      email: '',
      darkMode: false,
      themeMode: 'system',
      userLocation: null,
      redirectPath: '/overview',
      transactionToHighlightId: '',
    },
    getters: {},
    // Synchronous mutation of the state
    mutations,
    actions,
  })
} catch (error) {
  // eslint-disable-next-line no-console
  console.log(error)
}

export { store }
