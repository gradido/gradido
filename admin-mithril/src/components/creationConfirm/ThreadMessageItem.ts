// AI-GENERATED — not an architecture reference
import '@admin/components/ContributionMessages/slots/ContributionMessagesListItem.css'
import parseClasses from '@admin/components/ContributionMessages/ParseMessage.module.css'
import { avatarLettering } from '@admin/utils/avatarLettering'
import m, { type ClassComponent, type Vnode } from 'mithril'
import { icon } from '@/components/icon'
import { MemberAvatar } from '@/components/MemberAvatar'
import type { ThreadMessage } from '@/data/Contribution.schema'
import {
  type MessagePart,
  messageParts,
  recordAmount,
  recordDate,
  withBold,
} from '@/data/ContributionThread.logic'
import { reassignedFromTo } from '@/data/SupportTicket.logic'
import { d, n, t } from '@/i18n'
import { memberAvatarSource } from '@/store/memberAvatars.store'
import { openMemberAvatarZoom } from '@/store/memberAvatarZoom.store'
import forwardIcon from '~icons/bi/forward-fill'
import pencilIcon from '~icons/bi/pencil-fill'
import stickyIcon from '~icons/bi/sticky-fill'

interface Attrs {
  message: ThreadMessage
  /** the member who handed the contribution in: whoever else wrote is the moderation */
  contributionUserId: number | null
}

const part = ({ type, text }: MessagePart) => {
  if (type === 'link') {
    return m('a', { href: text, target: '_blank', rel: 'noopener' }, text)
  }
  if (type === 'date') {
    const date = recordDate(text)
    return m('span', [`${date ? d(date) : text} `, m('br')])
  }
  if (type === 'amount') {
    const amount = recordAmount(text)
    return m('span', [m('br'), ` ${amount === null ? text : n(amount, 'decimal')} GDD`])
  }
  return m('span', m.trust(withBold(text)))
}

/**
 * A message of the thread, leaning to the side of who wrote it: the moderation's to the right,
 * the member's to the left, all in one grey. A note and a change say what they are in their head;
 * a change's record shows the old date, text and amount. A support request's thread has one kind
 * more (K4): the line a handing on left, from which group to which.
 */
export class ThreadMessageItem implements ClassComponent<Attrs> {
  view({ attrs: { message, contributionUserId } }: Vnode<Attrs>) {
    const byModeration = contributionUserId !== message.userId
    const note = message.type === 'MODERATOR'
    const change = message.type === 'HISTORY'
    const handedOn = message.type === 'REASSIGNED'
    const { letters, colorSeed, colorIndex } = avatarLettering({
      alias: message.userAlias,
      avatarColorIndex: message.userAvatarColorIndex,
    })
    // the face of whoever wrote it -- not of the contribution's member, nor of the moderator
    const author =
      message.userGradidoID && message.userCommunityUuid
        ? { gradidoID: message.userGradidoID, communityUuid: message.userCommunityUuid }
        : null
    const src = author
      ? memberAvatarSource({ ...author, avatarUpdatedAt: message.userAvatarUpdatedAt })
      : undefined
    const authorName = message.userAlias ?? ''
    const face = m(MemberAvatar, {
      size: 48,
      initials: letters,
      colorSeed,
      colorIndex,
      src,
      name: authorName,
      onzoom: author && src ? () => openMemberAvatarZoom(author, src, authorName) : undefined,
    })
    const kind = (margin: string) =>
      note
        ? m(
            'small.message-kind.d-inline-block',
            { class: margin, title: t('moderator.notice-tooltip'), 'data-test': 'message-kind' },
            [
              icon(stickyIcon, { class: 'me-1', 'aria-hidden': 'true' }),
              t('moderator.notice'),
              m('span.visually-hidden', ` – ${t('moderator.notice-tooltip')}`),
            ],
          )
        : change
          ? m('small.message-kind.d-inline-block', { class: margin, 'data-test': 'message-kind' }, [
              icon(pencilIcon, { class: 'me-1', 'aria-hidden': 'true' }),
              t('moderator.change'),
            ])
          : handedOn
            ? m(
                'small.message-kind.d-inline-block',
                { class: margin, 'data-test': 'message-kind' },
                [
                  icon(forwardIcon, { class: 'me-1', 'aria-hidden': 'true' }),
                  t('support.reassignedHead'),
                ],
              )
            : null
    const date = m(
      'small.ms-2.d-inline-block',
      { 'data-test': byModeration ? 'moderator-date' : 'user-date' },
      d(new Date(message.createdAt)),
    )
    const name = m(
      'span.ms-2.me-2.no-select.d-inline-block',
      { 'data-test': byModeration ? 'moderator-name' : 'user-name' },
      message.userAlias,
    )
    // the words of a handing on as text; where they cannot be read, the head alone
    const fromTo = handedOn ? reassignedFromTo(message.message) : null
    const bubble = [
      'p-2 rounded-sm mb-3 message-bubble',
      byModeration ? 'text-end is-moderator' : 'text-start is-user',
      note ? 'is-note' : '',
      change ? 'is-change' : '',
    ].join(' ')
    return m(
      '.contribution-messages-list-item.clearfix',
      m('div', { class: bubble }, [
        ...(byModeration
          ? [
              kind('ms-4') ??
                m(
                  'small.ms-4.d-inline-block',
                  { 'data-test': 'moderator-label' },
                  t('moderator.moderator'),
                ),
              date,
              name,
              face,
            ]
          : [face, name, date, kind('ms-3')]),
        change
          ? m('small.d-block.mt-1', { 'data-test': 'history-label' }, t('moderator.history'))
          : null,
        handedOn && !fromTo
          ? null
          : m(
              '.mt-2',
              {
                class: parseClasses.messageBody,
                'data-test': byModeration ? 'moderator-message' : 'user-message',
              },
              handedOn
                ? fromTo
                : messageParts(message.message, message.type).map((piece) =>
                    m('span', part(piece)),
                  ),
            ),
      ]),
    )
  }
}
