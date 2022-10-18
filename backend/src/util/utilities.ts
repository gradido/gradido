import Decimal from 'decimal.js-light'

export const objectValuesToArray = (obj: { [x: string]: string }): Array<string> => {
  return Object.keys(obj).map(function (key) {
    return obj[key]
  })
}

// to improve code readability, as String is needed, it is handled inside this utility function
export const decimalAddition = (a: Decimal, b: Decimal): Decimal => {
  return a.add(b.toString())
}

// to improve code readability, as String is needed, it is handled inside this utility function
export const decimalSubtraction = (a: Decimal, b: Decimal): Decimal => {
  return a.minus(b.toString())
}
