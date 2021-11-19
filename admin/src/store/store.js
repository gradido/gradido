import Vuex from 'vuex'
import Vue from 'vue'
import createPersistedState from 'vuex-persistedstate'

Vue.use(Vuex)

export const mutations = {
  openCreationsPlus: (state, i) => {
    state.openCreations = state.openCreations + i
  },
  openCreationsMinus: (state, i) => {
    state.openCreations = state.openCreations - i
  },
  resetOpenCreations: (state) => {
    state.openCreations = 0
  },
  token: (state, token) => {
    state.token = token
  },
}

const store = new Vuex.Store({
  plugins: [
    createPersistedState({
      storage: window.localStorage,
    }),
  ],
  state: {
    token: null,
    moderator: 'Dertest Moderator',
    openCreations: 0,
  },
  // Syncronous mutation of the state
  mutations,
})

export default store
