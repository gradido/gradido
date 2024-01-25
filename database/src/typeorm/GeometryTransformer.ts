/* eslint-disable camelcase */
import { Geometry as wkx_Geometry } from 'wkx'
import { Geometry } from 'geojson'
import { ValueTransformer } from 'typeorm/decorator/options/ValueTransformer'

/**
 * TypeORM transformer to convert GeoJSON to MySQL WKT (Well Known Text) e.g. POINT(LAT, LON) and back
 */
export const GeometryTransformer: ValueTransformer = {
  to: (geojson: Geometry): string | null => {
    console.log('GeometryTransformer to: geojson=', geojson)
    if (geojson) {
      const wkxg = wkx_Geometry.parseGeoJSON(geojson)
      console.log('GeometryTransformer to: wkxg=', wkxg)
      const str = wkxg.toWkt()
      console.log('GeometryTransformer to: str=', str)
      return str
    }
    return null
  },

  from: (wkb: string): Record<string, any> | null => {
    // wkb ? wkx_Geometry.parse(wkb).toGeoJSON() : undefined
    console.log('GeometryTransformer from: wbk=', wkb)
    if (!wkb) {
      return null
    }
    const record = wkx_Geometry.parse(wkb)
    console.log('GeometryTransformer from: record=', record)
    const str = record.toGeoJSON()
    console.log('GeometryTransformer from: str=', str)
    return str
  },
}
