// AI-GENERATED — not an architecture reference
import { CONFIG } from '@admin/config'
import { adminListContributionMessages } from '@admin/graphql/adminListContributionMessages'
import BootstrapTooltip from 'bootstrap/js/dist/tooltip'
import m, { type ClassComponent, type Vnode, type VnodeDOM } from 'mithril'
import * as v from 'valibot'
import { icon } from '@/components/icon'
import { MemberWalletLink } from '@/components/MemberWalletLink'
import { toastError } from '@/components/Toasts'
import { isOpen } from '@/data/Contribution.logic'
import {
  type ListedContribution,
  type ThreadMessage,
  threadSchema,
} from '@/data/Contribution.schema'
import { colleagueQuestion } from '@/data/ContributionThread.logic'
import { graphqlRequest } from '@/graphql/client'
import { d, t } from '@/i18n'
import { adminStore } from '@/store/admin.store'
import { askMemberAvatars } from '@/store/memberAvatars.store'
import {
  attachRemark,
  closeRemark,
  detachRemark,
  openRemark,
  type RemarkCard,
  takeRemark,
} from '@/store/userRemarks.store'
import circlesIcon from '~icons/arcticons/circles'
import { RemarkEditor, remarkLine, remarkToggle } from './MemberRemark'
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

let lastId = 0

/**
 * An opened contribution: its member with the ways into the wallet and the moderation's remark on
 * them, the thread with the member, and -- while it is open -- the form to answer, to note, or to
 * change its text. The thread and the remark come in one request.
 */
export class ContributionThread implements ClassComponent<Attrs> {
  private readonly remarkFieldId = `remark-field-${++lastId}`
  private messages: ThreadMessage[] = []
  private count = 0
  private remark!: RemarkCard
  private remarkToggle?: HTMLElement

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
    askMemberAvatars(
      thread.messages.flatMap(({ userGradidoID, userCommunityUuid, userAvatarUpdatedAt }) =>
        userGradidoID && userCommunityUuid
          ? [
              {
                gradidoID: userGradidoID,
                communityUuid: userCommunityUuid,
                avatarUpdatedAt: userAvatarUpdatedAt,
              },
            ]
          : [],
      ),
    )
  }

  // "Fertig" or Escape: the field closes, and the keyboard goes back to the button that opened it
  private closeRemark() {
    closeRemark(this.remark)
    m.redraw.sync()
    this.remarkToggle?.focus()
  }

  view({ attrs }: Vnode<Attrs>) {
    const { contribution } = attrs
    const { user } = contribution
    const email = user.emailContact?.email ?? ''
    const name = user.alias || user.firstName
    return m('.contribution-messages-list', [
      m('.list-group', [
        // side by side at the desk; on a phone each part wraps as a whole
        m('.list-group-item.d-flex.flex-wrap.align-items-center.column-gap-3.row-gap-1', [
          m(
            m.route.Link,
            { href: `/user?search=${email}`, title: t('goTo.userSearch') },
            `${user.firstName} ${user.lastName}`,
          ),
          m('a.text-break', { href: `mailto:${email}` }, email),
          m('span', [
            `${user.publicName ?? ''} `,
            // the remark's button behind the pin and the arrow, never alone on a line
            m('span.text-nowrap', [
              m(MemberWalletLink, { member: user, name }),
              remarkToggle(
                this.remark,
                name,
                this.remarkFieldId,
                () => (this.remark.open ? this.closeRemark() : openRemark(this.remark)),
                ({ dom }: VnodeDOM) => {
                  this.remarkToggle = dom as HTMLElement
                },
              ),
            ]),
          ]),
          m(
            'span',
            CONFIG.HUMHUB_ACTIVE === true
              ? m(
                  'a',
                  {
                    href: `${CONFIG.HUMHUB_API_URL.replace(/\/$/, '')}/u/${user.userIdentifier}`,
                    target: '_blank',
                    oncreate: ({ dom }: VnodeDOM) =>
                      new BootstrapTooltip(dom, { title: t('goTo.humhubProfile') }),
                    onremove: ({ dom }: VnodeDOM) => BootstrapTooltip.getInstance(dom)?.dispose(),
                  },
                  icon(circlesIcon, { class: 'svg-icon' }),
                )
              : null,
          ),
        ]),
        // the remark under the member line -- or, while it is written, the field in its place
        this.remark.open
          ? m(RemarkEditor, {
              card: this.remark,
              name,
              fieldId: this.remarkFieldId,
              ondone: () => this.closeRemark(),
            })
          : remarkLine(this.remark),
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
