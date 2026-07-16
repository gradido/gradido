import { differenceInDays, differenceInMonths, differenceInYears } from 'date-fns'

// Bucket a registration date into a coarse "how long a member" tenure, so the modal can
// show "seit drei Wochen" instead of an absolute date - easier to grasp at a glance, and
// it avoids mixing up the year on similar day-dates. Returns { unit, count } with unit in
// today | days | weeks | months | years, or null for a missing/invalid date.
export function tenureBucket(created, now = new Date()) {
  if (!created) {
    return null
  }
  const start = created instanceof Date ? created : new Date(created)
  if (Number.isNaN(start.getTime())) {
    return null
  }
  const days = differenceInDays(now, start)
  if (days <= 0) {
    return { unit: 'today', count: 0 }
  }
  if (days < 7) {
    return { unit: 'days', count: days }
  }
  const months = differenceInMonths(now, start)
  if (months < 1) {
    return { unit: 'weeks', count: Math.round(days / 7) }
  }
  if (months < 12) {
    return { unit: 'months', count: months }
  }
  return { unit: 'years', count: differenceInYears(now, start) }
}
