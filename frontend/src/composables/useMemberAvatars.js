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
// from the server with NO date at all. That is why `forgetWithdrawnMemberAvatars` treats a
// missing date as an instruction to forget rather than as "nothing to do": the withdrawal
// has to reach the pictures already lying on this device, or turning the switch off would
// leave the face on screen until the browser storage happened to be cleared.

import { ref } from 'vue'
import { avatarLettering } from '@/utils/avatarLettering'

const STORAGE_KEY = 'gradido-avatars'

// ⚠️ Measured, because the first estimate here was out by the whole budget. What is stored
// is base64, and browsers bill localStorage in UTF-16 code units -- two bytes per
// character. Chrome refuses at exactly 5,242,880 characters, and this origin is shared with
// the vuex blob (`gradido-frontend`), the theme key, and the admin app.
//
//   200 entries at the 8 KB target  -> ~2.21 M chars, 42% of that budget
//   200 entries at the 10 KB cap    -> ~2.77 M chars, 53%
//
// So the cap holds with room to spare in Chrome. It is deliberately not raised: WebKit's
// classic budget is half of Chrome's, which would put this cache alone near the whole
// origin -- and the failure is not graceful. `save` swallows its own QuotaExceededError,
// while `vuex-persistedstate` writes with a bare `setItem` from a store subscriber, so a
// full origin throws out of `commit`, and at boot `assertStorage` throws before the store
// is even created.
const MAX_ENTRIES = 200

// ★ The retreat, if browser storage ever turns out to be a problem: set this to false.
// Everything else keeps working -- the pictures then live for one page view instead of
// across visits, which costs one extra fetch after a reload and nothing else. Logging out
// still deletes what is already on the device; see forgetAllMemberAvatars.
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

// Bumped whenever the contents change. Read by storedMemberAvatar so that a component
// asking for a picture inside a computed re-renders when the fetch answers -- the map
// itself is a plain Map on purpose (it holds base64 by the hundred, and there is nothing
// to gain from making every entry reactive), so without this the first paint would show
// initials and nothing would ever replace them.
const version = ref(0)

// Touching the ref is the entire point, so it needs a name: a bare `version.value` reads
// as a line somebody forgot to finish, and lint says so.
const trackChanges = () => version.value

// The `data:` URIs built from stored pictures, so that a re-render does not rebuild an
// ~11 KB string per row. A booking list re-renders whenever ANY member's picture arrives,
// and without this each one costs eight fresh strings for eight unchanged faces.
//
// Keyed by the member AND the date, so an entry that was replaced can never be served from
// here; emptied whenever the store changes, which is the belt to that braces.
let sourceCache = new Map()

// Every write path ends here, so nothing can change the store without waking the readers
// or without dropping the strings built from the old contents.
const announceChange = () => {
  sourceCache = new Map()
  version.value++
}

// ⛔ Bumped only when the whole store is thrown away, which today means logging out. A
// request that was in flight across that moment must not write its answer back: the wipe
// runs synchronously at the top of the logout action, while Apollo's own cancellation is
// two deferrals later (a microtask for clearStore, then a setTimeout for the cancel), so
// an answer delivered in that gap resolves normally. Without this counter it would hand
// the next member to sign in on this browser the faces the previous one was allowed to
// see -- exactly what the logout action says must not happen.
let storeEpoch = 0
export const memberAvatarStoreEpoch = () => storeEpoch

// The keys the newest booking list reported as having nothing to show. Rebuilt by
// forgetWithdrawnMemberAvatars on every list, and consulted by rememberMemberAvatars so
// that a picture answered for one of them -- necessarily from an older list -- cannot be
// written back after the withdrawal was applied.
//
// ★ This is what lets a late answer be KEPT instead of discarded wholesale. Throwing the
// whole answer away because a newer list has arrived costs the member every portrait in
// it, downloaded and dropped, and the list shows initials although the bytes had arrived.
// Only the withdrawn ones are actually dangerous, and those are named right here.
let withdrawnKeys = new Set()

// The keys a request is currently waiting for. A second booking list arriving before the
// first answer would otherwise ask for exactly the same faces again -- and on a slow
// connection a third one after that.
const inFlightKeys = new Set()

