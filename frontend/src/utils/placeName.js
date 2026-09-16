// AI-GENERATED — not an architecture reference
import { VectorTile } from '@mapbox/vector-tile'
import { PbfReader } from 'pbf'
import { distanceKm } from '@/composables/useMatches'

/**
 * The name of a point on the map, read from the map's own tile file (plan K-003, B3), for
 * the list's line "around ...". Two parts where the second helps to find the first:
 *
 *   Moosach, München         a district, and the city it lies in
 *   Pfedelbach, Öhringen     a place, and a bigger town nearby
 *   Künzelsau                a place with no bigger town near it
 *
 * The second part is for orientation, not the municipality: "Pfedelbach, Öhringen" says
 * where Pfedelbach is, not that it belongs to Öhringen (Bernd, 15.09.2026).
 *
 * Read from the places layer of up to three tiles around the point:
 * - zoom 12: villages, hamlets and the districts of cities;
 * - zoom 9: towns and cities with their population, also where their node is 10 to 20 km
 *   away - a tile carries the places of a quarter of its width around it as well;
 * - zoom 11: only where neither has a village, town or city within PLACE_MAX_KM.
 *
 * Known limits (15.09.2026): a place whose node lies beyond the buffer of these tiles is not
 * seen, so near a tile's edge a farther village or no big city can be named; and where two
 * cities meet, a district can be named with the other one ("Mitte, Mannheim" in
 * Ludwigshafen). Reading the neighbouring tiles would cost 0.2 to 1 MB more per lookup.
 */
const FINE_ZOOM = 12
const TOWN_ZOOM = 9
const WIDER_ZOOM = 11

/** A village, town or city farther than this does not name the point. */
const PLACE_MAX_KM = 5
/** A district names the point only within this distance of its node. */
const DISTRICT_MAX_KM = 1

/**
 * How far a place reaches: the radius of a disc holding its population at this many people
 * per km² - München 17.7 km, Heilbronn 5.3 km, Künzelsau 1.8 km, a village of 2,000
 * 0.65 km. The point lies in the place whose disc covers it; where discs overlap, in the
 * one it is relatively nearest to. Chosen at 79 points, checked at 70 more (15.09.2026).
 *
 * A city's disc counts only where one of its districts is near: its disc is far larger than
 * its streets, and without a district the point is in the fields or villages around it
 * ("Fischerhäuser, München", not "München", NE of Ismaning).
 */
const PLACE_DENSITY = 1500
/**
 * The same for the bigger town that helps to find a place, and wider on purpose (Bernd,
 * 15.09.2026): Künzelsau reaches 6.9 km, Öhringen 8.5 km, Heilbronn 20.5 km.
 */
const NEARBY_DENSITY = 100

const SETTLEMENTS = ['city', 'town', 'village']
const SMALL_PLACES = ['hamlet', 'locality', 'isolated_dwelling']
const TOWNS = ['city', 'town']
// A district big enough to find a place by; the finer `neighbourhood` is left out.
const DISTRICTS = ['suburb', 'quarter']

/**
 * The tile a point lies in. A longitude beyond ±180 (the map pans round the world) is
 * wrapped back; a latitude north or south of the tiles (beyond 85.05°) gets the edge row.
 *
 * @returns {{x: number, y: number}}
 */
export function tileXY(lat, lng, z) {
  const n = 2 ** z
  const wrapped = ((((lng + 180) % 360) + 360) % 360) - 180
  const rad = (lat * Math.PI) / 180
  const x = Math.floor(((wrapped + 180) / 360) * n)
  const y = Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n)
  return { x, y: Math.min(n - 1, Math.max(0, y)) }
}

/**
 * The places of one tile: every point feature of its `places` layer.
 *
 * @param {ArrayBuffer} data the tile as the archive returns it
 * @returns {{lat: number, lng: number, properties: object}[]}
 */
export function decodePlaces(data, x, y, z) {
  const layer = new VectorTile(new PbfReader(new Uint8Array(data))).layers.places
  if (!layer) return []
  const places = []
  for (let i = 0; i < layer.length; i++) {
    const feature = layer.feature(i)
    const { geometry } = feature.toGeoJSON(x, y, z)
    if (geometry.type !== 'Point') continue
    const [lng, lat] = geometry.coordinates
    places.push({ lat, lng, properties: feature.properties })
  }
  return places
}

