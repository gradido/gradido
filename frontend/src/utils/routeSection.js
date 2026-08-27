// AI-GENERATED — not an architecture reference

/**
 * Which section of the wallet a path belongs to: its first segment.
 *
 * `/contributions/contribute` and `/matching/entries` are the same section as their roots,
 * and that is how both the header above the page and the column beside it decide what to
 * show.
 *
 * ⛔ One home, because there were three copies of this line and they had already drifted.
 * `RightSide` and `ContentHeader` each carried `path.replace(/^\/(.+?)(\/.+)?$/, '$1')` --
 * a pattern that needs a character AFTER the slash, so a trailing slash was read as part of
 * the section: `/overview/` answered `overview/` and matched nothing. A router really hands
 * that path over; `/overview/` matches the `/overview` record.
 *
 * It could hide for as long as it did because a missed section fell through to a harmless
 * default in both places. The moment the booking list stopped being that default
 * (27.08.2026) the first effect would have been the overview losing its own column -- and
 * in the header it is the balance row that disappears.
 *
 * ⚠️ Reads the first segment rather than stripping the rest, so nothing depends on what
 * comes after it. An empty path, a bare `/`, null and undefined all answer `''`.
 *
 * @param {string} path  the current route path
 * @returns {string} the first path segment, `''` where the path names no section
 */
export const routeSection = (path) => String(path ?? '').match(/^\/([^/]+)/)?.[1] ?? ''