const load = () => {
  if (entries) return entries
  entries = new Map()
  if (!PERSIST) return entries
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      for (const [key, entry] of Object.entries(JSON.parse(raw))) {
        // ⚠️ `usedAt` is the field name an earlier build wrote, and those entries are
        // still lying in the browsers that ran it. Read verbatim they would leave
        // `storedAt` undefined, and `undefined - undefined` makes the eviction comparator
        // return NaN, which leaves the order unspecified. The old value is the fetch time,
        // so it is exactly the right thing to carry over.
        entries.set(key, { ...entry, storedAt: entry.storedAt ?? entry.usedAt ?? 0 })
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(load())))
  } catch {
    // Quota, private mode, a disabled store. Same reasoning as above.
  }
}

// Oldest first, by when it was fetched. Least-recently-SEEN would keep the more useful
// set, but it would mean writing on every read, and this is read from inside a computed.
const evictDownToCap = () => {
  // `load()`, not `entries`: this is reached from rememberMemberAvatars, which only calls
  // load inside its loop -- so an answer whose every entry is skipped would arrive here
  // with the map still null and throw on `.size`.
  const stored = load()
  if (stored.size <= MAX_ENTRIES) return
  const byAge = [...stored.entries()].sort((a, b) => a[1].storedAt - b[1].storedAt)
  for (const [key] of byAge.slice(0, stored.size - MAX_ENTRIES)) {
    stored.delete(key)
  }
}

// The one place that decides whether a stored picture is still the current one. Both
// readers below go through it, so the freshness rule cannot come to mean two things.
const currentEntry = (member, avatarUpdatedAt) => {
  const wanted = asTime(avatarUpdatedAt)
  // Belt and braces, and worth naming as such: on today's paths the date comparison below
  // already refuses a dateless request, because nothing dateless is ever stored. This line
  // is what keeps that true if the writer ever slips -- a stored entry with no date would
  // otherwise match a request with no date, and hand back a face that was withdrawn.
  if (wanted === null) return null
  const entry = load().get(memberAvatarKey(member))
  return entry && entry.updatedAt === wanted ? entry : null
}

/**
 * The picture for this member, if the one on this device is still the current one.
 * `avatarUpdatedAt` is the date the booking list reported; null means the member has
 * nothing to show, so nothing is returned even if a picture is lying here.
 */
export const storedMemberAvatar = (member, avatarUpdatedAt) => {
  // Registers this reader with the counter above. Reading is otherwise free of effects,
  // deliberately: this runs inside a computed, and a read that writes is the kind of thing
  // that later nobody can explain.
  trackChanges()
  return currentEntry(member, avatarUpdatedAt)?.avatar ?? null
}

/**
 * The stored picture as an `<img>` source, or '' when there is none -- which is what
 * AppAvatar reads as "draw the letters instead".
 *
 * The format is spelled out once here rather than at each call site. The encoder writes
 * JPEG and the backend accepts nothing else (it checks the ff d8 / ff d9 markers), so the
 * type is not a guess.
 */
export const memberAvatarSource = (member) => {
  trackChanges()
  const entry = currentEntry(member, member?.avatarUpdatedAt)
  if (!entry) return ''
  const key = `${memberAvatarKey(member)}@${entry.updatedAt}`
  let source = sourceCache.get(key)
  if (source === undefined) {
    source = `data:image/jpeg;base64,${entry.avatar}`
    sourceCache.set(key, source)
  }
  return source
}

/**
 * Everything AppAvatar needs to draw one member, from one call.
 *
 * ★★ One call is the point. The letters and the colour seed must agree about which member
 * they describe, and a template that calls the helper once per prop takes one half from
 * each call -- which is the split avatarLettering exists to make impossible. Binding this
 * whole object with `v-bind` cannot be half-forwarded either.
 *
 * @param {{alias?, firstName?, lastName?, gradidoID?, communityUuid?, avatarUpdatedAt?, avatarColorIndex?}|null} member
 */
export const memberAvatarProps = (member) => {
  const { letters, colorSeed, colorIndex } = avatarLettering(member)
  return {
    name: `${member?.firstName ?? ''} ${member?.lastName ?? ''}`.trim(),
    initials: letters,
    colorSeed,
    colorIndex,
    src: memberAvatarSource(member),
  }
}

/**
 * Which of these members the server still has to be asked about: everyone with a date whose
 * picture is missing here or has changed since. Handed straight to the memberAvatars query.
 *
 * ⚠️ One entry per MEMBER, not per booking row. The caller maps rows, and a member who
 * appears in twelve of them would otherwise be named twelve times in one request -- and
 * MEMBER_AVATARS_MAX_REFS counts what is sent, not who is meant, so the cap would be
 * measured against the page size rather than against the number of people on it.
 */
