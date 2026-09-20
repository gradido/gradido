// AI-GENERATED — not an architecture reference
import { layers, namedFlavor } from '@protomaps/basemaps'
import CONFIG from '@/config'

/**
 * The style the MapLibre map is drawn with: Protomaps' finished styles on Gradido's own tile
 * file, with the fonts and sprites from the same server - nothing of the map is fetched from
 * anywhere else (K-005, K-006).
 */

/**
 * The three looks of the matching map, each one of Protomaps' finished styles (K-004): dark is
 * black, normal is light, and bright is white, the paler of the two light ones.
 */
export const FLAVOR_OF_LOOK = Object.freeze({ dunkel: 'black', normal: 'light', hell: 'white' })

/** The name the style's layers read the tile file under. */
export const TILE_SOURCE = 'protomaps'

/**
 * The credit the OpenStreetMap licence (ODbL) asks for: in German where the wallet speaks
 * German, and everywhere else in English.
 */
const ATTRIBUTION = { de: '© OpenStreetMap-Mitwirkende' }
const ATTRIBUTION_ELSE = '© OpenStreetMap contributors'

/**
 * Where the place names and the small circles under them step back, so that the people on the
 * map stand out from the map (Bernd, 18.09.2026, chosen by eye on a render of the dark look).
 *
 * Protomaps draws the names of the black style at #999999 and marks each place with a hollow
 * circle - the shape of the wallet's grey presence rings and brighter than they are, so on the
 * dark look the towns read as people. The rings stay as they are: made brighter, they compete
 * with the glowing matches.
 *
 * The names take their colour from the flavor (`city_label`). The circles are images from the
 * sprite and have no colour to set, so `icon-opacity` of their layer dims them; Protomaps shows
 * them below zoom 8 only. The other two looks are Protomaps' own, untouched - the home map
 * draws the normal one, and there the place names are what a member finds their way by.
 */
const QUIET_PLACES = Object.freeze({
  dunkel: Object.freeze({ nameColor: '#5c5c5c', circleOpacity: 0.35 }),
})

/** Protomaps' layer of the towns and cities: their names, and the circles that mark them. */
const PLACES_LAYER = 'places_locality'

/**
 * The style for a look, labelled in the wallet's language.
 *
 * The labels come in only with a language (Protomaps adds no label layers without one), so a
 * map that was handed none is labelled in English, the wallet's fallback language - a map
 * without place names would give no sign of what went missing. A look it does not know is
 * drawn as the normal one.
 *
 * @param {string} look 'dunkel', 'normal' or 'hell'
 * @param {string} locale the wallet's language, e.g. 'de'
 * @returns {object} a MapLibre style specification
 */
export function styleFor(look, locale) {
  const flavor = FLAVOR_OF_LOOK[look] ?? FLAVOR_OF_LOOK.normal
  const lang = locale || 'en'
  const quiet = QUIET_PLACES[look]
  const colors = quiet
    ? { ...namedFlavor(flavor), city_label: quiet.nameColor }
    : namedFlavor(flavor)
  const styleLayers = layers(TILE_SOURCE, colors, { lang })
  if (quiet) {
    // A layer Protomaps no longer calls by this name leaves the circles as bright as they
    // were - a map that looks a little louder, not one that fails to draw. The spec holds the
    // name against the installed library.
    const places = styleLayers.find((layer) => layer.id === PLACES_LAYER)
    if (places) places.paint = { ...places.paint, 'icon-opacity': quiet.circleOpacity }
  }
  return {
    version: 8,
    glyphs: `${CONFIG.MAP_ASSETS_URL}/fonts/{fontstack}/{range}.pbf`,
    sprite: `${CONFIG.MAP_ASSETS_URL}/sprites/v4/${flavor}`,
    sources: {
      [TILE_SOURCE]: {
        type: 'vector',
        url: `pmtiles://${CONFIG.MAP_TILES_URL}`,
        attribution: ATTRIBUTION[lang] ?? ATTRIBUTION_ELSE,
      },
    },
    layers: styleLayers,
  }
}
