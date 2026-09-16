// AI-GENERATED — not an architecture reference
import { MAP_ENGINE } from '@/composables/useMapSwitches'

/**
 * The engine a map is drawn with, chosen by the admin switch (K-008).
 *
 * Both engines hand out the same handle (`createMap`, see `./leaflet.js`), so a page asks for
 * one by its switch position and draws the same way on either. Loaded when asked for: MapLibre
 * weighs several times what Leaflet does, and nobody who never opens a map should download it.
 * A position this wallet does not know draws with Leaflet, which every server had before the
 * switch.
 *
 * @param {string} name MAP_ENGINE.LEAFLET or MAP_ENGINE.MAPLIBRE
 * @returns {Promise<{ createMap: Function }>} the engine module
 */
export function loadMapEngine(name) {
  if (name === MAP_ENGINE.MAPLIBRE) return import('./maplibre.js')
  return import('./leaflet.js')
}
