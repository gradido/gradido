import { Decimal } from 'decimal.js-light'
import i18n from 'i18n'

export const objectValuesToArray = (obj: Record<string, string>): string[] =>
  // eslint-disable-next-line security/detect-object-injection
  Object.keys(obj).map((key) => obj[key])

export const decimalSeparatorByLanguage = (a: Decimal, language: string): string => {
  const rememberLocaleToRestore = i18n.getLocale()
  i18n.setLocale(language)
  const result = a.toFixed(2).replace('.', i18n.__('general.decimalSeparator'))
  i18n.setLocale(rememberLocaleToRestore)
  return result
}

export const fullName = (firstName: string, lastName: string): string =>
  [firstName, lastName].filter(Boolean).join(' ')

export function stringToHex(str: string): string {
  return str
    .split('')
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
}
