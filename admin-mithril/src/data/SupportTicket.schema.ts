// AI-GENERATED — not an architecture reference
import * as v from 'valibot'
import { contributorSchema, threadMessageSchema, userRemarkSchema } from './Contribution.schema'

/**
 * The member of a support request, as its row, its face and its opened card read them: the
 * contribution's member without the salutation (Crea's, S2) and without the address, which the
 * request carries beside the member (userEmail).
 */
const supportMemberSchema = v.omit(contributorSchema, ['salutation', 'emailContact'])

/** A support request as the moderation lists it (adminListSupportTickets). */
export const listedSupportTicketSchema = v.object({
  id: v.number(),
  userId: v.number(),
  // null where the member's account is deleted
  user: v.nullable(supportMemberSchema),
  userEmail: v.nullable(v.string()),
  text: v.string(),
  status: v.picklist(['OPEN', 'IN_PROGRESS', 'CLOSED', 'DELETED']),
  creationGroupTag: v.nullable(v.string()),
  creationGroupName: v.nullable(v.string()),
  createdAt: v.string(),
  // for a deleted request when and by whom it was deleted
  closedAt: v.nullable(v.string()),
  closedBy: v.nullable(v.number()),
  closedByUserName: v.nullable(v.string()),
  // the newest message of the dialog, the notes left out
  lastMessageType: v.nullable(v.string()),
  lastMessageByModerator: v.nullable(v.boolean()),
})

export type ListedSupportTicket = v.InferOutput<typeof listedSupportTicketSchema>

export const supportTicketListSchema = v.object({
  adminListSupportTickets: v.object({
    count: v.number(),
    tickets: v.array(listedSupportTicketSchema),
  }),
})

/** The answer to an opened request: its thread, and the remark on its member. */
export const supportThreadSchema = v.object({
  userRemark: v.nullable(userRemarkSchema),
  adminListSupportTicketMessages: v.array(threadMessageSchema),
})
