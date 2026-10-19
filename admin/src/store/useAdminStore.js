// AI-GENERATED — not an architecture reference
import { defineStore } from 'pinia'
import { forgetAllMemberAvatars } from '@/composables/useMemberAvatars'
import { closeMemberAvatarZoom } from '@/composables/useMemberAvatarZoom'
import { forgetModeratorContacts } from '@/composables/useModeratorContacts'
import { keepAuthToken } from '@/utils/authToken'

/** Where the admin keeps its own state in localStorage (store.js). */
export const STATE_KEY = 'gradido-admin'

/**
 * The state of the admin interface: whom it is signed in as, and how many creations are open.
 *
 * Only the definition. What the app opens with, what it saves and how it follows other windows
 * hangs on the one instance in store.js -- a spec takes this with a Pinia of its own and gets
 * none of that.
 */
export const useAdminStore = defineStore('admin', {
  state: () => ({
    token: null,
    moderator: null,
    openCreations: 0,
  }),
  actions: {
    setToken(token) {
      this.token = token
      keepAuthToken(token)
    },
    setModerator(moderator) {
      this.moderator = moderator
    },
    setOpenCreations(openCreations) {
      this.openCreations = openCreations
    },
    openCreationsPlus(i) {
      this.openCreations += i
    },
    openCreationsMinus(i) {
      this.openCreations -= i
    },
    logout() {
      this.setToken(null)
      this.setModerator(null)
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
      // Remove only the admin's own persisted state. The token is not in this blob -- setToken
      // above has removed it from where both apps keep it, and with it the wallet's session
      // (utils/authToken.js). The wallet and admin share one origin, so localStorage.clear()
      // would also wipe the wallet's state and the shared dark-mode theme key.
      window.localStorage.removeItem(STATE_KEY)
    },
  },
})
