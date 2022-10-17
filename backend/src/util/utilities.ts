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
