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
  // username: (state, username) => {
  //   state.username = username
  // },
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
  isAdmin: (state, isAdmin) => {
    state.isAdmin = !!isAdmin
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
}

export const actions = {
  login: ({ dispatch, commit }, data) => {
    commit('gradidoID', data.gradidoID)
    commit('language', data.language)
    // commit('username', data.username)
    commit('firstName', data.firstName)
    commit('lastName', data.lastName)
    commit('newsletterState', data.klickTipp.newsletterState)
    commit('hasElopage', data.hasElopage)
    commit('publisherId', data.publisherId)
    commit('isAdmin', data.isAdmin)
    commit('hideAmountGDD', data.hideAmountGDD)
    commit('hideAmountGDT', data.hideAmountGDT)
  },
  logout: ({ commit, state }) => {
    commit('token', null)
    // commit('username', '')
    commit('gradidoID', null)
    commit('firstName', '')
    commit('lastName', '')
    commit('newsletterState', null)
    commit('hasElopage', false)
    commit('publisherId', null)
    commit('isAdmin', false)
    commit('hideAmountGDD', false)
    commit('hideAmountGDT', true)
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
      isAdmin: false,
      newsletterState: null,
      hasElopage: false,
      publisherId: null,
      hideAmountGDD: null,
      hideAmountGDT: null,
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
