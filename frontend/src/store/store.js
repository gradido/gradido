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
  email: (state, email) => {
    state.email = email
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
  communityTabIndex: (state, communityTabIndex) => {
    state.communityTabIndex = communityTabIndex
  },
}

export const actions = {
  login: ({ dispatch, commit }, data) => {
    commit('email', data.email)
    commit('language', data.language)
    commit('firstName', data.firstName)
    commit('lastName', data.lastName)
    commit('newsletterState', data.klickTipp.newsletterState)
    commit('hasElopage', data.hasElopage)
    commit('publisherId', data.publisherId)
    commit('isAdmin', data.isAdmin)
    commit('hideAmountGDD', data.hideAmountGDD)
    commit('hideAmountGDT', data.hideAmountGDT)
    commit('communityTabIndex', data.communityTabIndex)
  },
  logout: ({ commit, state }) => {
    commit('token', null)
    commit('email', null)
    commit('firstName', '')
    commit('lastName', '')
    commit('newsletterState', null)
    commit('hasElopage', false)
    commit('publisherId', null)
    commit('isAdmin', false)
    commit('hideAmountGDD', false)
    commit('hideAmountGDT', true)
    commit('communityTabIndex', 0)
    localStorage.clear()
  },
}

let store

try {
  store = new Vuex.Store({
    plugins: [
      createPersistedState({
        storage: window.localStorage,
      }),
    ],
    state: {
      email: '',
      language: null,
      firstName: '',
      lastName: '',
      token: null,
      tokenTime: null,
      isAdmin: false,
      newsletterState: null,
      hasElopage: false,
      publisherId: null,
      hideAmountGDD: null,
      hideAmountGDT: null,
      communityTabIndex: 0,
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
