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
    // console.log('store username mutation', username)
    state.username = username
  },
}

export const actions = {
  login: ({ dispatch, commit }, data) => {
    commit('sessionId', data.sessionId)
    commit('email', data.user.email)
    commit('language', data.user.language)
    commit('username', data.user.username ? '' : 'teststoreusername')
  },
  logout: ({ commit, state }) => {
    commit('sessionId', null)
    commit('email', null)
    commit('username', null)
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
    modals: false,
    username: 'testname',
  },
  getters: {},
  // Syncronous mutation of the state
  mutations,
  actions,
})
