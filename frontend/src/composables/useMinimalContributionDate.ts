// AI-GENERATED — not an architecture reference

/** The first day of the month before `now`: the earliest day a contribution may be dated. */
export function useMinimalContributionDate(now: Date): Date {
  const minimalDate = new Date(now)
  minimalDate.setMonth(now.getMonth() - 1, 1)
  return minimalDate
}
