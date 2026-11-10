// AI-GENERATED — not an architecture reference

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const MONTH = 30 * DAY
const YEAR = 365 * DAY

/**
 * How long before `now` `date` was, in the largest unit that fits, for Intl.RelativeTimeFormat.
 * At least a second: a server's clock may run a little ahead, and "in 5 seconds" says nothing
 * true about the past.
 */
export const timeAgo = (date: Date, now: Date): [number, Intl.RelativeTimeFormatUnit] => {
  const seconds = Math.max(1, Math.round((now.getTime() - date.getTime()) / 1000))
  if (seconds < MINUTE) {
    return [-seconds, 'second']
  }
  if (seconds < HOUR) {
    return [-Math.round(seconds / MINUTE), 'minute']
  }
  if (seconds < DAY) {
    return [-Math.round(seconds / HOUR), 'hour']
  }
  if (seconds < MONTH) {
    return [-Math.round(seconds / DAY), 'day']
  }
  if (seconds < YEAR) {
    return [-Math.round(seconds / MONTH), 'month']
  }
  return [-Math.round(seconds / YEAR), 'year']
}
