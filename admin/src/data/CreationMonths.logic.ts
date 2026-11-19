// AI-GENERATED — not an architecture reference
import { d } from '@/i18n'

/**
 * The three months a member can still be credited for, the oldest first: the first days of the
 * two months before, and `now` -- in the order of the amounts searchUsers delivers (`creation`).
 */
export const creationDates = (now = new Date()) => [
  new Date(now.getFullYear(), now.getMonth() - 2, 1),
  new Date(now.getFullYear(), now.getMonth() - 1, 1),
  now,
]

/** Their short names, as the member search heads its column of the amounts. */
export const creationMonthShorts = (now = new Date()) =>
  creationDates(now).map((date) => d(date, 'monthShort'))

/**
 * The months as the creation form offers them: its name, its year, and the day the server is told
 * -- the first of the month, today for this one -- written as the old admin wrote it, numeric in
 * English (`11/9/2026`).
 */
export const creationMonths = (now = new Date()) =>
  creationDates(now).map((date) => ({
    month: d(date, 'month'),
    year: d(date, 'year'),
    date: d(date, 'short', 'en'),
  }))
