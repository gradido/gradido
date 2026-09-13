// AI-GENERATED — not an architecture reference
import { GEO_PROVIDER } from '@/composables/useMapSwitches'

/** The reverse lookup of Nominatim, the OSM service behind the old place search. */
export const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'

/**
 * The name of a point set on the map, for the list's line - behind the admin switch
 * (K-002, K-008).
 *
 * Old position: the lookup the map made before, unchanged - the finest part there is first
 * (the street when there is one), then the place. New position: nothing is asked, and the
 * list calls the point "the chosen point" until the name comes from the map's own tiles
 * (B3). The map does not ask this for the member's home; it names that without a lookup.
 *
 * @param {string} geoProvider GEO_PROVIDER.NOMINATIM or GEO_PROVIDER.GMS
 * @param {number} lat
 * @param {number} lng
 * @param {string} locale the wallet's language, for the reading of the name
 * @returns {Promise<string>} the name, or '' where there is none; never rejects
 */
export async function reverseName(geoProvider, lat, lng, locale) {
  if (geoProvider === GEO_PROVIDER.GMS) return ''
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
