// AI-GENERATED — not an architecture reference
import CONFIG from '@/config'
import { GEO_PROVIDER } from '@/composables/useMapSwitches'
import { archiveFor } from '@/utils/mapTiles'
import { placeNameAt } from '@/utils/placeName'

/** The reverse lookup of Nominatim, the OSM service behind the old place search. */
export const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'

/**
 * How long a name from the tiles is waited for. The list calls the point "the chosen point"
 * from the moment the lookup starts (MatchingMap), so a slow link only delays the name. A
 * first lookup reads about 0.5 MB (header, two directories, two tiles), a later one about
 * 0.25 MB, unless the browser still holds them (measured on 15.09.2026).
 */
const TILE_NAME_TIMEOUT_MS = 15000

/**
 * The name of a point set on the map, for the list's line - behind the admin switch
 * (K-002, K-008).
 *
 * Old position: the lookup the map made before, unchanged - the finest part there is first
 * (the street when there is one), then the place. New position: the name comes from the
 * map's own tile file (utils/placeName), and nothing is asked of anybody else. The map does
 * not ask this for the member's home; it names that without a lookup.
 *
 * @param {string} geoProvider GEO_PROVIDER.NOMINATIM or GEO_PROVIDER.GMS
 * @param {number} lat
 * @param {number} lng
 * @param {string} locale the wallet's language, for the reading of the name
 * @returns {Promise<string>} the name, or '' where there is none; never rejects
 */
export async function reverseName(geoProvider, lat, lng, locale) {
  if (geoProvider === GEO_PROVIDER.GMS) return tileName(lat, lng, locale)
  try {
    const url = `${NOMINATIM_REVERSE_URL}?format=jsonv2&zoom=16&lat=${lat}&lon=${lng}&accept-language=${locale}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return ''
    const data = await res.json()
    const a = data?.address || {}
    const fine =
      a.road || a.pedestrian || a.neighbourhood || a.suburb || a.city_district || a.hamlet
    const place = a.suburb || a.city || a.town || a.village || a.municipality || a.county || a.state
    const parts = [...new Set([fine, place].filter(Boolean))]
    return parts.slice(0, 2).join(', ') || data?.name || ''
  } catch {
    return ''
  }
}

async function tileName(lat, lng, locale) {
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
