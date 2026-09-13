// AI-GENERATED — not an architecture reference

/**
 * The address search of the community's GMS, as a plain function: `GET {base}geo/search`.
 *
 * Open on the GMS side - no token, no member - and answered from an index next to the GMS,
 * so it may be asked while somebody types (`prefix=true` is built for exactly that). The
 * base is the address the GMS API answers under, `https://…/gms/` (useGmsBase).
 *
 * Ported from the GMS dashboard's own provider (gms_workspace,
 * frontend/src/services/geoIndexProvider.ts). Its label doubles a town that is its own name
 * ("Prag, Prag"); this one does not.
 */

/** Most places asked for - more than a list anyone reads. The GMS takes up to 50. */
export const GEO_SEARCH_LIMIT = 10

/**
 * Into the range the GMS accepts. Leaflet does not wrap the centre of a map that was panned
 * once around the world, and the GMS answers a longitude of 369.69 with 400 (measured
 * 13.09.2026) - the search would come back empty for no reason the member could see.
 */
function wrapLongitude(lng) {
  // Only what is out of range: the arithmetic turns 9.69 into 9.690000000000055.
  if (lng >= -180 && lng <= 180) return lng
  return ((((lng + 180) % 360) + 360) % 360) - 180
}

/**
 * One line for one place, from the parts that are there: street and number, then postcode
 * and town.
 *
 * A town answers with its own name twice, as `name` and as `city` (measured: "Prag" and
 * "Prag", kind 4). The name is left out then - unless a house number makes it a street.
 *
 * @param {{name: ?string, number: ?string, postcode: ?string, city: ?string}} address
 * @returns {string}
 */
export function labelOf(address) {
  const { name, number, postcode, city } = address
  const repeatsTown = Boolean(name) && name === city && !number
  const street = repeatsTown ? '' : [name, number].filter(Boolean).join(' ')
  const town = [postcode, city].filter(Boolean).join(' ')
  return [street, town].filter(Boolean).join(', ')
}

/**
 * @param {?string} base the GMS API address, ending in a slash; without one nothing is asked
 * @param {string} text what was typed
 * @param {object} [options]
 * @param {?{lat: number, lng: number}} [options.near] where the map looks: a hint the GMS
 *   lifts nearby places with, not a filter
 * @param {?string} [options.language] the reading the names are spelled in
 * @param {number} [options.limit]
 * @returns {Promise<{lat: number, lng: number, label: string, raw: object}[]>} never rejects:
 *   a search that cannot be answered is an empty list
 */
export async function searchPlaces(
  base,
  text,
  { near = null, language = null, limit = GEO_SEARCH_LIMIT } = {},
) {
  const query = String(text ?? '').trim()
  if (!base || !query) return []

  const params = new URLSearchParams({ query, limit: String(limit), prefix: 'true' })
  // Both halves or neither, as the GMS reads them.
  if (near && Number.isFinite(near.lat) && Number.isFinite(near.lng)) {
    params.set('latitude', String(near.lat))
    params.set('longitude', String(wrapLongitude(near.lng)))
  }
  if (language) params.set('language', language)

  try {
    const response = await fetch(`${base}geo/search?${params}`)
    // Anything but a list of places is no answer, and each such answer ends in the catch: an
    // installation without an index says 503 in plain text (no JSON), a refused question 400
    // with an error object (no `filter`), a GMS that is down nothing at all. The search stays
    // empty; the failed request shows in the network tab.
    const data = await response.json()
    return (
      data
        // A place without a coordinate cannot move a map.
        .filter((address) => Number.isFinite(address?.lat) && Number.isFinite(address?.lon))
        .map((address) => ({
          lat: address.lat,
          lng: address.lon,
          label: labelOf(address),
          raw: address,
        }))
    )
  } catch {
    return []
  }
}
