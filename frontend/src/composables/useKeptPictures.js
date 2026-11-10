// AI-GENERATED — not an architecture reference

// The member's own pictures of their contacts (AS-023, AS-024): a picture only the member sees,
// shown instead of the contact's own face wherever that contact stands in their wallet.
//
// ⛔ Kept apart from the store of the faces OTHER members show (useMemberAvatars). That one decides
// by the date a list reports, forgets a member without one, and is built for pictures that can be
// withdrawn; none of that is true of a picture the member keeps -- a contact without a face of
// their own must show the member's picture all the same, and it stays when the contact withdraws
// theirs. memberAvatarSource asks here first.
//
// Two things are kept, in two places:
//
//   * WHO the member keeps a picture of, on the device (DEVICE_KEY): so that the very first paint
//     of a page already knows, and a circle shows letters until the member's picture has come --
//     never the contact's own face first and the member's a moment later. Only the pairs, bound
//     to the member they belong to, and gone with every sign-out (forgetKeptPictures).
//   * the small pictures, in the page's memory only. A hundred of them would take a quarter of the
//     browser storage the faces of other members already share (useMemberAvatars, MAX_ENTRIES), so
//     they are asked for again on every visit -- one request, at the start of the layout.

import { ref } from 'vue'
import {
  keptPictureFullQuery,
  keptPicturePairsQuery,
  keptPicturesQuery,
  removeKeptPictureMutation,
  setKeptPictureMutation,
} from '@/graphql/keptPictures.graphql'
import { chatMemberKey } from '@/utils/chatMemberKey'

const DEVICE_KEY = 'gradido-kept-pictures'

/**
 * How many people a member may keep a picture of: the server's limit, named where a member reaches
 * it. The wallet has no dependency on `shared`; useKeptPictures.drift.spec.js holds this copy
 * against shared/src/const/frontendReadable.ts.
 */
export const KEPT_PICTURES_MAX_PER_MEMBER = 100

// The member whose pictures these are, and their community: a person named without one is of it,
// as the server reads it (chatMemberKey).
let owner = null
let home = null
// The people the member keeps a picture of, by key.
let kept = new Set()
// Their small pictures, by key, base64 -- in memory only.
let pictures = new Map()
// The `data:` addresses built from them, so that a list re-rendering does not rebuild a string of
// about ten kilobytes per row. Emptied with every change.
let sources = new Map()
let loaded = false
let inFlight = null

// ⛔ Bumped by every sign-out: an answer that was on its way across it must not write the previous
// member's pictures into the next one's session.
let epoch = 0

// Pictures set or taken away before a list has come: the server may have read that list before
// them, so they are laid over its answer again. Laid over, not waited for -- an answer thrown away
// would leave every other picture out until the next request. Doing it twice changes nothing, so
// a list read after them is no harm.
let changedSince = []
const replayChanges = () => {
  for (const { key, small } of changedSince) {
    if (small) {
      kept.add(key)
      pictures.set(key, small)
    } else {
      kept.delete(key)
      pictures.delete(key)
    }
  }
}

// Read by every reader, bumped by every change: a list asking for a face inside a computed draws
// again when a picture is set, taken away or arrives. The faces of other members have a counter of
// their own (useMemberAvatars); this one is read in memberAvatarSource as well.
const version = ref(0)
// Touching the ref is the entire point (useMemberAvatars, trackChanges).
const trackChanges = () => version.value
const announce = () => {
  sources = new Map()
  version.value++
}

const keyOf = (member) => chatMemberKey(member, home)

const remember = () => {
  try {
    localStorage.setItem(DEVICE_KEY, JSON.stringify({ owner, keys: [...kept] }))
  } catch {
    // Quota, private mode, a disabled store: the next visit asks the server, as a first one does.
  }
}

/**
 * The member this wallet now shows, before anything is drawn (DashboardLayout, setup): the pairs
 * on the device are taken where they are this member's.
 */
export const startKeptPictures = (member, community) => {
  const newMember = (member ?? null) !== owner
  const newHome = (community ?? null) !== home
  if (!newMember && !newHome) return
  if (newMember) {
    forgetInMemory()
    owner = member ?? null
    if (owner) {
      try {
        const stored = JSON.parse(localStorage.getItem(DEVICE_KEY) ?? 'null')
        if (stored?.owner === owner && Array.isArray(stored.keys)) {
          kept = new Set(stored.keys.filter((key) => typeof key === 'string'))
        } else if (stored) {
          // Another member's, left where nobody signed out -- a session that ran out with the tab
          // closed, a sign-in over an open session: gone now, not once this member's list comes.
          localStorage.removeItem(DEVICE_KEY)
        }
      } catch {
        // Unreadable storage: the list from the server fills it in.
      }
    }
  }
  // The member's community only says which community a person named without one is of: the
  // pictures stay, every key is read anew with it.
  home = community ?? null
  announce()
}

/**
 * The member's pictures, once per page: the layout asks at its start, and the picture window asks
 * again when it opens -- which costs nothing once they are here, and is the retry where the first
 * request failed. One request at a time.
 *
 * WHO the pictures are of is asked for beside them, in a request of its own: a few bytes against
 * up to a megabyte, so that on a first visit (nothing on the device yet, as after every sign-out)
 * a circle knows to wait with letters before the person's own face can arrive -- that one needs
 * two requests, the list it stands in and its picture. Measured in the probe wallet: with the
 * pictures alone, a list 300 ms slower than the contact list showed the person's own face first.
 *
 * `no-cache`: the answer is not written to the Apollo cache, where it would lie a second time and
 * outlive the session there.
 */
