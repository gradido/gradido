import { customType } from 'drizzle-orm/mysql-core'
import { GradidoUnit } from 'shared'

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
