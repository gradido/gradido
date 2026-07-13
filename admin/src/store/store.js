import { createStore } from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import CONFIG from '../config'
import { clearStoragePreservingPreferences } from './storage'

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
  logout: ({ commit }) => {
    commit('token', null)
    commit('moderator', null)
    // Wallet and admin are served from the same origin and share one
    // localStorage. Preserve device-local preferences (dark-mode theme, any
    // pref.* key) instead of wiping everything -- otherwise a logout here also
    // resets the wallet's theme. See store/storage.js.
    clearStoragePreservingPreferences()
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
