import { createStore } from 'vuex'
import createPersistedState from 'vuex-persistedstate'
// import { localeChanged } from 'vee-validate'

import jwtDecode from 'jwt-decode'
import i18n from '../i18n'

export const mutations = {
  language: (state, language) => {
    i18n.global.locale.value = language
    // localeChanged(language)
    state.language = language
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
  redirectPath: (state, redirectPath) => {
    state.redirectPath = redirectPath || '/overview'
  },
  setTransactionToHighlightId: (state, id) => {
    state.transactionToHighlightId = id
  },
}

export const actions = {
  login: ({ dispatch, commit }, data) => {
    commit('gradidoID', data.gradidoID)
    commit('language', data.language)
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
    commit('setDarkMode', data.darkMode)
  },
  logout: ({ commit, state }) => {
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
    commit('publisherId', null)
    commit('roles', null)
    commit('hideAmountGDD', false)
    commit('hideAmountGDT', true)
    commit('email', '')
    commit('setDarkMode', false)
    commit('redirectPath', '/overview')
    localStorage.clear()
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
      publisherId: null,
      hideAmountGDD: null,
      hideAmountGDT: null,
      email: '',
      darkMode: false,
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