const isSettlement = ({ properties: p }) =>
  p.kind === 'locality' && SETTLEMENTS.includes(p.kind_detail)
const isSmallPlace = ({ properties: p }) =>
  p.kind === 'locality' && SMALL_PLACES.includes(p.kind_detail)
const isTown = ({ properties: p }) => p.kind === 'locality' && TOWNS.includes(p.kind_detail)
const isCity = ({ properties: p }) => p.kind === 'locality' && p.kind_detail === 'city'
const isDistrict = ({ properties: p }) =>
  (p.kind === 'neighbourhood' || p.kind === 'macrohood') && DISTRICTS.includes(p.kind_detail)
const population = ({ properties: p }) => p.population ?? 0

function nearestWithin(places, test, maxKm) {
  let nearest = null
  for (const place of places) {
    if (test(place) && place.km < maxKm && (!nearest || place.km < nearest.km)) nearest = place
  }
  return nearest
}

/** The place whose disc covers the point - the relatively nearest where discs overlap. */
function coveringPlace(places, density) {
  let covering = null
  let share = Infinity
  for (const place of places) {
    const reach = Math.sqrt(population(place) / (Math.PI * density))
    if (!(reach > 0) || place.km > reach) continue
    if (place.km / reach < share) {
      covering = place
      share = place.km / reach
    }
  }
  return covering
}

// A place in the wallet's language, then in English, then as the country writes it.
function settlementName({ properties: p }, locale) {
  return p[`name:${locale}`] || p['name:en'] || p.name
}

// A district in Latin script by its own name, never the old exonym some still carry in the
// wallet's language (Vinohrady, not Weinberge). In another script by a reading in the
// wallet's language or in English where the tile has one, and otherwise as it is written:
// a district is always named (Bernd, 12.09.2026).
function districtName({ properties: p }, locale) {
  return p.script ? p[`name:${locale}`] || p['name:en'] || p.name : p.name
}

/**
 * Name a point from the tile file.
 *
 * @param {{getZxy: Function}} archive the PMTiles archive (utils/mapTiles)
 * @param {number} lat
 * @param {number} lng
 * @param {string} locale the wallet's language
 * @param {Function} [decode] reads the places of a tile; a spec hands in plain lists
 * @returns {Promise<{place: string, context: string|null}|null>} null where no place is
 *   near enough to name the point; rejects when the file cannot be read
 */
export async function placeNameAt(archive, lat, lng, locale, decode = decodePlaces) {
  const read = async (z) => {
    const { x, y } = tileXY(lat, lng, z)
    const tile = await archive.getZxy(z, x, y)
    if (!tile) return []
    return decode(tile.data, x, y, z)
      .filter((place) => place.properties.name)
      .map((place) => ({ ...place, km: distanceKm({ lat, lng }, place) }))
  }
  const [fine, towns] = await Promise.all([read(FINE_ZOOM), read(TOWN_ZOOM)])
  const known = [...fine, ...towns]
  const district = nearestWithin(fine, isDistrict, DISTRICT_MAX_KM)

  const reachable = known.filter(
    (settlement) => isSettlement(settlement) && (district || !isCity(settlement)),
  )
  let place =
    coveringPlace(reachable, PLACE_DENSITY) ?? nearestWithin(known, isSettlement, PLACE_MAX_KM)
  if (!place) {
    place =
      nearestWithin(await read(WIDER_ZOOM), isSettlement, PLACE_MAX_KM) ??
      nearestWithin(fine, isSmallPlace, PLACE_MAX_KM)
  }
  if (!place) return null

  if (isCity(place)) {
    return district
      ? { place: districtName(district, locale), context: settlementName(place, locale) }
      : { place: settlementName(place, locale), context: null }
  }
  const bigger = known.filter((town) => isTown(town) && population(town) > population(place))
  const nearby = coveringPlace(bigger, NEARBY_DENSITY)
  return {
    place: settlementName(place, locale),
    context: nearby ? settlementName(nearby, locale) : null,
  }
}
