// AI-GENERATED — not an architecture reference
import { ref } from 'vue'
import { memberAvatars } from '@/graphql/memberAvatars'
import { avatarLettering } from '@/utils/avatarLettering'

/**
 * The member pictures this interface has already fetched, kept for as long as the moderator
 * is signed in.
 *
 * ⛔ Deliberately the SMALL cousin of the wallet's composable of the same name, not a copy
 * of it. The wallet holds pictures for lists a member scrolls through for minutes and has to
 * cap, evict and re-ask; a moderation page shows a handful of rows and is reloaded whenever
 * the moderator moves. What both share is the rule that matters, and it is the only one
 * carried over: a stored picture counts as current while its DATE matches the one the list
 * brought, and a changed date invalidates exactly the one member who changed.
 *
 * ⚠️ Everything here is keyed by the PAIR (community uuid, gradidoID). `users` is unique on
 * those two together, and the wallet learned the hard way that half of it silently matches
 * nobody.
 */
const pictures = new Map()

/**
 * Bumped on every write, and read by whoever renders a picture.
 *
 * ⛔ A plain Map is not reactive: without this counter a row that rendered before the
 * pictures arrived would keep its initials until something else happened to re-render it.
 */
const epoch = ref(0)

export const memberKey = ({ communityUuid, gradidoID }) => `${communityUuid ?? ''}/${gradidoID}`

const asTime = (date) => {
  if (!date) return null
  const time = new Date(date).getTime()
  return Number.isNaN(time) ? null : time
}

/** What this device holds for one member, if its date still matches the list's. */
const current = (member) => {
  const held = pictures.get(memberKey(member))
  if (!held) return null
  return held.at === asTime(member.avatarUpdatedAt) ? held : null
}

/**
 * The picture of one member as an `<img>` source, or '' while there is none here.
 *
 * Reads `epoch` on purpose, so that a computed built on this is re-evaluated when the
 * pictures arrive.
 */
export const memberAvatarSource = (member) => {
  if (!member?.gradidoID) return ''
  // ⛔ Read, not ignored: this is what makes a computed built on this function re-evaluate
  // when the pictures arrive. A plain Map is not reactive, and without this line a row that
  // rendered before the answer would keep its initials until something else re-rendered it.
  const version = epoch.value
  const held = current(member)
  return held && version >= 0 ? `data:image/jpeg;base64,${held.avatar}` : ''
}

/**
 * Everything the moderator's screen no longer needs -- called at logout.
 *
 * ⛔ `generation` is bumped as well, and that is not bookkeeping: a request already on its
 * way would otherwise write the faces it brings back into a store that was just emptied, and
 * the next moderator would find the previous one's people waiting for them.
 */
export const forgetAllMemberAvatars = () => {
  pictures.clear()
  generation++
  epoch.value++
}

/**
 * Which emptying the store is on. Read before a request goes out and compared when its answer
 * arrives; anything older than the current one is dropped. (coderabbit, #3890 -- the wallet
 * has the same guard, under the name `memberAvatarStoreEpoch`.)
 */
let generation = 0

/**
 * Fetches what these members' rows are missing, in one round trip.
 *
 * @param apolloClient the client to ask with
 * @param members the members as a list carries them ({ gradidoID, communityUuid,
 *   avatarUpdatedAt, … }); entries without a gradidoID or without a date are skipped -- a
 *   missing date IS the answer "there is nothing to show".
 */
export const fetchMemberAvatars = async (apolloClient, members) => {
  // One entry per MEMBER, not per row: a moderator who wrote in three threads on the page
  // would otherwise be named three times in one request.
  const wanted = new Map()
  for (const member of members ?? []) {
    if (!member?.gradidoID || asTime(member.avatarUpdatedAt) === null) continue
    if (current(member)) continue
    wanted.set(memberKey(member), {
      gradidoID: member.gradidoID,
      communityUuid: member.communityUuid ?? null,
    })
  }
  if (wanted.size === 0) return

  // Read BEFORE the request, compared after it: the one thing a late answer must never
  // survive is a logout in between.
  const asked = generation
  try {
    const { data } = await apolloClient.query({
      query: memberAvatars,
      variables: { refs: [...wanted.values()] },
      // ⚠️ Never from the cache. The request names members, not versions -- a member who
      // replaces their picture is asked for under exactly the same variables as before, so
      // a cached answer would hand back the picture they just replaced. The freshness
      // decision is made against the date on the list, before we get here.
      fetchPolicy: 'no-cache',
    })
    if (asked !== generation) return
    for (const answer of data?.memberAvatars ?? []) {
      pictures.set(memberKey(answer), {
        avatar: answer.avatar,
        at: asTime(answer.avatarUpdatedAt),
      })
    }
    epoch.value++
  } catch {
    // Best effort by design: nobody loses the moderation list over a portrait. The rows
    // keep their initials, and the next page asks again.
  }
}

/**
 * Everything a circle needs about one member, from ONE call: the letters, the colour and the
 * picture if this device holds it.
 *
 * ⛔ One call, not three. The letters and the colour have to agree about which member they
 * describe, and the last time a house let its call sites assemble such a set themselves,
 * three of four passed the right value and the fourth put a placeholder in front of members.
 *
 * @param {{alias?: string|null, firstName?: string|null, lastName?: string|null,
 *   avatarColorIndex?: number|null, gradidoID?: string|null, communityUuid?: string|null,
 *   avatarUpdatedAt?: string|Date|null}|null} member
 */
export const memberAvatarProps = (member) => {
  const { letters, colorSeed, colorIndex } = avatarLettering(member)
  return {
    initials: letters,
    colorSeed,
    colorIndex,
    src: memberAvatarSource(member),
  }
}
