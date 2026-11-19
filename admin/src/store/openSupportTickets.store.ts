// AI-GENERATED — not an architecture reference

import * as v from 'valibot'
import { openSupportTicketsSchema } from '@/data/SupportTicket.schema'
import { graphqlRequest } from '@/graphql/client'
import { adminCountOpenSupportTickets } from '@/graphql/supportTickets.graphql'
import { adminStore, setModerator, setOpenSupportTickets } from './admin.store'

// what isAuthorized answers a signed-in member without the right; an ended session is "403.13"
const NO_RIGHT = '401 Unauthorized'

// the question last asked: the answer to an earlier one, coming later, does not set the badges
let lastAsked = 0

/**
 * Asks for the two halves of the open support tab (K3) and sets the badges in the bar and on the
 * tab to their sum (adminStore.openSupportTickets) -- where no later question was asked in the
 * meantime: a slow answer must not put back a count from before a write. Answers the halves, or
 * null where the count failed: the badges then keep what they showed. The start page and the
 * support page ask for it.
 *
 * The server has the last word (K6): a refusal for want of the right means the tick was taken
 * away since the moderator came in through the wallet. The admin then forgets the tick it keeps,
 * and the count -- menu, start page and route no longer offer the support (supportIsTheirs), also
 * after a reload, until the next coming in reads it anew. Any other failure takes nothing away.
 */
export const askOpenSupportTickets = async () => {
  const asked = ++lastAsked
  const answer = await graphqlRequest(adminCountOpenSupportTickets)
  if (!answer.success) {
    // only the question last asked decides, as for the count: an earlier refusal that arrives
    // after a later answer takes nothing away
    if (asked === lastAsked && answer.error.messages.includes(NO_RIGHT) && adminStore.moderator) {
      setModerator({ ...adminStore.moderator, handlesSupportTickets: false })
      setOpenSupportTickets(0)
    }
    return null
  }
  const halves = v.parse(openSupportTicketsSchema, answer.value).adminCountOpenSupportTickets
  if (asked === lastAsked) {
    setOpenSupportTickets(halves.forModeration + halves.forMember)
  }
  return halves
}
