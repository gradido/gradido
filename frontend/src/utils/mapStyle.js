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
 * German, and everywhere else in English, as the Leaflet map has always shown it.
 */
const ATTRIBUTION = { de: '© OpenStreetMap-Mitwirkende' }
const ATTRIBUTION_ELSE = '© OpenStreetMap contributors'

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
    layers: layers(TILE_SOURCE, namedFlavor(flavor), { lang }),
  }
}
