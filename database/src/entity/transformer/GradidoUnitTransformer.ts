import { GradidoUnit } from 'shared'
import { ValueTransformer } from 'typeorm'

export const GradidoUnitTransformer: ValueTransformer = {
  /**
   * Used to marshal Decimal when writing to the database.
   */
  to: (gdd: GradidoUnit | null): string | null => (gdd ? gdd.toString(4) : null),

  /**
   * Used to unmarshal Decimal when reading from the database.
   */
  from: (gdd: string | null): GradidoUnit | null => (gdd ? GradidoUnit.fromString(gdd) : null),
}
