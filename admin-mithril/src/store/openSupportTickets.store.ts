// AI-GENERATED — not an architecture reference
import { adminCountOpenSupportTickets } from '@admin/graphql/supportTickets.graphql'
import * as v from 'valibot'
import { openSupportTicketsSchema } from '@/data/SupportTicket.schema'
import { graphqlRequest } from '@/graphql/client'
import { setOpenSupportTickets } from './admin.store'

// the question last asked: the answer to an earlier one, coming later, does not set the badges
let lastAsked = 0

/**
 * Asks for the two halves of the open support tab (K3) and sets the badges in the bar and on the
 * tab to their sum (adminStore.openSupportTickets) -- where no later question was asked in the
 * meantime: a slow answer must not put back a count from before a write. Answers the halves, or
 * null where the count failed: the badges then keep what they showed. The start page and the
 * support page ask for it.
 */
export const askOpenSupportTickets = async () => {
  const asked = ++lastAsked
  const answer = await graphqlRequest(adminCountOpenSupportTickets)
  if (!answer.success) {
    return null
  }
  const halves = v.parse(openSupportTicketsSchema, answer.value).adminCountOpenSupportTickets
  if (asked === lastAsked) {
    setOpenSupportTickets(halves.forModeration + halves.forMember)
  }
  return halves
}
