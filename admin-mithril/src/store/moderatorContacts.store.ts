// AI-GENERATED — not an architecture reference
import { contactRefs } from '@admin/graphql/contactRefs'
import m from 'mithril'
import * as v from 'valibot'
import { type MemberRef, memberKey } from '@/data/Member.logic'
import { graphqlRequest } from '@/graphql/client'

/**
 * Whom the signed-in moderator is in contact with, as the wallet counts it: a member they share a
 * booking, the referral trace or a conversation with. Behind such a member's name the way into
 * the conversation stands, behind everybody else's the arrow into the send form
 * (MemberWalletLink). The server answers with all of them at once.
 *
 * Held for ONE moderator: a browser is used by more than one, and an answer that comes for the
 * moderator before is dropped.
 */

/** How long an answer is taken as it is; a page opened after that asks again. */
const FRESH_MS = 60000
/** How long, for a moderator coming back to this window from the wallet's beside it. */
export const RETURN_FRESH_MS = 5000
/** How long the first answer is waited for before the arrow is drawn where nothing is known. */
const WAIT_MS = 3000

const contactRefsSchema = v.object({
  contactRefs: v.array(
    v.object({ communityUuid: v.nullish(v.string()), gradidoID: v.nullish(v.string()) }),
  ),
})

let owner: string | null = null
// the pairs of the contacts, null while not known
let keys: Set<string> | null = null
let answeredAt = 0
let asking: Promise<void> | null = null
// the wait for the first answer is over: one came back, answered or not, or took too long
let waitOver = false
// which emptying this is on: an answer of an older one is dropped
let generation = 0

const startOver = (newOwner: string | null) => {
  owner = newOwner
  keys = null
  answeredAt = 0
  asking = null
  waitOver = false
  generation++
}

/** Everything held -- at logout. */
export const forgetModeratorContacts = () => startOver(null)

/**
 * What is known of `member` for the moderator `forOwner`: 'yes' or 'no' once the server answered,
 * 'asking' while the first answer is on its way (for WAIT_MS at most), 'unknown' else.
 */
export const moderatorContact = (forOwner: string | null, member: MemberRef) => {
  if (forOwner === null || forOwner !== owner) {
    return 'unknown'
  }
  if (keys === null) {
    return asking && !waitOver ? 'asking' : 'unknown'
  }
  return keys.has(memberKey(member)) ? 'yes' : 'no'
}

/**
 * Asks whom `forOwner` is in contact with -- once: a question on its way is waited for, and an
 * answer younger than `freshFor` is taken as it is. Where the question fails, what was known
 * stays.
 */
export const askModeratorContacts = (forOwner: string | null, freshFor = FRESH_MS) => {
  if (forOwner === null) {
    return Promise.resolve()
  }
  if (forOwner !== owner) {
    startOver(forOwner)
  }
  if (asking) {
    return asking
  }
  if (keys !== null && Date.now() - answeredAt < freshFor) {
    return Promise.resolve()
  }
  const mine = generation
  const waited = waitOver
    ? undefined
    : setTimeout(() => {
        if (mine === generation) {
          waitOver = true
          m.redraw()
        }
      }, WAIT_MS)
  asking = graphqlRequest(contactRefs).then((answer) => {
    clearTimeout(waited)
    if (mine !== generation) {
      return
    }
    const parsed = answer.success ? v.safeParse(contactRefsSchema, answer.value) : null
    if (parsed?.success) {
      keys = new Set(parsed.output.contactRefs.map(memberKey))
      answeredAt = Date.now()
    }
    asking = null
    waitOver = true
    m.redraw()
  })
  return asking
}
