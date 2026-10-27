// AI-GENERATED — not an architecture reference
import { count, gte, SQL, sql } from 'drizzle-orm'
import { MySqlColumn } from 'drizzle-orm/mysql-core'

// The pieces the counts of the admin's start page (CommunityFiguresResolver) are built from:
// sums, never who. Each count is asked for several moments at once and answers with one number
// per moment, in the order given; `null` counts everything of its kind. One statement per count,
// however many columns the page shows of it.
//
// Not a table of its own: every count lives with the table it selects from, and takes these
// from here. Not exported from the package either, but for the type of a weekly answer.

/** The fields of one select, one per moment: `n0`, `n1`, … */
export function countFields<T>(
  froms: (Date | null)[],
  countFrom: (from: Date | null) => SQL<T>,
): Record<string, SQL<T>> {
  if (froms.length === 0) {
    throw new Error('a count needs at least one moment to count from')
  }
  return Object.fromEntries(froms.map((from, index) => [`n${index}`, countFrom(from)]))
}

/** The numbers of a select built by countFields, in the order of its moments; 0 where none came. */
export const countsOfRow = (
  row: Record<string, number | null> | undefined,
  froms: (Date | null)[],
): number[] => froms.map((_, index) => row?.[`n${index}`] ?? 0)

/** The rows whose moment (`column`) lies at or after one moment on; every row for `null`. */
export const rowsFrom =
  (column: MySqlColumn) =>
  (from: Date | null): SQL<number> =>
    from === null ? count() : count(sql`case when ${gte(column, from)} then 1 end`)

/**
 * Of the rows rowsFrom counts, the ones a condition holds for as well; every such row for `null`.
 * The condition is asked of each row in the same statement -- an `exists` on another table.
 */
export const rowsFromWhere =
  (column: MySqlColumn, condition: SQL) =>
  (from: Date | null): SQL<number> =>
    count(
      sql`case when ${from === null ? condition : sql`${gte(column, from)} and ${condition}`} then 1 end`,
    )

/**
 * A moment the statement derives rather than reads -- the first of several rows, `min()` in a
 * derived table -- at or after `from`. A derived value has no column type: `from` is put into the
 * form of the column the moment is derived from, as a comparison with that column would put it.
 */
export const derivedAtOrAfter = (
  moment: SQL.Aliased<Date>,
  derivedFrom: MySqlColumn,
  from: Date,
): SQL => gte(moment, sql.param(from, derivedFrom))

/** rowsFrom for a derived moment (derivedAtOrAfter); every row for `null`. */
export const derivedRowsFrom =
  (moment: SQL.Aliased<Date>, derivedFrom: MySqlColumn) =>
  (from: Date | null): SQL<number> =>
    from === null
      ? count()
      : count(sql`case when ${derivedAtOrAfter(moment, derivedFrom, from)} then 1 end`)

// The same counts by calendar week, for the series below the table: one statement per count,
// grouped by the week a row lies in. A week without a row is not in the answer; the caller lays
// the answer on its weeks.

/** One week of a count: the Monday it begins with, as a day (YYYY-MM-DD), and its number. */
export type WeeklyCount = { weekStart: string; n: number }

/**
 * The Monday of the week a row's moment (`column`) lies in, as a day: YYYY-MM-DD. A week runs from
 * Monday to Sunday (`weekday()` counts Monday as 0, as an ISO week does), on the clock the moment
 * is stored with: `date()` and `weekday()` read a DATETIME as it stands. That clock is UTC as long
 * as both writers keep it: the backend, which runs with TZ=UTC, and the database, whose
 * `current_timestamp` fills most of the counted columns in the time zone of its host -- set up in
 * UTC (deployment/bare_metal/setup.md). A day rather than a YEARWEEK number, which would have to
 * be turned back into its Monday. A moment the statement derives (derivedRowsFrom) lies in its
 * week the same way.
 */
export const weekStartOf = (column: MySqlColumn | SQL.Aliased<Date>): SQL<string> =>
  sql<string>`date_format(date_sub(date(${column}), interval weekday(${column}) day), '%Y-%m-%d')`
