import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'

Vue.use(Vuex)

export const mutations = {
  language: (state, language) => {
    state.language = language
  },
  email: (state, email) => {
    state.email = email
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
  description: (state, description) => {
    state.description = description
  },
  token: (state, token) => {
    state.token = token
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
  community: (state, community) => {
    state.community = community
  },
  coinanimation: (state, coinanimation) => {
    state.coinanimation = coinanimation
  },
  hasElopage: (state, hasElopage) => {
    state.hasElopage = hasElopage
  },
}

export const actions = {
  login: ({ dispatch, commit }, data) => {
    commit('email', data.email)
    commit('language', data.language)
    commit('username', data.username)
    commit('firstName', data.firstName)
    commit('lastName', data.lastName)
    commit('description', data.description)
    commit('coinanimation', data.coinanimation)
    commit('newsletterState', data.klickTipp.newsletterState)
    commit('hasElopage', data.hasElopage)
    commit('publisherId', data.publisherId)
    commit('isAdmin', data.isAdmin)
  },
  logout: ({ commit, state }) => {
    commit('token', null)
    commit('email', null)
    commit('username', '')
    commit('firstName', '')
    commit('lastName', '')
    commit('description', '')
    commit('coinanimation', true)
    commit('newsletterState', null)
    commit('hasElopage', false)
    commit('publisherId', null)
    commit('isAdmin', false)
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
      username: '',
      description: '',
      token: null,
      isAdmin: false,
      coinanimation: true,
      newsletterState: null,
      community: {
        name: '',
        description: '',
      },
      hasElopage: false,
      publisherId: null,
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
