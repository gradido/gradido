// AI-GENERATED — not an architecture reference

/** What communityFigures answers: two groups' rows, and one of a newer server without a label. */
export const communityFigures = (since: string) => ({
  since,
  rows: [
    { key: 'accountsNew', since: 3, week: 1, total: 1234 },
    { key: 'accountsViaLink', since: 2, week: null, total: 40 },
    { key: 'activeAccounts', since: 7, week: 5, total: 9 },
    { key: 'transfersSent', since: 12, week: 4, total: 5600 },
    { key: 'gddSent', since: 300, week: 100, total: 25000 },
    { key: 'futureFigure', since: 1, week: 1, total: 1 },
  ],
})

export const communityStatistics = {
  totalUsers: 1300,
  deletedUsers: 10,
  totalGradidoCreated: '1234.5',
  totalGradidoDecayed: '80.25',
  dynamicStatisticsFields: {
    activeUsers: 1100,
    totalGradidoAvailable: '1100.1',
    totalGradidoUnbookedDecayed: '3',
  },
}

/** Three weeks, the last the running one. */
export const communityFigureSeries = (since: string) => ({
  since,
  weeks: ['2026-10-26T00:00:00.000Z', '2026-11-02T00:00:00.000Z', '2026-11-09T00:00:00.000Z'],
  rows: [
    { key: 'accountsNew', counts: [1, 0, 2] },
    { key: 'activeAccounts', counts: [4, 5, 6] },
    { key: 'gddSent', counts: [10, 20, 1500] },
  ],
})
