// AI-GENERATED — not an architecture reference

// The pictures of OTHER members, kept between visits so a booking list does not fetch the
// same faces again on every load.
//
// ⛔⛔ Deliberately NOT in the vuex store. `createPersistedState` there writes the ENTIRE
// state to localStorage on EVERY mutation, so twenty-five pictures parked in it would mean
// serialising a quarter of a megabyte each time anything in the wallet changes -- the very
// cost that fetching pictures on demand is meant to avoid, just moved somewhere less
// visible. Same reasoning as useAppOutdated, for a different reason.
//
// The freshness rule is the whole design: a booking list carries a date per member
// (User.avatarUpdatedAt), and a stored picture counts as current while its date matches.
// So nothing here ever expires on a timer and nothing goes stale -- a member who changes
// their picture invalidates exactly their own entry, for everyone, on the next list.
//
// ⚠️ A member whose picture must no longer be shown -- switch off, deleted -- comes back
// from the server with NO date at all. That is why `staleKeys` treats a missing date as an
// instruction to forget rather than as "nothing to do": the withdrawal has to reach the
// pictures already lying on this device, or turning the switch off would leave the face on
// screen until the browser storage happened to be cleared.

const STORAGE_KEY = 'gradido-avatars'

// Roughly two megabytes at the small rendition's cap. Far more than one page of bookings
// needs, and far below what makes localStorage unhappy.
const MAX_ENTRIES = 200

// ★ The retreat, if browser storage ever turns out to be a problem: set this to false.
// Everything else keeps working -- the pictures then live for one page view instead of
// across visits, which costs one extra fetch after a reload and nothing else.
const PERSIST = true

// communityUuid is nullable for members who registered before the home community had one,
// and it is part of the identity as soon as other communities arrive (AS-004), so it is in
// the key from the start rather than bolted on later.
export const memberAvatarKey = ({ communityUuid, gradidoID }) =>
  `${communityUuid ?? ''}/${gradidoID}`

// Dates arrive as whatever the transport made of them -- a Date, or the string a JSON
// round trip leaves behind. Compared as numbers so that those two forms of the same moment
// do not read as a change and refetch every picture on every load.
const asTime = (value) => {
  if (value === null || value === undefined) return null
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime()
  return Number.isNaN(time) ? null : time
}

let entries = null

const load = () => {
  if (entries) return entries
  entries = new Map()
  if (!PERSIST) return entries
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      for (const [key, entry] of Object.entries(JSON.parse(raw))) {
        entries.set(key, entry)
      }
    }
  } catch {
    // Unreadable storage is not worth a failure: the pictures are a convenience, and the
    // next fetch refills them. Starting empty is always a correct state.
    entries = new Map()
  }
  return entries
}

const save = () => {
  if (!PERSIST) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)))
  } catch {
    // Quota, private mode, a disabled store. Same reasoning as above.
  }
}

// Oldest first, by the time it was last handed out rather than by when it was stored: the
// faces a member actually keeps seeing are the ones worth keeping.
const evictDownToCap = () => {
  if (entries.size <= MAX_ENTRIES) return
  const byAge = [...entries.entries()].sort((a, b) => a[1].usedAt - b[1].usedAt)
  for (const [key] of byAge.slice(0, entries.size - MAX_ENTRIES)) {
    entries.delete(key)
  }
}

/**
 * The picture for this member, if the one on this device is still the current one.
 * `avatarUpdatedAt` is the date the booking list reported; null means the member has
 * nothing to show, so nothing is returned even if a picture is lying here.
 */
export const storedMemberAvatar = (ref, avatarUpdatedAt) => {
  const wanted = asTime(avatarUpdatedAt)
  // Belt and braces, and worth naming as such: on today's paths the date comparison below
  // already refuses a dateless request, because nothing dateless is ever stored. This line
  // is what keeps that true if the writer ever slips -- a stored entry with no date would
  // otherwise match a request with no date, and hand back a face that was withdrawn.
  if (wanted === null) return null
  const entry = load().get(memberAvatarKey(ref))
  if (!entry || entry.updatedAt !== wanted) return null
  entry.usedAt = Date.now()
  return entry.avatar
}

/**
 * Which of these members the server still has to be asked about: everyone with a date whose
 * picture is missing here or has changed since. Handed straight to the memberAvatars query.
 */
export const missingMemberAvatars = (refsWithDates) =>
  refsWithDates
    .filter(({ avatarUpdatedAt, ...ref }) => {
      const wanted = asTime(avatarUpdatedAt)
      if (wanted === null) return false
      const entry = load().get(memberAvatarKey(ref))
      return !entry || entry.updatedAt !== wanted
    })
    .map(({ communityUuid = null, gradidoID }) => ({ communityUuid, gradidoID }))

/** Stores what the memberAvatars query answered. */
export const rememberMemberAvatars = (answered) => {
  if (!answered.length) return
  const now = Date.now()
  for (const { communityUuid = null, gradidoID, avatar, avatarUpdatedAt } of answered) {
    const updatedAt = asTime(avatarUpdatedAt)
    if (updatedAt === null) continue
    load().set(memberAvatarKey({ communityUuid, gradidoID }), { avatar, updatedAt, usedAt: now })
  }
  evictDownToCap()
  save()
}

/**
 * Drops the pictures of members the list no longer reports a date for -- they withdrew,
 * were deleted, or left. Without this the withdrawal would stop at the server and the face
 * would go on showing here.
 */
export const forgetWithdrawnMemberAvatars = (refsWithDates) => {
  let dropped = false
  for (const { avatarUpdatedAt, ...ref } of refsWithDates) {
    if (asTime(avatarUpdatedAt) !== null) continue
    if (load().delete(memberAvatarKey(ref))) dropped = true
  }
  if (dropped) save()
}

/**
 * Everything, for logging out. ⛔ Never localStorage.clear(): the wallet and the admin
 * share one origin, so that would take the other app's session and the shared theme key
 * with it. Called from the logout action next to the line for `gradido-frontend`.
 */
export const forgetAllMemberAvatars = () => {
  if (PERSIST) {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Nothing to do -- dropping the map below is what actually forgets them.
    }
  }
  // null, not an empty map: `load` only reads storage when there is nothing in memory, so
  // an empty map here would mean this module never looks at storage again for the lifetime
  // of the page. Storage is the authority after this point, and it is now empty.
  entries = null
}
