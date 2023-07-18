import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import { localeChanged } from 'vee-validate'
import i18n from '@/i18n.js'
import jwtDecode from 'jwt-decode'
Vue.use(Vuex)

export const mutations = {
  language: (state, language) => {
    i18n.locale = language
    localeChanged(language)
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
}

export const actions = {
  login: ({ dispatch, commit }, data) => {
    commit('gradidoID', data.gradidoID)
    commit('language', data.language)
    commit('username', data.alias)
    commit('firstName', data.firstName)
    commit('lastName', data.lastName)
    commit('newsletterState', data.klickTipp.newsletterState)
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
    commit('hasElopage', false)
    commit('publisherId', null)
    commit('roles', null)
    commit('hideAmountGDD', false)
    commit('hideAmountGDT', true)
    commit('email', '')
    commit('setDarkMode', false)
    localStorage.clear()
  },
}

let store

try {
  store = new Vuex.Store({
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
      hasElopage: false,
      publisherId: null,
      hideAmountGDD: null,
      hideAmountGDT: null,
      email: '',
      darkMode: false,
    },
    getters: {},
    // Syncronous mutation of the state
    mutations,
    actions,
  })
} catch (error) {
  // eslint-disable-next-line no-console
  console.log(error)
}

export { store }
