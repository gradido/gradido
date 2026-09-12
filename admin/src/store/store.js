import { createStore } from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import CONFIG from '../config'
import { forgetAllMemberAvatars } from '@/composables/useMemberAvatars'
import { closeMemberAvatarZoom } from '@/composables/useMemberAvatarZoom'

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
    // The member pictures this session fetched. They are other people's faces, held only to
    // save round trips -- whoever signs in next has no business with them, and the same
    // browser is routinely used by more than one moderator.
    forgetAllMemberAvatars()
    // ⛔ And the picture that is OPEN, which is not the same thing. The window hangs on the
    // token, so it unmounts at logout -- but the state it reads lives in a module and would
    // still be there when the next moderator signs in, opening the previous one's face in
    // their first second. (coderabbit, #3890.)
    closeMemberAvatarZoom()
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
