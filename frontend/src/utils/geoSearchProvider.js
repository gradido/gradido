// AI-GENERATED — not an architecture reference
import { searchPlaces } from '@/utils/geoSearch'

/**
 * The GMS address search - the port of the GMS dashboard's `GeoIndexProvider`
 * (gms_workspace, frontend/src/services/geoIndexProvider.ts).
 *
 * Where the map looks and which language the wallet reads are functions, read at the moment
 * of the search: the provider lives as long as the page does, and the view and the language
 * move under it. The base is one too, because the wallet learns it asynchronously.
 *
 * The wallet's own field (components/Matching/GeoSearchField) asks it, in the wallet's own
 * shape - the one `searchPlaces` already answers in.
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
 * The GMS place search, for every place the wallet searches from: the big map's field, the
 * list's field and the one on the home map.
 *
 * The GMS address is read at each search, not when the provider is made: it arrives
 * asynchronously, while the list makes its provider synchronously in setup.
 *
 * @param {object} options
 * @param {() => Promise<?string>} options.gmsBase from useGmsBase, in setup
 * @param {() => ?{lat: number, lng: number}} [options.viewpoint] where the map looks
 * @param {() => ?string} [options.language] the wallet's language
 * @returns {{search: (options: {query: string}) => Promise<{lat: number, lng: number, label: string}[]>}}
 */
export function makeGeoProvider({ gmsBase, viewpoint, language }) {
  return new GeoIndexProvider({ base: gmsBase, viewpoint, language })
}
