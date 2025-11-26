import { Decimal } from 'decimal.js-light'
import i18n from 'i18n'
import { promisify } from 'util'

export const objectValuesToArray = (obj: Record<string, string>): string[] =>
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

export function resetInterface<T extends Record<string, any>>(obj: T): T {
  // Iterate over all properties of the object
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      // Set all optional properties to undefined

      obj[key] = undefined as T[Extract<keyof T, string>]
    }
  }
  return obj
}

export const delay = promisify(setTimeout)

export const ensureUrlEndsWithSlash = (url: string): string => {
  return url.endsWith('/') ? url : url.concat('/')
}
export function splitUrlInEndPointAndApiVersion(url: string): {
  endPoint: string
  apiVersion: string
} {
  const endPoint = url.slice(0, url.lastIndexOf('/') + 1)
  const apiVersion = url.slice(url.lastIndexOf('/') + 1, url.length)
  return { endPoint, apiVersion }
}
/**
 * Calculates the date representing the first day of the month, a specified number of months prior to a given date.
 *
 * This function was created to address an issue with using `Date.prototype.setMonth`.
 * When calculating previous months, `setMonth` can produce incorrect results at the end of months.
 * For example, subtracting 3 months from May 31st using `setMonth` would result in March instead of February.
 * This function ensures the correct month is calculated by setting the day to the 1st before performing the month subtraction.
 *
 * @param {Date} startDate - The starting date from which to calculate the previous months.
 * @param {number} monthsAgo - The number of months to go back from the startDate.
 * @returns {Date} A new Date object set to the first day of the month, `monthsAgo` months before the `startDate`.
 *
 * @example
 * // Calculate the date for the first day of the month, 3 months prior to March 15, 2024
 * const date = getFirstDayOfPreviousNMonth(new Date(2024, 4, 31), 3);
 * console.log(date); // Output: Fri Feb 01 2024 00:00:00 GMT+0000 (Coordinated Universal Time)
 */
export const getFirstDayOfPreviousNMonth = (startDate: Date, monthsAgo: number): Date =>
  new Date(startDate.getFullYear(), startDate.getMonth() - monthsAgo, 1)
