export function useMinimalContributionDate(now) {
  const minimalDate = new Date(now)
  minimalDate.setMonth(now.getMonth() - 1, 1)
  return minimalDate
}
