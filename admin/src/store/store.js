import { createStore } from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import CONFIG from '../config'

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
}

export const actions = {
  logout: ({ commit, state }) => {
    commit('token', null)
    commit('moderator', null)
    // Remove only the admin's own persisted state (its token lives in this blob).
    // The wallet and admin share one origin, so localStorage.clear() would also wipe
    // the wallet's session and the shared dark-mode theme key.
    window.localStorage.removeItem('gradido-admin')
  },
}

const store = createStore({
  plugins: [
    createPersistedState({
      key: 'gradido-admin',
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
