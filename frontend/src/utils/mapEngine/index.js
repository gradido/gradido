// AI-GENERATED — not an architecture reference

/**
 * The map engine, loaded when a map is built.
 *
 * Not imported where it is used: the home map is imported by pages that show it on one tab only
 * (the matching page, Settings > Communities), and a static import would bring MapLibre - about
 * 300 KB gzipped - along with them, map or no map. Measured on the build on 16.09.2026: 321 KB
 * gzipped for the matching page beyond the index that way, 22 KB loaded like this.
 *
 * @returns {Promise<{ createMap: Function }>} the engine module (utils/mapEngine/maplibre)
 */
export function loadMapEngine() {
  return import('./maplibre.js')
}
