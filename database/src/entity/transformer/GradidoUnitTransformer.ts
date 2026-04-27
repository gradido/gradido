import { GradidoUnit } from 'shared'
import { ValueTransformer } from 'typeorm'

export const GradidoUnitTransformer: ValueTransformer = {
  /**
   * Used to marshal GradidoUnit when writing to the database.
   */
  to: (gdd: GradidoUnit | null | string): bigint | null => {
    return gdd
      ? typeof gdd === 'string'
        ? GradidoUnit.fromString(gdd).gddCent
        : gdd.gddCent
      : null
  },

  /**
   * Used to unmarshal GradidoUnit when reading from the database.
   */
  from: (gdd: bigint | GradidoUnit | null): GradidoUnit | null => {
    if (!gdd) {
      return null
    } else if (gdd instanceof GradidoUnit) {
      return gdd
    } else {
      return GradidoUnit.fromGradidoCent(BigInt(gdd))
    }
  },
}
