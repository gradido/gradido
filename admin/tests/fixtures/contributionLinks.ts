// AI-GENERATED — not an architecture reference

export const contributionLink = (id: number, name: string) => ({
  id,
  amount: '200',
  name,
  memo: `Memo of ${name}`,
  code: `code${id}`,
  link: `http://localhost/redeem/CL-code${id}`,
  createdAt: '2026-10-01T10:00:00.000Z',
  validFrom: '2026-10-01T00:00:00.000Z',
  validTo: '2026-12-31T00:00:00.000Z',
  maxAmountPerMonth: '0',
  cycle: 'ONCE',
  maxPerCycle: 1,
})

export const listContributionLinks = (links: ReturnType<typeof contributionLink>[]) => ({
  links,
  count: links.length,
})
