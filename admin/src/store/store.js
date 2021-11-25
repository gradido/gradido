import Vuex from 'vuex'
import Vue from 'vue'
import createPersistedState from 'vuex-persistedstate'
import CONFIG from '../config'

Vue.use(Vuex)

export const mutations = {
  openCreationsPlus: (state, i) => {
    state.openCreations += i
  },
  openCreationsMinus: (state, i) => {
    state.openCreations -= i
  },
  resetOpenCreations: (state) => {
    state.openCreations = 0
  },
  token: (state, token) => {
    state.token = token
  },
}

export const actions = {
  logout: ({ commit, state }) => {
    commit('token', null)
    window.localStorage.clear()
  },
}

const store = new Vuex.Store({
  plugins: [
    createPersistedState({
      storage: window.localStorage,
    }),
  ],
  state: {
    token: CONFIG.DEBUG_DISABLE_AUTH ? 'validToken' : null,
    moderator: { name: 'Dertest Moderator', id: -1 },
    openCreations: 0,
  },
  // Syncronous mutation of the state
  mutations,
  actions,
})

export default store
