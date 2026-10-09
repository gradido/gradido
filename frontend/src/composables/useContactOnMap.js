// AI-GENERATED — not an architecture reference
import { ref } from 'vue'
import { useStore } from 'vuex'
import CONFIG from '@/config'
import { isUsablePlace, useMatches } from '@/composables/useMatches'
import { mayFind } from '@/utils/matchingPosition'

/** Whether an id is the signed-in member's own, however a server spells it. */
export function isOneself(gradidoID, state) {
  const own = String(state?.gradidoID ?? '').toLowerCase()
  return Boolean(own) && String(gradidoID ?? '').toLowerCase() === own
}

/**
 * The pair the find map is asked about a contact with -- or null where it is not asked at all.
 *
 * ⛔ Nobody is asked about on behalf of a member who may not open the map themselves (Bernd's
 * rule of 09.09.2026, `mayFind`: a position AND the permission to be found). That is not only
 * the rule of the door: the question goes to the GMS with a token minted for the one who asks,
 * and minting it sends their id there -- to the very service a member with "findable" switched
 * off has left. For them the answer would be a refusal anyway.
 *
 * - Not where this instance offers no matching: the map's address does not exist there.
 * - Not about oneself: the house on the map is one's own mark.
 * - A contact without a community is one of this community (the server reads it so, KF-004); the
 *   GMS names a person by the pair, so the own uuid is written out.
 *
 * @param member `{ gradidoID, communityUuid }`, as a contact row or a booking row carries it
 * @param state the wallet's store state
 * @returns {{ gradidoID: string, communityUuid: string } | null}
 */
export function contactMapPair(member, state) {
  if (!CONFIG.MATCHING_ACTIVE || !mayFind(state)) return null
  const gradidoID = member?.gradidoID
  const communityUuid = member?.communityUuid ?? state?.communityUuid
  if (!gradidoID || !communityUuid || isOneself(gradidoID, state)) return null
  return { gradidoID, communityUuid }
}

/**
 * Whether a contact stands on the find map (Bernd, 09.10.2026): the contact window shows its way
 * to the map only for somebody who can be shown there.
 *
 * Asked of the GMS's profile route, the one the map's own window asks with every tap
 * (useMatches): it answers for the pair wherever the person lives, with the point the map would
 * draw -- the one the GMS has blurred already. Somebody who is not findable is not held there,
 * and the route answers 404.
 *
 * ⛔ Every answer belongs to the person it was asked for (`asked`). The window is handed one
 * person after another, and an answer that comes late would put one person's place on the map
 * under another's name.
 *
 * A question that does not get through ends as "not on the map": the way is not offered on a
 * guess, and nothing is said -- a missing mark is no error the member could act on.
 */
export const useContactOnMap = () => {
  const store = useStore()
  const { profile } = useMatches()

  /** The pair to show on the map, once the GMS has said the person stands there; else null. */
  const onMap = ref(null)

  /** Counts the persons asked about: an answer for an earlier one is let go. */
  let asked = 0

  /**
   * The window shows this person now -- or nobody (null). What was known about the one before
   * is let go at once.
   *
   * @param member `{ gradidoID, communityUuid }` or null
   */
  const ask = async (member) => {
    asked += 1
    const mine = asked
    onMap.value = null
    const pair = contactMapPair(member, store.state)
    if (!pair) return
    let there = false
    try {
      const person = await profile(pair.gradidoID, pair.communityUuid)
      // The GMS is a foreign system: a person it names without a usable point has no place to
      // be shown at.
      there = isUsablePlace(person?.position)
    } catch {
      // Not held there (404), or the GMS did not answer: no way to the map either way.
    }
    if (mine !== asked) return
    onMap.value = there ? pair : null
  }

  return { onMap, ask }
}