export const missingMemberAvatars = (refsWithDates) => {
  const wanted = new Map()
  for (const { avatarUpdatedAt, ...ref } of refsWithDates) {
    if (!currentEntry(ref, avatarUpdatedAt) && asTime(avatarUpdatedAt) !== null) {
      wanted.set(memberAvatarKey(ref), {
        communityUuid: ref.communityUuid ?? null,
        gradidoID: ref.gradidoID,
      })
    }
  }
  return [...wanted.values()]
}

/**
 * The same list, minus what another request is already waiting for, and marked as being
 * fetched. The returned `done` must run when the request settles, whatever its outcome --
 * a `finally` -- or those members would never be asked about again on this page.
 */
export const claimMissingMemberAvatars = (refsWithDates) => {
  const refs = missingMemberAvatars(refsWithDates).filter(
    (ref) => !inFlightKeys.has(memberAvatarKey(ref)),
  )
  for (const ref of refs) inFlightKeys.add(memberAvatarKey(ref))
  return {
    refs,
    done: () => {
      for (const ref of refs) inFlightKeys.delete(memberAvatarKey(ref))
    },
  }
}

/** Stores what the memberAvatars query answered. */
export const rememberMemberAvatars = (answered) => {
  if (!answered.length) return
  const now = Date.now()
  let stored = false
  for (const { communityUuid = null, gradidoID, avatar, avatarUpdatedAt } of answered) {
    const updatedAt = asTime(avatarUpdatedAt)
    if (updatedAt === null) continue
    const key = memberAvatarKey({ communityUuid, gradidoID })
    // The newest list says this member has nothing to show, so this answer is older than
    // the withdrawal it would undo. See withdrawnKeys.
    if (withdrawnKeys.has(key)) continue
    load().set(key, { avatar, updatedAt, storedAt: now })
    stored = true
  }
  if (!stored) return
  evictDownToCap()
  save()
  announceChange()
}

/**
 * Drops the pictures of members the list no longer reports a date for -- they withdrew,
 * were deleted, or left. Without this the withdrawal would stop at the server and the face
 * would go on showing here.
 */
export const forgetWithdrawnMemberAvatars = (refsWithDates) => {
  const withdrawn = new Set()
  let dropped = false
  for (const { avatarUpdatedAt, ...ref } of refsWithDates) {
    if (asTime(avatarUpdatedAt) !== null) continue
    const key = memberAvatarKey(ref)
    withdrawn.add(key)
    if (load().delete(key)) dropped = true
  }
  // Replaced, not merged: this describes the list in front of the member right now, and a
  // member who is simply no longer on the page has not withdrawn anything.
  withdrawnKeys = withdrawn
  if (dropped) {
    save()
    announceChange()
  }
}

/**
 * Everything, for logging out. ⛔ Never localStorage.clear(): the wallet and the admin
 * share one origin, so that would take the other app's session and the shared theme key
 * with it. Called from the logout action next to the line for `gradido-frontend`.
 */
export const forgetAllMemberAvatars = () => {
  let storageIsEmpty = false
  try {
    // ⚠️ Unconditionally, PERSIST or not. The switch says whether this module writes from
    // now on; it says nothing about what an earlier build already left on the device. Made
    // conditional, the one setting whose purpose is to reduce what browser storage holds
    // would be the one setting under which logging out stops deleting it. Removing a key
    // that was never written costs nothing.
    localStorage.removeItem(STORAGE_KEY)
    storageIsEmpty = true
  } catch {
    // Storage refused. Handled below, and it has to be: this runs on logout.
  }
  // null, not an empty map, WHEN the removal worked: `load` only reads storage when there
  // is nothing in memory, so an empty map would mean this module never looks at storage
  // again for the life of the page. Storage is the authority from here, and it is empty.
  //
  // ⚠️ When the removal did NOT work, that reasoning inverts and becomes dangerous: the
  // pictures are still lying in storage, and dropping the map would invite the very next
  // read to load them back for whoever signs in next. An empty map is then the stricter
  // answer -- nothing readable, and storage is never consulted again on this page.
  entries = storageIsEmpty ? null : new Map()
  withdrawnKeys = new Set()
  inFlightKeys.clear()
  storeEpoch++
  announceChange()
}
