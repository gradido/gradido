// AI-GENERATED — not an architecture reference
import { OpenStreetMapProvider } from 'leaflet-geosearch'
import { GEO_PROVIDER } from '@/composables/useMapSwitches'
import { searchPlaces } from '@/utils/geoSearch'

/**
 * The GMS address search - the port of the GMS dashboard's `GeoIndexProvider`
 * (gms_workspace, frontend/src/services/geoIndexProvider.ts).
 *
 * Where the map looks and which language the wallet reads are functions, read at the moment
 * of the search: the provider lives as long as the page does, and the view and the language
 * move under it. The base is one too, because the wallet learns it asynchronously.
 *
 * Until 16.09.2026 this was a leaflet-geosearch provider, because leaflet-geosearch's control
 * asked it. The wallet's own field (components/Matching/GeoSearchField) asks it now, in the
 * wallet's own shape - the one `searchPlaces` already answers in.
 */
export class GeoIndexProvider {
  constructor({ base, viewpoint = () => null, language = () => null }) {
    this.base = base
    this.viewpoint = viewpoint
    this.language = language
  }

  async search({ query }) {
    return searchPlaces(await this.base(), query, {
      near: this.viewpoint(),
      language: this.language(),
    })
  }
}

/**
 * The place search the admin switch names (K-008), for every place the wallet searches
 * from: the big map's field, the list's field and the one on the home map.
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
 * @returns {{search: (options: {query: string}) => Promise<{lat: number, lng: number, label: string}[]>}}
 */
export function makeGeoProvider({ mapSwitches, gmsBase, viewpoint, language }) {
  const gms = new GeoIndexProvider({ base: gmsBase, viewpoint, language })
  const osm = new OpenStreetMapProvider()
  return {
    async search({ query }) {
      const { geoProvider } = await mapSwitches()
      if (geoProvider === GEO_PROVIDER.GMS) return gms.search({ query })
      // leaflet-geosearch answers in its own shape: x is the longitude, y the latitude.
      // Turned here, so both positions hand the field the same thing and the field never
      // has to know which service answered.
      const found = await osm.search({ query })
      return found.map(({ x, y, label, raw }) => ({ lat: y, lng: x, label, raw }))
    },
  }
}
