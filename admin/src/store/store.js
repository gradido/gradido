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
  setOpenCreations: (state, openCreations) => {
    state.openCreations = openCreations
  },
  moderator: (state, moderator) => {
    state.moderator = moderator
  },
  userSelectedInMassCreation: (state, userSelectedInMassCreation) => {
    state.userSelectedInMassCreation = userSelectedInMassCreation
  },
}

export const actions = {
  login: ({ dispatch, commit }, data) => {
    commit('userSelectedInMassCreation', data)
  },
  logout: ({ commit, state }) => {
    commit('token', null)
    commit('moderator', null)
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
    moderator: null,
    openCreations: 0,
    userSelectedInMassCreation: [],
  },
  // Syncronous mutation of the state
  mutations,
  actions,
})

export default store
