// AI-GENERATED — not an architecture reference
import { d, n, t } from '@/i18n'

export type FigureRow = {
  key: string
  since: number | null
  week: number | null
  total: number | null
}
export type Figures = { since: string; rows: FigureRow[] }
export type FigureSeries = { weeks: string[]; rows: { key: string; counts: number[] }[] }
export type Totals = Record<string, unknown>

/** A row as a table shows it: its label and its cells, written out. */
export type ShownRow = { key: string; label: string; cells: string[] }
export type ShownGroup = { key: string; label: string; rows: ShownRow[] }
export type WeekColumn = { day: string; date: string; running: boolean }

/** A day as the date field holds it, YYYY-MM-DD; anything else asks nothing. */
export const isDay = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

/** The day of `date` where the admin sits. */
export const dayOf = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')

// a column a figure does not have comes as null
const shown = (value: unknown) => (value === null || value === undefined ? '–' : n(value as number))
// the sums of the totals come as GradidoUnit, a decimal string: two places
const shownGdd = (value: unknown) =>
  value === null || value === undefined ? '–' : n(Number(value), 'decimal')

// The groups of the page and the rows of each, [key, label key], in its order: for the table and
// its weeks alike.
const FIGURE_GROUPS: [string, string[]][] = [
  [
    'accounts',
    [
      'accountsNew',
      'accountsViaTableCode',
      'accountsViaLink',
      'accountsViaAddress',
      'accountsViaEvent',
      'hostsWithGuest',
      'codesShown',
      'returners',
      'activeAccounts',
      'accountsDeleted',
      'accountsTotal',
    ],
  ],
  ['firstCreation', ['firstCreationsDone', 'firstCreationsSkipped', 'firstCreationsReview']],
  [
    'thanks',
    [
      'transfersSent',
      'gddSent',
      'firstSenders',
      'transfersWithPicture',
      'thanksAnswered',
      'thanksPassedOn',
      'creationsBooked',
      'gddCreated',
    ],
  ],
  [
    'greetings',
    [
      'greetingsSent',
      'greetingsWithPhoto',
      'greetingsAccepted',
      'greetingsWithAccount',
      'greetingsExpired',
    ],
  ],
  [
    'map',
    [
      'homesSet',
      'findableOnMap',
      'entriesInterest',
      'entriesOffer',
      'entriesNeed',
      'entriesActive',
      'membersWithEntry',
      'membersOnMap',
    ],
  ],
  ['conversations', ['conversationsNew', 'groupsNew', 'hellosFromMap', 'videoRoomsCreated']],
]

const TOTALS: [string, (value: unknown) => string][] = [
  ['totalGradidoCreated', shownGdd],
  ['totalGradidoDecayed', shownGdd],
  ['totalGradidoAvailable', shownGdd],
  ['totalGradidoUnbookedDecayed', shownGdd],
  ['activeUsers', shown],
]

// The groups in their order, each with the rows `cellsOf` has cells for; a row the answer does
// not have stands not, and nor does a group none of whose rows came.
const groupsOf = (cellsOf: (key: string) => string[] | null, labelOf = (key: string) => key) =>
  FIGURE_GROUPS.map(([key, rows]) => ({
    key,
    label: t(`figures.group.${key}`),
    rows: rows.flatMap((row) => {
      const cells = cellsOf(row)
      return cells ? [{ key: row, label: t(`figures.row.${labelOf(row)}`), cells }] : []
    }),
  })).filter((group) => group.rows.length > 0)

/**
 * The first table: the figures in their groups -- a row of a newer server, waiting for its label
 * here, is left out --, and below them the totals once they are there. The totals stand in the
 * column "total" only: they have no day to count from.
 */
export const figureGroups = (figures: Figures, totals: Totals | null): ShownGroup[] => {
  const byKey = new Map(figures.rows.map((row) => [row.key, row]))
  const groups = groupsOf((key) => {
    const row = byKey.get(key)
    return row ? [row.since, row.week, row.total].map(shown) : null
  })
  return totals
    ? [
        ...groups,
        {
          key: 'totals',
          label: t('figures.group.totals'),
          rows: TOTALS.map(([key, format]) => ({
            key,
            label: t(`figures.row.${key}`),
            cells: ['–', '–', format(totals[key])],
          })),
        },
      ]
    : groups
}

/**
 * The weeks' table: the groups with a number for every week. By week the active accounts are the
 * accounts with a sign-in that week, not of thirty days, and their label says so.
 */
export const weekGroups = (series: FigureSeries): ShownGroup[] => {
  const countsOf = new Map(series.rows.map((row) => [row.key, row.counts]))
  return groupsOf(
    (key) => countsOf.get(key)?.map(shown) ?? null,
    (key) => (key === 'activeAccounts' ? 'activeAccountsWeekly' : key),
  )
}

/**
 * The weeks as their table heads them: each Monday on the day it names wherever the admin sits --
 * the server gives it as 00:00 UTC, west of Greenwich still the Sunday before. The last week is
 * the running one.
 */
export const weekColumns = (weeks: string[]): WeekColumn[] =>
  weeks.map((week, index) => {
    const day = week.slice(0, 10)
    return { day, date: d(new Date(`${day}T12:00:00`)), running: index === weeks.length - 1 }
  })

// the groups of a table as lines: a blank line, the group's label, then its rows
const groupsAsLines = (groups: ShownGroup[]) =>
  groups.flatMap((group) => [
    '',
    group.label,
    ...group.rows.map((row) => `${row.label}: ${row.cells.join(' · ')}`),
  ])

/**
 * The tables as plain text, for the review in the weekly mail: a title with today's date, the heads
 * of the columns, each group and row in the table's order; below, where they are shown, the weeks.
 */
export const figuresAsText = (
  sinceHeading: string,
  groups: ShownGroup[],
  weeks: { columns: WeekColumn[]; groups: ShownGroup[] } | null,
) => {
  const lines = [
    `${t('figures.title')} · ${d(new Date())}`,
    [sinceHeading, t('figures.col.week'), t('figures.col.total')].join(' · '),
    ...groupsAsLines(groups),
  ]
  if (weeks) {
    lines.push(
      '',
      t('figures.weeks'),
      weeks.columns
        .map(({ date, running }) => (running ? `${date} (${t('figures.weekCurrent')})` : date))
        .join(' · '),
      ...groupsAsLines(weeks.groups),
    )
  }
  return lines.join('\n')
}