export const ensureKeptPictures = (apolloClient) => {
  if (loaded || !owner) return Promise.resolve()
  if (!inFlight) {
    const at = epoch
    // What the server reads from here on includes every change made before.
    changedSince = []
    apolloClient
      .query({ query: keptPicturePairsQuery, fetchPolicy: 'no-cache' })
      .then(({ data }) => {
        // The pictures may have come first: they carry the pairs as well.
        if (at !== epoch || loaded) return
        kept = new Set((data?.keptPicturePairs ?? []).map(keyOf))
        replayChanges()
        remember()
        announce()
      })
      .catch(() => {
        // The pictures' own answer carries the pairs as well.
      })
    const handle = apolloClient
      .query({ query: keptPicturesQuery, fetchPolicy: 'no-cache' })
      .then(({ data }) => {
        if (at !== epoch) return
        const answered = data?.keptPictures ?? []
        kept = new Set(answered.map(keyOf))
        pictures = new Map(answered.map((entry) => [keyOf(entry), entry.picture]))
        replayChanges()
        changedSince = []
        loaded = true
        remember()
        announce()
      })
      .catch(() => {
        // Letters stay where the device says a picture is kept; the next call asks again.
      })
      .finally(() => {
        if (inFlight === handle) inFlight = null
      })
    inFlight = handle
  }
  return inFlight
}

/** Whether the member keeps a picture of this person. Reactive. */
export const hasKeptPicture = (member) => {
  trackChanges()
  return Boolean(member?.gradidoID) && kept.has(keyOf(member))
}

/**
 * The member's picture of this person as an `<img>` source -- '' while it is on its way (the
 * circle shows letters, never the person's own face), and null where the member keeps none. Reactive.
 */
export const keptPictureSource = (member) => {
  trackChanges()
  if (!member?.gradidoID) return null
  const key = keyOf(member)
  if (!kept.has(key)) return null
  const picture = pictures.get(key)
  if (!picture) return ''
  let source = sources.get(key)
  if (source === undefined) {
    source = `data:image/jpeg;base64,${picture}`
    sources.set(key, source)
  }
  return source
}

/**
 * Sets the member's picture of this person. The server's word first, then here: the wallet never
 * shows a picture that is not stored.
 */
export const setKeptPicture = async (apolloClient, member, { small, full }) => {
  const at = epoch
  await apolloClient.mutate({
    mutation: setKeptPictureMutation,
    variables: {
      ref: { gradidoID: member.gradidoID, communityUuid: member.communityUuid ?? null },
      pictureSmall: small,
      pictureFull: full,
    },
    fetchPolicy: 'no-cache',
  })
  if (at !== epoch) return
  const key = keyOf(member)
  kept = new Set(kept).add(key)
  pictures = new Map(pictures).set(key, small)
  if (!loaded) changedSince.push({ key, small })
  remember()
  announce()
}

/** Takes the member's picture of this person away: the person's own face, or letters, again. */
export const removeKeptPicture = async (apolloClient, member) => {
  const at = epoch
  await apolloClient.mutate({
    mutation: removeKeptPictureMutation,
    variables: {
      ref: { gradidoID: member.gradidoID, communityUuid: member.communityUuid ?? null },
    },
    fetchPolicy: 'no-cache',
  })
  if (at !== epoch) return
  const key = keyOf(member)
  kept = new Set(kept)
  kept.delete(key)
  pictures = new Map(pictures)
  pictures.delete(key)
  if (!loaded) changedSince.push({ key, small: null })
  remember()
  announce()
}

/**
 * The member's picture of this person at full size, for the enlarged view; null where there is
 * none or the request failed. Nothing is kept: it is looked at, then dropped (useAvatarZoom).
 */
export const fetchKeptPictureFull = async (apolloClient, member) => {
  const at = epoch
  try {
    const { data } = await apolloClient.query({
      query: keptPictureFullQuery,
      variables: {
        ref: { gradidoID: member.gradidoID, communityUuid: member.communityUuid ?? null },
      },
      fetchPolicy: 'no-cache',
    })
    return at === epoch ? (data?.keptPictureFull ?? null) : null
  } catch {
    return null
  }
}

/** What a session-ending sign-out and the start of another member's session have in common. */
function forgetInMemory() {
  owner = null
  home = null
  kept = new Set()
  pictures = new Map()
  changedSince = []
  loaded = false
  inFlight = null
  epoch++
}

/**
 * Everything, for signing out: the pictures in memory and who they are of on the device. The next
 * member to sign in on this browser must not be shown -- or be able to read -- whom the previous one
 * keeps a picture of. ⛔ Never localStorage.clear(): wallet and admin share one origin.
 */
export const forgetKeptPictures = () => {
  forgetInMemory()
  try {
    localStorage.removeItem(DEVICE_KEY)
  } catch {
    // Storage refused: the pairs lie there under the previous member's name, and startKeptPictures
    // takes them for that member only.
  }
  announce()
}
