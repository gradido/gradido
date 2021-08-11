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
}

export const actions = {
  login: ({ dispatch, commit }, data) => {
    commit('sessionId', data.sessionId)
    commit('email', data.user.email)
    commit('language', data.user.language)
    commit('username', data.user.username)
    commit('firstName', data.user.firstName)
    commit('lastName', data.user.lastName)
    commit('description', data.user.description)
  },
  logout: ({ commit, state }) => {
    commit('sessionId', null)
    commit('email', null)
    commit('username', '')
    commit('firstName', '')
    commit('lastName', '')
    commit('description', '')
    sessionStorage.clear()
  },
}

export const store = new Vuex.Store({
  plugins: [
    createPersistedState({
      storage: window.sessionStorage,
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
  },
  getters: {},
  // Syncronous mutation of the state
  mutations,
  actions,
})
