// AI-GENERATED — not an architecture reference

/**
 * The last search of the user search and of the creation page, kept on this device for each
 * moderator, without end: the page opens with it, however and whenever it is opened -- on the
 * way back from the wallet, in the app on a phone that loads the page anew, or weeks later
 * (Bernd, 26.10.2026: "Die Speicherung ist auf unbegrenzte Zeit. Das heißt, egal, was dazwischen
 * nun geschieht [...]: Die letzte Auswahl ist gespeichert."). A kept search that finds nothing
 * any more gives way to the whole list (the pages).
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

/** The last search of `page` for this moderator, or '' where none is kept. */
export const lastSearch = (page: string, moderator: string | undefined): string => {
  if (!moderator) {
    return ''
  }
  const search = readKept()[moderator]?.[page]
  return typeof search === 'string' ? search : ''
}

/** Keeps `search` as the last search of `page` for this moderator. An empty one is none. */
export const keepLastSearch = (page: string, moderator: string | undefined, search: string) => {
  if (!moderator) {
    return
  }
  const kept = readKept()
  const theirs = Object.fromEntries(
    Object.entries(kept[moderator] ?? {}).filter(([keptPage]) => keptPage !== page),
  )
  if (search) {
    theirs[page] = search
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...kept, [moderator]: theirs }))
  } catch {
    // A storage that keeps nothing: the page opens without a search, as it always did.
  }
}
