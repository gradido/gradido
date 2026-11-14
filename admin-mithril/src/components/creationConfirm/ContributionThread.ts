// AI-GENERATED — not an architecture reference
import { adminListContributionMessages } from '@admin/graphql/adminListContributionMessages'
import m, { type ClassComponent, type Vnode } from 'mithril'
import * as v from 'valibot'
import { toastError } from '@/components/Toasts'
import { isOpen } from '@/data/Contribution.logic'
import {
  type ListedContribution,
  type ThreadMessage,
  threadSchema,
} from '@/data/Contribution.schema'
import { colleagueQuestion, threadAuthors } from '@/data/ContributionThread.logic'
import { graphqlRequest } from '@/graphql/client'
import { d, t } from '@/i18n'
import { adminStore } from '@/store/admin.store'
import { askMemberAvatars } from '@/store/memberAvatars.store'
import { attachRemark, detachRemark, type RemarkCard, takeRemark } from '@/store/userRemarks.store'
import { MemberLine } from './MemberLine'
import { MessageForm, type ResubmissionSaved } from './MessageForm'
import { ThreadMessageItem } from './ThreadMessageItem'

/** A contribution whose member is there to be shown. */
export type MemberContribution = ListedContribution & {
  user: NonNullable<ListedContribution['user']>
  userId: number
}

/** Whether the contribution's member is there; a deleted one's is not. */
export const hasMember = (contribution: ListedContribution): contribution is MemberContribution =>
  contribution.user !== null && contribution.userId !== null

interface Attrs {
  contribution: MemberContribution
  hideResubmission: boolean
  onlist: () => void
  onresubmission: (saved: ResubmissionSaved) => void
}

/**
 * An opened contribution: its member with the ways into the wallet and the moderation's remark on
 * them, the thread with the member, and -- while it is open -- the form to answer, to note, or to
 * change its text. The thread and the remark come in one request.
 */
export class ContributionThread implements ClassComponent<Attrs> {
  private messages: ThreadMessage[] = []
  private count = 0
  private remark!: RemarkCard

  oninit({ attrs: { contribution } }: Vnode<Attrs>) {
    const name = contribution.user.alias || contribution.user.firstName
    this.remark = attachRemark(contribution.userId, () =>
      toastError(t('remark.failedClosed', { name })),
    )
    this.load(contribution)
  }

  onremove() {
    detachRemark(this.remark)
  }

  private async load({ id, userId }: ListedContribution) {
    const answer = await graphqlRequest(adminListContributionMessages, {
      contributionId: id,
      userId,
    })
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    const { userRemark, adminListContributionMessages: thread } = v.parse(
      threadSchema,
      answer.value,
    )
    this.messages = thread.messages
    this.count = thread.count
    takeRemark(this.remark, userRemark)
    // the faces of everybody who wrote in the thread
    askMemberAvatars(threadAuthors(thread.messages))
  }

  view({ attrs }: Vnode<Attrs>) {
    const { contribution } = attrs
    const { user } = contribution
    return m('.contribution-messages-list', [
      m('.list-group', [
        m(MemberLine, { member: user, email: user.emailContact?.email ?? '', remark: this.remark }),
        m(
          '.list-group-item',
          `${t('registered')}: ${d(new Date(user.createdAt))}, ${t('createdAt')}: ${d(new Date(contribution.createdAt))}`,
        ),
      ]),
      m(
        '.container',
        this.messages.map((message) =>
          m(
            'div',
            { key: message.id },
            m(ThreadMessageItem, { message, contributionUserId: contribution.userId }),
          ),
        ),
      ),
      isOpen(contribution)
        ? m(
            'div',
            m(MessageForm, {
              contribution,
              hideResubmission: attrs.hideResubmission,
              colleagueQuestion: colleagueQuestion(
                contribution.contributionStatus,
                this.messages,
                this.count,
                adminStore.moderator,
              ),
              onthread: () => this.load(contribution),
              onlist: attrs.onlist,
              onresubmission: attrs.onresubmission,
            }),
          )
        : null,
    ])
  }
}
