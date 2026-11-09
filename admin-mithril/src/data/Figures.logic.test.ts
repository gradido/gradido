// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, setSystemTime } from 'bun:test'
import { setLocale } from '@/i18n'
import { figureGroups, figuresAsText, isDay, weekColumns, weekGroups } from './Figures.logic'

beforeEach(() => setLocale('de'))
afterEach(async () => {
  await setLocale('en')
  setSystemTime()
})

const figures = {
  since: '2026-10-11T22:00:00.000Z',
  rows: [
    { key: 'accountsNew', since: 3, week: null, total: 1234 },
    { key: 'futureFigure', since: 1, week: 1, total: 1 },
  ],
}

describe('isDay', () => {
  it('takes a day as the date field holds it, nothing else', () => {
    expect(isDay('2026-11-02')).toBe(true)
    expect(isDay('')).toBe(false)
    expect(isDay('2.11.2026')).toBe(false)
  })
})

describe('figureGroups', () => {
  it('shows the rows that came in their groups, without those of a newer server', () => {
    expect(figureGroups(figures, null)).toEqual([
      {
        key: 'accounts',
        label: 'Konten',
        rows: [{ key: 'accountsNew', label: 'Neue Konten', cells: ['3', '–', '1.234'] }],
      },
    ])
  })

  it('puts the totals in the column total, as GDD with two places', () => {
    const totals = figureGroups(figures, { totalGradidoCreated: '1234.5', activeUsers: 7 }).at(-1)
    expect(totals?.key).toBe('totals')
    expect(totals?.rows[0].cells).toEqual(['–', '–', '1.234,50'])
    expect(totals?.rows.at(-1)?.cells).toEqual(['–', '–', '7'])
  })
})

describe('weekGroups', () => {
  it('names the active accounts by week as those with a sign-in that week', () => {
    const [accounts] = weekGroups({
      weeks: [],
      rows: [{ key: 'activeAccounts', counts: [4, null] }],
    })
    expect(accounts.rows).toEqual([
      { key: 'activeAccounts', label: 'Konten mit Anmeldung je Woche', cells: ['4', '–'] },
    ])
  })
})

describe('weekColumns', () => {
  it('names each Monday by its day, the last week as the running one', () => {
    expect(weekColumns(['2026-11-02T00:00:00.000Z', '2026-11-09T00:00:00.000Z'])).toEqual([
      { day: '2026-11-02', date: '2.11.2026', running: false },
      { day: '2026-11-09', date: '9.11.2026', running: true },
    ])
  })
})

describe('figuresAsText', () => {
  it('writes the tables as lines, the weeks only where they are given', () => {
    setSystemTime(new Date('2026-11-09T12:00:00Z'))
    const groups = figureGroups(figures, null)
    expect(figuresAsText('seit 12.10.2026', groups, null)).toBe(
      [
        'Statistik · 9.11.2026',
        'seit 12.10.2026 · 7 Tage · gesamt',
        '',
        'Konten',
        'Neue Konten: 3 · – · 1.234',
      ].join('\n'),
    )
    expect(
      figuresAsText('x', groups, {
        columns: weekColumns(['2026-11-09T00:00:00.000Z']),
        groups: [],
      })
        .split('\n')
        .slice(-3),
    ).toEqual(['', 'Nach Wochen', '9.11.2026 (läuft)'])
  })
})
