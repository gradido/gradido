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
}

export const actions = {
  login: ({ dispatch, commit }, data) => {
    commit('sessionId', data.sessionId)
    commit('email', data.email)
  },
  logout: ({ commit, state }) => {
    commit('sessionId', null)
    commit('email', null)
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
    language: 'en',
    modals: false,
  },
  getters: {},
  // Syncronous mutation of the state
  mutations,
  actions,
})
