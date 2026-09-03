// AI-GENERATED — not an architecture reference

import { onMounted, onUnmounted, watch } from 'vue'
import {
  ensureContactsPanel,
  holdContactsPanel,
  releaseContactsPanel,
} from '@/composables/useContactsPanel'
import { ensureFavorites } from '@/composables/useFavorites'
import { fetchMemberAvatars } from '@/composables/useMemberAvatars'

/**
 * What every contacts panel needs, whichever posture it is in.
 *
 * The column and the phone strip are two components on purpose -- each declares its own
 * four states, which is what stopped the strip from being the column minus its parts. What
 * they must NOT hold separately is this: asking for the list, saying they are on screen,
 * and ordering the portraits. All three were copied into both, and the copies had already
 * drifted where it mattered most.
 *
 * @param apolloClient the client both requests go out on
 * @param membersOnScreen a computed of the members the caller is DRAWING, in drawing order
 */
export const useContactsPanelHost = (apolloClient, membersOnScreen) => {
  // Both are no-ops once their answer is here: the layout asks for the hearts at mount, and
  // this is the retry if that request did not land. `ensureContactsPanel` also picks up a
  // search that failed and a list a transfer left out of date.
  ensureFavorites(apolloClient)
  ensureContactsPanel(apolloClient)

  // Says that a panel is on screen, so a refresh knows whether to fetch now or leave the
  // list marked for the next mount.
  onMounted(holdContactsPanel)
  onUnmounted(releaseContactsPanel)

  /**
   * The faces, in the order they are looked at. The store keeps a fixed number and serves
   * the list in the order it is handed, so what is on screen has to come first.
   *
   * ⛔ The caller hands in MEMBERS, not decorated rows, and that is the whole reason this
   * is here. A watch over the decorated lists reads the avatar store through
   * `memberAvatarProps`, and its own callback writes to that store -- it woke itself. The
   * repair for that narrowed the watch to the fetched rows, which broke the other half:
   * `isFavorite` moved inside the callback where Vue tracks nothing, so a heart given no
   * longer moved anybody's portrait, and a strip whose hearts arrived after its contacts
   * fetched none at all. A computed over the rows AND the hearts, touching no avatar
   * store, is the source that fires exactly when the drawing changes.
   */
  watch(
    membersOnScreen,
    (members) => {
      fetchMemberAvatars(apolloClient, members)
    },
    { immediate: true },
  )
}
