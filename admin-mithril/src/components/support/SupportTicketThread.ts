// AI-GENERATED — not an architecture reference
import { adminListSupportTicketMessages } from '@admin/graphql/supportTickets.graphql'
import m, { type ClassComponent, type Vnode } from 'mithril'
import * as v from 'valibot'
import { toastError } from '@/components/Toasts'
import type { ThreadMessage } from '@/data/Contribution.schema'
import { threadAuthors } from '@/data/ContributionThread.logic'
import { type ListedSupportTicket, supportThreadSchema } from '@/data/SupportTicket.schema'
import { graphqlRequest } from '@/graphql/client'
import { d, t } from '@/i18n'
import { askMemberAvatars } from '@/store/memberAvatars.store'
import { attachRemark, detachRemark, type RemarkCard, takeRemark } from '@/store/userRemarks.store'
import { MemberLine } from '../creationConfirm/MemberLine'
import { ThreadMessageItem } from '../creationConfirm/ThreadMessageItem'

/** A request whose member is there to be shown; a deleted member's request does not open. */
export type TicketWithMember = ListedSupportTicket & {
  user: NonNullable<ListedSupportTicket['user']>
}

interface Attrs {
  ticket: TicketWithMember
}

/**
 * An opened support request, to read (K2): its member with the ways into the wallet and the
 * moderation's remark on them, as on an opened contribution, and the thread with the member, the
 * internal notes among it. The thread and the remark come in one request. The form to answer comes
 * with K3.
 */
export class SupportTicketThread implements ClassComponent<Attrs> {
  private messages: ThreadMessage[] = []
  private remark!: RemarkCard

  oninit({ attrs: { ticket } }: Vnode<Attrs>) {
    const name = ticket.user.alias || ticket.user.firstName
    this.remark = attachRemark(ticket.userId, () => toastError(t('remark.failedClosed', { name })))
    this.load(ticket)
  }

  onremove() {
    detachRemark(this.remark)
  }

  private async load({ id, userId }: TicketWithMember) {
    const answer = await graphqlRequest(adminListSupportTicketMessages, {
      supportTicketId: id,
      userId,
    })
    if (!answer.success) {
      // the server's codes in the moderator's words: gone, out of reach, or not loaded
      toastError(
        t(
          answer.error.messages.includes('SUPPORT_TICKET_NOT_FOUND')
            ? 'support.notFound'
            : 'support.loadFailed',
        ),
      )
      return
    }
    const { userRemark, adminListSupportTicketMessages: thread } = v.parse(
      supportThreadSchema,
      answer.value,
    )
    this.messages = thread
    takeRemark(this.remark, userRemark)
    askMemberAvatars(threadAuthors(thread))
  }

  view({ attrs: { ticket } }: Vnode<Attrs>) {
    return m('.contribution-messages-list', [
      m('.list-group', [
        m(MemberLine, { member: ticket.user, email: ticket.userEmail ?? '', remark: this.remark }),
        m(
          '.list-group-item',
          `${t('registered')}: ${d(new Date(ticket.user.createdAt))}, ${t('support.sent')}: ${d(new Date(ticket.createdAt))}`,
        ),
      ]),
      m(
        '.container',
        this.messages.map((message) =>
          m(
            'div',
            { key: message.id },
            m(ThreadMessageItem, { message, contributionUserId: ticket.userId }),
          ),
        ),
      ),
    ])
  }
}
