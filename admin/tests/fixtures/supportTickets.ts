// AI-GENERATED — not an architecture reference
import { contributor } from './contributions'
import { moderator } from './signIn'

/** The member of a support request as adminListSupportTickets names them: no salutation, no address. */
export const supportMember = (id: number, more: Record<string, unknown> = {}) => {
  const { salutation: _salutation, emailContact: _emailContact, ...member } = contributor(id, more)
  return member
}

/** A support request as adminListSupportTickets lists it: open, from member `userId`, no group. */
export const listedTicket = (id: number, userId = id, more: Record<string, unknown> = {}) => ({
  id,
  userId,
  user: supportMember(userId),
  userEmail: `member${userId}@example.org`,
  text: `Words of request ${id}`,
  status: 'OPEN',
  creationGroupTag: null,
  creationGroupName: null,
  createdAt: '2026-11-13T09:00:00.000Z',
  closedAt: null,
  closedBy: null,
  closedByUserName: null,
  resubmissionAt: null,
  lastMessageType: null,
  lastMessageByModerator: null,
  ...more,
})

export const ticketList = (tickets: ReturnType<typeof listedTicket>[], count = tickets.length) => ({
  count,
  tickets,
})

/** A message of a request's thread, as adminListSupportTicketMessages lists it: the member's. */
export const ticketMessage = (id: number, more: Record<string, unknown> = {}) => ({
  id,
  message: `Message ${id}`,
  createdAt: '2026-11-13T10:00:00.000Z',
  type: 'DIALOG',
  userAlias: 'member1',
  userId: 1,
  userAvatarColorIndex: null,
  userGradidoID: contributor(1).gradidoID,
  userCommunityUuid: moderator.communityUuid,
  userAvatarUpdatedAt: null,
  isModerator: false,
  ...more,
})
