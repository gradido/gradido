import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
import createPersistedState from 'vuex-persistedstate'

export const mutations = {
  language: (state, language) => {
    state.language = language
  },
  email: (state, email) => {
    state.email = email
  },
  session_id: (state, session_id) => {
    state.session_id = session_id
  },
}

export const actions = {
  login: ({ dispatch, commit }, data) => {
    commit('session_id', data.session_id)
    commit('email', data.email)
  },
  logout: ({ commit, state }) => {
    commit('session_id', null)
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
    session_id: null,
    email: '',
    language: 'en',
    modals: false,
  },
  getters: {},
  // Syncronous mutation of the state
  mutations,
  actions,
})
