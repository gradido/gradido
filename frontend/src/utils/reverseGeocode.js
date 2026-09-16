// AI-GENERATED — not an architecture reference
import CONFIG from '@/config'
import { archiveFor } from '@/utils/mapTiles'
import { placeNameAt } from '@/utils/placeName'

/**
 * How long a name from the tiles is waited for. The list calls the point "the chosen point"
 * from the moment the lookup starts (MatchingMap), so a slow link only delays the name. A
 * first lookup reads about 0.5 MB (header, two directories, two tiles), a later one about
 * 0.25 MB, unless the browser still holds them (measured on 15.09.2026).
 */
const TILE_NAME_TIMEOUT_MS = 15000

/**
 * The name of a point set on the map, for the list's line (K-002): it comes from the map's own
 * tile file (utils/placeName), and nothing is asked of anybody else. The map does not ask this
 * for the member's home; it names that without a lookup.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {string} locale the wallet's language, for the reading of the name
 * @returns {Promise<string>} the name, or '' where there is none; never rejects
 */
export async function reverseName(lat, lng, locale) {
  let timer
  const late = new Promise((resolve) => {
    timer = setTimeout(() => resolve(null), TILE_NAME_TIMEOUT_MS)
  })
  try {
    const lookup = placeNameAt(archiveFor(CONFIG.MAP_TILES_URL), lat, lng, locale)
    const found = await Promise.race([lookup, late])
    if (!found) return ''
    return found.context ? `${found.place}, ${found.context}` : found.place
  } catch {
    return ''
  } finally {
    clearTimeout(timer)
  }
}
