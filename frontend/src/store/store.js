import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'
// import VueJwtDecode from 'vue-jwt-decode'

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
    // const decoded = VueJwtDecode.decode(data.token)
    const { user } = data
    commit('token', data.token)
    commit('email', user.email)
    commit('language', user.language)
    commit('username', user.username)
    commit('firstName', user.firstName)
    commit('lastName', user.lastName)
    commit('description', user.description)
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
