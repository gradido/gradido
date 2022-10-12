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
    type Expect = CustomMatchers
    type Matchers<R> = CustomMatchers<R>
    type InverseAsymmetricMatchers = CustomMatchers
  }
}
