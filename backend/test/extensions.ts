/* eslint-disable @typescript-eslint/no-empty-interface */

import Decimal from 'decimal.js-light'

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
})

interface CustomMatchers<R = unknown> {
  decimalEqual(value: number): R
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}
