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

// Function to reset an interface by chatGPT
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resetInterface<T extends Record<string, any>>(obj: T): T {
  // Iterate over all properties of the object
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Set all optional properties to undefined
      // eslint-disable-next-line security/detect-object-injection
      obj[key] = undefined as T[Extract<keyof T, string>]
    }
  }
  return obj
}

export const ensureUrlEndsWithSlash = (url: string): string => {
  return url.endsWith('/') ? url : url.concat('/')
}
