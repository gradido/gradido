import { sql } from 'drizzle-orm'
import { customType, MySqlVarbinaryOptions } from 'drizzle-orm/mysql-core'
import { type Geometry } from 'geojson'
import { GradidoUnit, locationPointSchema } from 'shared'
import { Geometry as WkxGeometry } from 'wkx'

export const customGradidoUnit = customType<{ data: GradidoUnit; driverData: bigint }>({
  dataType() {
    return 'bigint'
  },
  toDriver(value: GradidoUnit): bigint {
    return value.gddCent
  },
  fromDriver(value: bigint): GradidoUnit {
    return GradidoUnit.fromGradidoCent(BigInt(value))
  },
})

// drizzle's mysql-core ships binary and varbinary but no blob variants, so the one
// column that stores raw image bytes brings its own type. Data and driverData are both
// Buffer — nothing is converted, the type only tells drizzle what DDL to emit.
export const customMediumBlob = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'mediumblob'
  },
})

// What mysql2 makes of a POINT before drizzle ever sees the column.
type DriverPoint = { x: number; y: number }

/**
 * `users.location` and `communities.location` hold a MySQL POINT; everything above the
 * database speaks GeoJSON. The conversion is the one the TypeORM entities already do
 * through `GeometryTransformer` -- wkx in both directions -- but BOTH ends need more than
 * that transformer did, because TypeORM's mysql driver rewrote the SQL around a spatial
 * column and Drizzle does not:
 *
 * - Writing: a WKT string handed to a geometry column is refused outright ("Cannot get
 *   geometry object from data you send to the GEOMETRY field"). TypeORM wrapped the
 *   parameter in ST_GeomFromText() itself, so the transformer could return plain text;
 *   here the custom type has to emit that call. A point without coordinates -- what
 *   Location2Point writes for "no position" -- comes out of wkx as `POINT EMPTY`, which
 *   MariaDB accepts and stores as NULL: the same "unset" the column holds for everyone
 *   who never set a pin.
 * - Reading: mysql2 parses a geometry column before anyone sees it and hands over
 *   `{ x, y }` for a point -- never WKT, never WKB. TypeORM got text because it selected
 *   ST_AsText(); wkx refuses the object with "first argument must be a string or Buffer",
 *   and that refusal reached the login, which reads the whole `users` row: every member
 *   who had ever saved a position was answered with an exception instead of a session.
 *   So the driver's object is the case that actually occurs and is converted here; string
 *   and Buffer stay handled for whoever selects ST_AsText() or turns the parser off.
 *
 * Only points are stored in this house -- a member's position and a community's. The
 * driver hands a line or a polygon over as nested arrays with the geometry type lost, so
 * one is refused rather than guessed at.
 */
const isDriverPoint = (value: unknown): value is DriverPoint =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as DriverPoint).x === 'number' &&
  typeof (value as DriverPoint).y === 'number'

export const customGeometry = customType<{
  data: Geometry | null
  driverData: string | Buffer | DriverPoint | null
  notNull: false
  hasDefault: true
}>({
  dataType() {
    return 'geometry'
  },

  toDriver(value) {
    if (!value) {
      return null
    }

    return sql`ST_GeomFromText(${WkxGeometry.parseGeoJSON(value).toWkt()})`
  },

  fromDriver(value) {
    if (!value) {
      return null
    }
    
    if (isDriverPoint(value)) {
      return { type: 'Point', coordinates: [value.x, value.y] }
    }
    if (typeof value !== 'string' && !Buffer.isBuffer(value)) {
      throw new Error('geometry: the driver answered with something other than a point')
    }

    return WkxGeometry.parse(value).toGeoJSON() as Geometry
  },
})

export const customVarbinary = <T extends Buffer = Buffer>(
  columnName: string,
  options: Pick<MySqlVarbinaryOptions, 'length'>,
) => {
  return (
    customType<{
      data: Buffer
      driverData: Buffer
    }>({
      dataType: () => {
        return `varbinary(${options.length})`
      },
      // # WORKAROUND
      // By not implementing unnecessary conversion processes in `fromDriver` and `toDriver`, we can save and retrieve values in the DB without corruption.
      fromDriver: (value) => {
        return value
      },
      toDriver: (value) => {
        return value
      },
    })(columnName)
      // The following line is a workaround for the issue with varbinary/binary type
      // [[BUG]: MySQL2 binary/varbinary types are incorrectly typed as strings instead of buffers · Issue #1188 · drizzle-team/drizzle-orm](https://github.com/drizzle-team/drizzle-orm/issues/1188)
      .$type<T>()
  )
}

export const customBinary = <T extends Buffer = Buffer>(
  columnName: string,
  options: Pick<MySqlVarbinaryOptions, 'length'>,
) => {
  return customType<{
    data: Buffer
    driverData: Buffer
  }>({
    dataType: () => {
      return `binary(${options.length})`
    },
    fromDriver: (value) => {
      return value
    },
    toDriver: (value) => {
      return value
    },
  })(columnName).$type<T>()
}
