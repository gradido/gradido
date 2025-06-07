import { Decimal } from 'decimal.js-light'
import { ValueTransformer } from 'typeorm'

Decimal.set({
  precision: 25,
  rounding: Decimal.ROUND_HALF_UP,
})

export const DecimalTransformer: ValueTransformer = {
  /**
   * Used to marshal Decimal when writing to the database.
   */
  to: (decimal: Decimal | null): string | null => (decimal ? decimal.toString() : null),

  /**
   * Used to unmarshal Decimal when reading from the database.
   */
  from: (decimal: string | null): Decimal | null => (decimal ? new Decimal(decimal) : null),
}
