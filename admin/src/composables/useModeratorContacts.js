// AI-GENERATED — not an architecture reference
import { ref } from 'vue'
import { contactRefs } from '@/graphql/contactRefs'
import { memberKey } from '@/composables/useMemberAvatars'

/**
 * Whom the signed-in moderator is in contact with -- their own contacts as the wallet counts
 * them: everybody they share a booking, the referral trace or a conversation with.
 *
 * For what stands behind a member's name (components/MemberWalletLink.vue): a moderator who is
 * in contact with a member gets the way into the conversation with them there -- instead of the
 * arrow into the send form (Bernd, 13.10.2026), and behind the pin of a member on the map
 * (Bernd, 16.10.2026). The server answers with all of them at once, as pairs; a list of
 * members is then told apart here, without a question per row.
 *
 * ⛔ Held for ONE moderator. The same browser is used by more than one, and the admin
 * interface can be entered as another moderator without the one before signing out (the
 * hand-over from the wallet). So what is held carries whose it is, a question for somebody
 * else starts from nothing, and an answer that arrives for the moderator before is dropped.
 */
const held = {
  // The number of the moderator all of this belongs to; null: nobody's.
  owner: null,
  // A Set of pairs, or null while it is not known.
  keys: null,
  // When the answer arrived (ms).
  at: 0,
  // The question on its way, if there is one.
  asking: null,
  // Whether the wait for the first answer is over: a question has come back, answered or not,
  // or took longer than MODERATOR_CONTACTS_WAIT_MS.
  waitOver: false,
}

/**
 * Bumped whenever what is held changes -- a plain object is not reactive, and whoever reads
 * `moderatorContact` in a computed reads this with it.
 */
const epoch = ref(0)

/**
 * The pair as it is compared. A uuid is the same in upper and in lower case, and the two sides
 * come from different rows of the server: a contact written the other way round would keep the
 * arrow.
 */
const pairKey = (member) => memberKey(member).toLowerCase()

/** Which emptying this is on: an answer of an older one is dropped. */
let generation = 0

/** How long an answer is taken as it is. A page that is opened after that asks again. */
export const MODERATOR_CONTACTS_FRESH_MS = 60000

/**
 * And how long for a moderator who comes back to the window: a first booking or a first message
 * makes a contact of a member, and both happen in the wallet's window beside this one. Not zero,
 * because coming back is told by more than one event at the same moment.
 */
export const MODERATOR_CONTACTS_RETURN_MS = 5000

/**
 * How long the first answer is waited for. An answer that takes longer is still taken when it
 * comes -- but whoever draws by it stops waiting and draws what needs no answer: the arrow was
 * there at once before there was this question, and a slow answer must not keep it away.
 */
export const MODERATOR_CONTACTS_WAIT_MS = 3000

const startOver = (owner) => {
  held.owner = owner
  held.keys = null
  held.at = 0
  held.asking = null
  held.waitOver = false
  generation++
  epoch.value++
}

/** Everything held -- called at logout. */
export const forgetModeratorContacts = () => startOver(null)

/**
 * What is known of one member for the moderator `owner`:
 * - `'yes'` or `'no'` once the server has answered;
 * - `'asking'` while the first answer is on its way -- nothing can be said yet, and it will be;
 * - `'unknown'` where nothing is known and nothing is on its way (never asked, or the question
 *   failed).
 *
 * ⛔ `'asking'` for the FIRST question only, and for MODERATOR_CONTACTS_WAIT_MS at the most.
 * After a question that failed or took too long it is `'unknown'` until an answer is there:
 * whoever draws by it has drawn what needs no answer by then, and that is not taken away again
 * for the time another try takes.
 */
export const moderatorContact = (owner, member) => {
  const version = epoch.value
  if (version < 0 || owner === null || owner === undefined || held.owner !== owner) return 'unknown'
  if (held.keys === null) return held.asking && !held.waitOver ? 'asking' : 'unknown'
  return held.keys.has(pairKey(member)) ? 'yes' : 'no'
}

/**
 * Asks the server whom the moderator `owner` is in contact with -- once: a question on its way
 * is waited for, and an answer younger than `freshFor` is taken as it is.
 *
 * Never throws and never rejects. Where the question fails, what was known before stays; where
 * nothing was known, nothing is (`'unknown'`), and whoever draws by it falls back to what needs
 * no answer.
 *
 * @param apolloClient the client to ask with
 * @param owner the number of the signed-in moderator
 * @param freshFor how old an answer may be to be taken as it is (ms); a minute where not said
 */
export const askModeratorContacts = (
  apolloClient,
  owner,
  freshFor = MODERATOR_CONTACTS_FRESH_MS,
) => {
  if (!apolloClient || owner === null || owner === undefined) return Promise.resolve()
  if (held.owner !== owner) startOver(owner)
  if (held.asking) return held.asking
  if (held.keys !== null && Date.now() - held.at < freshFor) return Promise.resolve()
  const mine = generation
  // The first answer is waited for, and not for ever.
  const waitedLongEnough = held.waitOver
    ? null
    : setTimeout(() => {
        if (mine !== generation || held.waitOver) return
        held.waitOver = true
        epoch.value++
      }, MODERATOR_CONTACTS_WAIT_MS)
  // Asked at once -- and inside a promise, so that a client that throws is a question that
  // failed and not an error in whoever draws a name.
  const asking = new Promise((resolve) => {
    resolve(apolloClient.query({ query: contactRefs, fetchPolicy: 'no-cache' }))
  })
    .then((answer) => {
      if (mine !== generation) return
      held.keys = new Set((answer?.data?.contactRefs ?? []).map(pairKey))
      held.at = Date.now()
    })
    .catch(() => undefined)
    .finally(() => {
      clearTimeout(waitedLongEnough)
      if (mine !== generation) return
      held.asking = null
      held.waitOver = true
      epoch.value++
    })
  held.asking = asking
  epoch.value++
  return asking
}
