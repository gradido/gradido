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
    return GradidoUnit.fromGradidoCent(value)
  },
})
