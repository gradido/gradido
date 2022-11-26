import Decimal from 'decimal.js-light'
import i18n from 'i18n'

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

export const decimalSeparatorByLanguage = (a: Decimal, language: string): string => {
  const rememberLocaleToRestore = i18n.getLocale()
  i18n.setLocale(language)
  const result = a.toFixed(2).replace('.', i18n.__('general.decimalSeparator'))
  i18n.setLocale(rememberLocaleToRestore)
  return result
}
