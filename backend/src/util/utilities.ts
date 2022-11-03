import Decimal from 'decimal.js-light'

export const objectValuesToArray = (obj: { [x: string]: string }): Array<string> => {
  return Object.keys(obj).map(function (key) {
    return obj[key]
  })
}

export function dateCompare(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate())
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate())
  if (d1 > d2) {
    return 1
  } else if (d1 < d2) {
    return -1
  } else {
    return 0
  }
}

// to improve code readability, as String is needed, it is handled inside this utility function
export const decimalAddition = (a: Decimal, b: Decimal): Decimal => {
  return a.add(b.toString())
}

// to improve code readability, as String is needed, it is handled inside this utility function
export const decimalSubtraction = (a: Decimal, b: Decimal): Decimal => {
  return a.minus(b.toString())
}

export function cutOffsetFromIsoDateString(dateString: string): string {
  if (dateString.indexOf('Z', 0) > 0) {
    return dateString.slice(0, dateString.indexOf('Z', 0) + 1)
  }
  return dateString.slice(0, 23) + 'Z' // 2022-10-26T12:23:45.616Z =: 0123-56-89T12:45:78.212Z =: Index 0-23, 24 Zeichen
}

// eslint-disable-next-line camelcase
export function getDateAs_YYYYMMDD_String(_date: Date | undefined): string {
  // console.log(`getDateAs_YYYYMMDD_String(${_date})`)
  const objectDate = _date || new Date()
  let dayStr, monthStr
  const day = objectDate.getDate()
  if (day < 10) {
    dayStr = '0' + day
  } else {
    dayStr = day
  }

  const month = objectDate.getMonth() + 1
  if (month < 10) {
    monthStr = '0' + month
  } else {
    monthStr = month
  }

  const year = objectDate.getFullYear()
  // console.log('return=' + year + '-' + monthStr + '-' + dayStr)
  return year + '-' + monthStr + '-' + dayStr
}

// eslint-disable-next-line camelcase
export function getIsoDateStringAs_YYYYMMDD_String(_date: string): string {
  // console.log(`getIsoDateStringAs_YYYYMMDD_String(${_date}) = ${_date.slice(0, 10)}`)
  return _date.slice(0, 10) // YYYY-MM-DDT
}

export function isValidDate(dateObject: string): boolean {
  return new Date(dateObject).toString() !== 'Invalid Date'
}

export function getMonthDifference(startDate: Date, endDate: Date): number {
  return (
    endDate.getMonth() -
    startDate.getMonth() +
    12 * (endDate.getFullYear() - startDate.getFullYear())
  )
}
