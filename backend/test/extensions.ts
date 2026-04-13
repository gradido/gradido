import { Decimal } from 'decimal.js-light'
import { GradidoUnit } from 'shared'

expect.extend({
  decimalEqual(received, value) {
    const pass = new Decimal(value).equals(received.toString())
    if (pass) {
      return {
        message: () => `expected ${received} to not equal ${value}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to equal ${value}`,
        pass: false,
      }
    }
  },
  gradidoUnitEqual(received, value) {
    let gdd: GradidoUnit | undefined = undefined
    if (typeof value === 'number') {
      gdd = GradidoUnit.fromNumber(value)
    } else if (typeof value === 'bigint') {
      gdd = new GradidoUnit(value)
    } else if (typeof value === 'string') {
      gdd = GradidoUnit.fromString(value)
    } else if (value instanceof Decimal) {
      gdd = GradidoUnit.fromDecimal(value)
    } else if (value instanceof GradidoUnit) {
      gdd = value
    } else {
      return {
        message: () => `expected ${value} to be either a number, string, bigint, decimal or GradidoUnit`,
        pass: false,
      }
    }
    const pass = gdd.gddCent === received
    if (pass) {
      return {
        message: () => `expected ${received} to not equal ${value} GradidoUnit`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to equal ${value} GradidoUnit`,
        pass: false,
      }
    }
  },
})

interface CustomMatchers<R = unknown> {
  decimalEqual(value: number): R
  gradidoUnitEqual(value: number | string | bigint | Decimal | GradidoUnit): R
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}
