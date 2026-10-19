import { createStore } from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import CONFIG from '../config'
import { forgetAllMemberAvatars } from '@/composables/useMemberAvatars'
import { closeMemberAvatarZoom } from '@/composables/useMemberAvatarZoom'
import { forgetModeratorContacts } from '@/composables/useModeratorContacts'
import { followAuthToken, keepAuthToken, readAuthToken, tokenBelongsTo } from '@/utils/authToken'

const STATE_KEY = 'gradido-admin'

// The token is kept for both apps (utils/authToken.js), not in this app's own blob: read when
// the admin interface opens, and left out of what the blob saves and gives back. A blob saved
// before the token moved out still carries one, and it is not taken.
const withoutToken = ({ token, ...rest }) => rest

/**
 * The token kept, where it is the moderator's whom the blob holds, or null.
 *
 * ⛔ Only theirs. The admin interface has no sign-in of its own: it takes the token the wallet
 * signed in with, and the moderator -- the role, the menus -- only on /authenticate. A token of
 * somebody else would run under the role of the moderator before; without it the page sends to
 * not-found, and the way over from the wallet brings the moderator anew.
 */
const keptToken = () => {
  const kept = readAuthToken()
  let moderator = null
  try {
    moderator = JSON.parse(localStorage.getItem(STATE_KEY))?.moderator ?? null
  } catch {
    // Nothing that can be read: no moderator.
  }
  return kept && tokenBelongsTo(kept.token, moderator?.gradidoID) ? kept.token : null
}

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
    keepAuthToken(token)
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
    // Whom this moderator is in contact with: theirs, and nobody's who signs in next.
    forgetModeratorContacts()
    // Remove only the admin's own persisted state. The token is not in this blob -- the
    // `token` commit above has removed it from where both apps keep it, and with it the
    // wallet's session (utils/authToken.js). The wallet and admin share one origin, so
    // localStorage.clear() would also wipe the wallet's state and the shared dark-mode theme key.
    window.localStorage.removeItem(STATE_KEY)
  },
}

const store = createStore({
  plugins: [
    createPersistedState({
      key: STATE_KEY,
      storage: window.localStorage,
      reducer: withoutToken,
      getState: (key, storage) => {
        try {
          const saved = JSON.parse(storage.getItem(key))
          return saved ? withoutToken(saved) : undefined
        } catch {
          return undefined
        }
      },
    }),
  ],
  state: {
    token: CONFIG.DEBUG_DISABLE_AUTH ? 'validToken' : keptToken(),
    moderator: null,
    openCreations: 0,
    userSelectedInMassCreation: [],
  },
  // Syncronous mutation of the state
  mutations,
  actions,
})

// A renewal in the wallet, or in another window of the admin interface, renews this one too;
// a logout there signs this one out, and a sign-in of somebody else reloads it. Without that,
// this window would go on with its own token -- and its next renewal would keep it again,
// signing in once more whoever signed out.
followAuthToken(store)

export default store
