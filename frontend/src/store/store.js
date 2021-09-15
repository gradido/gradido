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
}

export const actions = {
  login: ({ dispatch, commit }, data) => {
    commit('email', data.email)
    commit('language', data.language)
    commit('username', data.username)
    commit('firstName', data.firstName)
    commit('lastName', data.lastName)
    commit('description', data.description)
  },
  logout: ({ commit, state }) => {
    commit('token', null)
    commit('email', null)
    commit('username', '')
    commit('firstName', '')
    commit('lastName', '')
    commit('description', '')
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
  },
  getters: {},
  // Syncronous mutation of the state
  mutations,
  actions,
})
