// AI-GENERATED — not an architecture reference

/** A contribution as adminListContributionsShort lists it. */
export const contribution = (id: number, more: Record<string, unknown> = {}) => ({
  id,
  amount: '100',
  memo: `Memo of contribution ${id}`,
  createdAt: '2026-10-05T09:00:00.000Z',
  contributionDate: '2026-09-01T00:00:00.000Z',
  confirmedAt: '2026-10-06T09:00:00.000Z',
  contributionStatus: 'CONFIRMED',
  ...more,
})

/** A transaction link as listTransactionLinksAdmin lists it. */
export const transactionLink = (id: number, more: Record<string, unknown> = {}) => ({
  id,
  amount: '50',
  holdAvailableAmount: '50',
  memo: `Memo of link ${id}`,
  code: `code${id}`,
  createdAt: '2026-10-01T09:00:00.000Z',
  validUntil: '2099-10-15T09:00:00.000Z',
  redeemedAt: null,
  deletedAt: null,
  ...more,
})
