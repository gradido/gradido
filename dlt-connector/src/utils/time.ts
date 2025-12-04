import { promisify } from 'node:util'

/**
 * @param {number} time - in minutes
 */
export const getTimeDurationObject = (
  time: number,
): {
  hours?: number
  minutes: number
} => {
  if (time > 60) {
    return {
      hours: Math.floor(time / 60),
      minutes: time % 60,
    }
  }
  return { minutes: time }
}

/**
 * @param startDate
 * @param endDate
 * @returns duration in minutes
 */
export const durationInMinutesFromDates = (startDate: Date, endDate: Date): number => {
  const diff = endDate.getTime() - startDate.getTime()
  return Math.floor(diff / (1000 * 60))
}

/**
 * @param duration in minutes
 */
export const printTimeDuration = (duration: number): string => {
  const time = getTimeDurationObject(duration)
  const result = time.minutes > 0 ? `${time.minutes} minutes` : ''
  if (time.hours) {
    return `${time.hours} hours` + (result !== '' ? ` and ${result}` : '')
  }
  if (result === '') {
    return '0 minutes'
  }
  return result
}

export const delay = promisify(setTimeout)
