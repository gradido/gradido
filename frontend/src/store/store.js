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
  community: (state, community) => {
    state.community = community
  },
  coinanimation: (state, coinanimation) => {
    state.coinanimation = coinanimation
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
    localStorage.clear()
  },
}

export const store = new Vuex.Store({
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
    coinanimation: true,
    newsletterState: null,
    community: null,
  },
  getters: {},
  // Syncronous mutation of the state
  mutations,
  actions,
})
