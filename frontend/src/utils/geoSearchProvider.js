// AI-GENERATED — not an architecture reference
import { JsonProvider, OpenStreetMapProvider } from 'leaflet-geosearch'
import { GEO_PROVIDER } from '@/composables/useMapSwitches'
import { searchPlaces } from '@/utils/geoSearch'

/**
 * The GMS address search as a leaflet-geosearch provider - the port of the GMS dashboard's
 * `GeoIndexProvider` (gms_workspace, frontend/src/services/geoIndexProvider.ts).
 *
 * Where the map looks and which language the wallet reads are functions, read at the moment
 * of the search: the control lives as long as the map does, and the view and the language
 * move under it. The base is one too, because the wallet learns it asynchronously.
 *
 * Only `search` is implemented. The control and the list call nothing else, and the base
 * class's `endpoint`/`parse` pair would need the base synchronously.
 */
export class GeoIndexProvider extends JsonProvider {
  constructor({ base, viewpoint = () => null, language = () => null }) {
    super()
    this.base = base
    this.viewpoint = viewpoint
    this.language = language
  }

  async search({ query }) {
    const places = await searchPlaces(await this.base(), query, {
      near: this.viewpoint(),
      language: this.language(),
    })
    // The shape of a leaflet-geosearch result: x is the longitude, y the latitude. No box
    // comes back, so the control centres on the point and keeps its zoom.
    return places.map(({ lat, lng, label, raw }) => ({ x: lng, y: lat, label, bounds: null, raw }))
  }
}

/**
 * The place search the admin switch names (K-008), for every place the wallet searches
 * from: the big map's control, the list's field and the control on the home map.
 *
 * The switch is read at each search, not when the provider is made. Its position arrives
 * asynchronously, while the list makes its provider synchronously in setup - and read per
 * search, a switch an admin flips reaches an open page once the kept answer runs out.
 *
 * The old provider is only asked when the switch names it. Lives until D, which removes it
 * together with the switch.
 *
 * @param {object} options
 * @param {() => Promise<{geoProvider: string}>} options.mapSwitches from useMapSwitches, in setup
 * @param {() => Promise<?string>} options.gmsBase from useGmsBase, in setup
 * @param {() => ?{lat: number, lng: number}} [options.viewpoint] where the map looks
 * @param {() => ?string} [options.language] the wallet's language
 * @returns {{search: (options: {query: string}) => Promise<object[]>}}
 */
export function makeGeoProvider({ mapSwitches, gmsBase, viewpoint, language }) {
  const gms = new GeoIndexProvider({ base: gmsBase, viewpoint, language })
  const osm = new OpenStreetMapProvider()
  return {
    async search(options) {
      const { geoProvider } = await mapSwitches()
      return geoProvider === GEO_PROVIDER.GMS ? gms.search(options) : osm.search(options)
    },
  }
}
