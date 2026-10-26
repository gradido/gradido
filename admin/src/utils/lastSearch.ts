// AI-GENERATED — not an architecture reference

/**
 * The last search of the user search and of the creation page, and the tab the creation page
 * was left on, kept on this device for each moderator, without end: the page opens with them,
 * however and whenever it is opened -- on the way back from the wallet, in the app on a phone
 * that loads the page anew, or weeks later (Bernd, 26.10.2026: "Die Speicherung ist auf
 * unbegrenzte Zeit. Das heißt, egal, was dazwischen nun geschieht [...]: Die letzte Auswahl ist
 * gespeichert."; the tab: "merk Dir auch den Reiter, so wie die Suche"). A kept search that finds
 * nothing any more gives way to the whole list (the pages).
 *
 * In localStorage, where the dark mode is kept as well. Each moderator keeps their own: one
 * browser is routinely used by more than one, and a search names a member.
 */
const KEY = 'gradido-admin-last-search'

type Kept = Record<string, Record<string, unknown> | undefined>

const readKept = (): Kept => {
  try {
    const kept = JSON.parse(window.localStorage.getItem(KEY) ?? 'null')
    return kept !== null && typeof kept === 'object' && !Array.isArray(kept) ? kept : {}
  } catch {
    // Private mode, or something that is no JSON.
    return {}
  }
}

const keptFor = (moderator: string | undefined, entry: string): unknown =>
  moderator ? readKept()[moderator]?.[entry] : undefined

/** Keeps `value` under `entry` for this moderator; an empty one, or none, is no entry. */
const keepFor = (moderator: string | undefined, entry: string, value: string | number | null) => {
  if (!moderator) {
    return
  }
  const kept = readKept()
  const theirs: Record<string, unknown> = Object.fromEntries(
    Object.entries(kept[moderator] ?? {}).filter(([keptEntry]) => keptEntry !== entry),
  )
  if (value !== null && value !== '') {
    theirs[entry] = value
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...kept, [moderator]: theirs }))
  } catch {
    // A storage that keeps nothing: the page opens as it always did.
  }
}

/** The last search of `page` for this moderator, or '' where none is kept. */
export const lastSearch = (page: string, moderator: string | undefined): string => {
  const search = keptFor(moderator, page)
  return typeof search === 'string' ? search : ''
}

/** Keeps `search` as the last search of `page` for this moderator. An empty one is none. */
export const keepLastSearch = (page: string, moderator: string | undefined, search: string) =>
  keepFor(moderator, page, search)

/** The tab of `page` this moderator left it on, as its index among `tabs`; else the first. */
export const lastTab = (page: string, moderator: string | undefined, tabs: number): number => {
  const tab = keptFor(moderator, `${page}#tab`)
  return typeof tab === 'number' && Number.isInteger(tab) && tab > 0 && tab < tabs ? tab : 0
}

/** Keeps the tab of `page` for this moderator. The first one is none. */
export const keepLastTab = (page: string, moderator: string | undefined, tab: number) =>
  keepFor(moderator, `${page}#tab`, tab > 0 ? tab : null)
