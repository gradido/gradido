// AI-GENERATED — not an architecture reference
import { adminCountOpenSupportTickets } from '@admin/graphql/supportTickets.graphql'
import * as v from 'valibot'
import { openSupportTicketsSchema } from '@/data/SupportTicket.schema'
import { graphqlRequest } from '@/graphql/client'
import { setOpenSupportTickets } from './admin.store'

/**
 * Asks for the two halves of the open support tab (K3) and sets the badges in the bar and on the
 * tab to their sum (adminStore.openSupportTickets). Answers the halves, or null where the count
 * failed: the badges then keep what they showed. The start page and the support page ask for it.
 */
export const askOpenSupportTickets = async () => {
  const answer = await graphqlRequest(adminCountOpenSupportTickets)
  if (!answer.success) {
    return null
  }
  const halves = v.parse(openSupportTicketsSchema, answer.value).adminCountOpenSupportTickets
  setOpenSupportTickets(halves.forModeration + halves.forMember)
  return halves
}
