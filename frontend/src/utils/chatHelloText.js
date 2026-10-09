// AI-GENERATED — not an architecture reference
import { distanceKm } from '@/composables/useMatches'
import { memberAlias } from '@/utils/gradidoAddress'
import { isPlace } from '@/utils/matchingPosition'

/**
 * The first word to somebody found on the map (E-065, E-068): what stands in the field of the
 * profile window before the member has typed anything.
 *
 * It makes the contact and says how far apart the two live, and nothing else (Bernd,
 * 09.10.2026). No entry of the other person is named or chosen: they may have many, the hello
 * need not be about any of them, and whoever means one of them writes that themselves. So the
 * same words stand for every point of the map, a match or a grey ring.
 */

/** Below this the words name no figure: "not far from each other". */
export const CHAT_HELLO_NEAR_KM = 5

/**
 * How far apart the two live, as the hello says it -- or null where it says nothing about it.
 *
 * - Measured from the member's HOME, not from where the map is searching: the sentence says
 *   "we live", and a search may stand anywhere.
 * - Nothing beyond the member's own standing reach: a figure of several hundred kilometres is no
 *   reason to say hello, and the wide search is not about nearness.
 * - No figure below five kilometres, and whole kilometres above. The other person's point is
 *   the one the GMS already blurred, so a finer figure would claim more than is known -- and it
 *   stands in a message to somebody the member does not know yet, where it would say more about
 *   the member's own home than a hello needs to.
 *
 * @param {{ home: {lat: number, lng: number} | null, theirs: {lat: number, lng: number} | null,
 *   reachKm: number }} where
 * @returns {{ near: true } | { km: number } | null}
 */
export function chatHelloDistance({ home, theirs, reachKm }) {
  if (!isPlace(home) || !isPlace(theirs) || !Number.isFinite(reachKm)) return null
  const km = distanceKm(home, theirs)
  if (!Number.isFinite(km) || km > reachKm) return null
  if (km < CHAT_HELLO_NEAR_KM) return { near: true }
  return { km: Math.round(km) }
}

/**
 * The name under the hello: the member's user name -- the name the other person reads over the
 * message and in the mail about it. Nobody signs with a Gradido ID, and the wallet does not put
 * a first name into a message on the member's behalf: without a user name there is no signature.
 *
 * @param {string | null | undefined} username
 * @returns {string}
 */
export const chatHelloSignature = (username) => memberAlias(username, '')

/**
 * The words themselves: sentences of their own, joined by a space, so that no language has to
 * bend one into another -- found on the map, how far apart, the question, the signature.
 *
 * @param {(key: string, named?: object) => string} t
 * @param {{ name: string, signature?: string,
 *   distance?: { near: true } | { km: number } | null, locale?: string }} hello
 * @returns {string}
 */
export function chatHelloText(t, { name, signature = '', distance = null, locale }) {
  const parts = [t('chatHello.found', { name })]
  if (distance?.near) {
    parts.push(t('chatHello.distanceNear'))
  } else if (distance) {
    parts.push(t('chatHello.distanceKm', { n: distance.km.toLocaleString(locale) }))
  }
  parts.push(t('chatHello.question'))
  if (signature) parts.push(signature)
  return parts.join(' ')
}
