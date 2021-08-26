import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import VueJwtDecode from 'vue-jwt-decode'

Vue.use(Vuex)

export const mutations = {
  language: (state, language) => {
    state.language = language
  },
  email: (state, email) => {
    state.email = email
  },
  sessionId: (state, sessionId) => {
    state.sessionId = sessionId
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
}

export const actions = {
  login: ({ dispatch, commit }, token) => {
    const decoded = VueJwtDecode.decode(token)
    commit('sessionId', decoded.sessionId)
    commit('email', decoded.email)
    commit('language', decoded.language)
    commit('username', decoded.username)
    commit('firstName', decoded.firstName)
    commit('lastName', decoded.lastName)
    commit('description', decoded.description)
    commit('token', token)
  },
  logout: ({ commit, state }) => {
    commit('sessionId', null)
    commit('email', null)
    commit('username', '')
    commit('firstName', '')
    commit('lastName', '')
    commit('description', '')
    commit('token', null)
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
    sessionId: null,
    email: '',
    language: null,
    firstName: '',
    lastName: '',
    username: '',
    description: '',
    token: null,
  },
  getters: {},
  // Syncronous mutation of the state
  mutations,
  actions,
})
