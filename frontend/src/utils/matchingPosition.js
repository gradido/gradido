// AI-GENERATED — not an architecture reference
import CONFIG from '@/config'

/**
 * What counts as a position, and who may open the find map.
 *
 * One place for both answers, because the fault of 09.09.2026 was three places giving
 * different ones. An account that had never set a position was answered `{}` by the
 * backend; the entry page read that as "has a position" (truthy), the map read it the
 * same way, drew its own marker at (undefined, undefined), stored `{}` as the search
 * centre and asked the GMS about it -- which answered 400, honestly, and the wallet
 * reported "the search is not reachable".
 *
 * ⭐ The rule these serve (Bernd, 09.09.2026, and the way it was built originally --
 * commit 7122a7b4e): the find map opens only when BOTH answers are given, a position is
 * set AND it may travel to the GMS. Anything else goes to the position tab.
 *
 * Numbers, not truthiness, all the way through. The backend says null now, but the empty
 * object it used to say is still sitting in the persisted store of every device that
 * signed in before the fix -- so a truthy check would let exactly the broken case
 * through, on exactly the devices that have it.
 */

/**
 * The instance's own coordinates, as the build was configured -- the last fallback for a
 * map that needs a centre to show.
 *
 * The server answers `communityLocation: null` where no admin ever set the community's
 * point, and that must not stop a member from setting their own: the page for doing so is
 * the very page that needs a centre to draw. The settings map has always fallen back this
 * way for its own error case; this is that fallback, in one place.
 */
export function configuredCommunityPoint() {
  const [lat, lng] = String(CONFIG.COMMUNITY_LOCATION ?? '').split(',')
  return { lat: parseFloat(lat), lng: parseFloat(lng) }
}

/** The backend's shape: `{ longitude, latitude }`, or null where nothing is set. */
export function hasPosition(userLocation) {
  return Number.isFinite(userLocation?.latitude) && Number.isFinite(userLocation?.longitude)
}

/** The map's shape: `{ lat, lng }`. A point that is not two numbers is not a place. */
export function isPlace(point) {
  return Number.isFinite(point?.lat) && Number.isFinite(point?.lng)
}

/**
 * Both answers together, read off the store: findability and a position.
 *
 * The store is what the router can ask, and it is kept fresh at every place a member can
 * change either -- the login, the /authenticate guard, the position tab and the settings
 * map all write it. A copy that lags behind the server can only be wrong in the safe
 * direction here: it sends somebody to the position tab who could have gone on, and that
 * page shows them their pin. The other direction is caught on the map itself, which asks
 * the server again on arrival.
 */
export function mayFind(state) {
  return Boolean(state?.gmsAllowed) && hasPosition(state?.userLocation)
}
