import { type Geometry } from 'geojson'
import { ValueTransformer } from 'typeorm/decorator/options/ValueTransformer'

import { Geometry as wkx_Geometry } from 'wkx'

/**
 * TypeORM transformer to convert GeoJSON to MySQL WKT (Well Known Text) e.g. POINT(LAT, LON) and back
 */
export const GeometryTransformer: ValueTransformer = {
  to: (geojson: Geometry): string | null => {
    if (geojson) {
      const wkxg = wkx_Geometry.parseGeoJSON(geojson)
      const str = wkxg.toWkt()
      return str
    }
    return null
  },

  from: (wkb: string): Record<string, any> | null => {
    // wkb ? wkx_Geometry.parse(wkb).toGeoJSON() : undefined
    if (!wkb) {
      return null
    }
    const record = wkx_Geometry.parse(wkb)
    const str = record.toGeoJSON()
    return str
  },
}
