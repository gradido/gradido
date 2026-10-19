// AI-GENERATED — not an architecture reference
import { count, gte, SQL, sql } from 'drizzle-orm'
import { MySqlColumn } from 'drizzle-orm/mysql-core'

// The pieces the counts of the admin's start page (CommunityFiguresResolver) are built from:
// sums, never who. Each count is asked for several moments at once and answers with one number
// per moment, in the order given; `null` counts everything of its kind. One statement per count,
// however many columns the page shows of it.
//
// Not a table of its own: every count lives with the table it selects from, and takes these
// from here. Not exported from the package either.

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
