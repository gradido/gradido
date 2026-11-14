// AI-GENERATED — not an architecture reference
import '@admin/components/Tables/OpenCreationsTable.css'
import './supportTickets.css'
import { avatarLettering } from '@admin/utils/avatarLettering'
import m, { type Children, type ClassComponent, type Vnode } from 'mithril'
import { type Field, Table } from '@/components/bootstrap/Table'
import { icon } from '@/components/icon'
import { MemberAvatar } from '@/components/MemberAvatar'
import type { DetailsState } from '@/data/Contribution.logic'
import { isTheModerator } from '@/data/Member.logic'
import {
  closingLine,
  isOpenTicket,
  ticketDetailsState,
  ticketRowTone,
} from '@/data/SupportTicket.logic'
import type { ListedSupportTicket } from '@/data/SupportTicket.schema'
import { d, t } from '@/i18n'
import { adminStore } from '@/store/admin.store'
import { memberAvatarSource } from '@/store/memberAvatars.store'
import { openMemberAvatarZoom } from '@/store/memberAvatarZoom.store'
import arrowDownIcon from '~icons/bi/arrow-down'
import arrowUpIcon from '~icons/bi/arrow-up'
import bellIcon from '~icons/bi/bell-fill'
import chatIcon from '~icons/bi/chat-dots'
import checkIcon from '~icons/bi/check'
import questionIcon from '~icons/bi/question-lg'
import questionSquareIcon from '~icons/bi/question-square'
import trashIcon from '~icons/bi/trash'
import priorityIcon from '~icons/ic/round-priority-high'
import { SupportTicketThread, type TicketWithMember } from './SupportTicketThread'

/** Which columns: the open tab's, a closed one's, or those of "all", which add the state. */
export type SupportTableKind = 'open' | 'closed' | 'all'

interface Attrs {
  tickets: ListedSupportTicket[]
  kind: SupportTableKind
  /** each row a card */
  phone: boolean
  class?: string
}

const LIST_AVATAR_SIZE = 48

// The symbols of the creation page's list, for the same states (SUA-007). Functions, not vnodes:
// Mithril draws a vnode in one place only.
const STATUS_ICONS: Record<ListedSupportTicket['status'], () => Children> = {
  OPEN: () => m.trust(bellIcon),
  IN_PROGRESS: () => m.trust(questionSquareIcon),
  CLOSED: () => m.trust(checkIcon),
  DELETED: () =>
    icon(trashIcon.replace(/width="[^"]*" height="[^"]*"/, 'width="24" height="24"'), {
      class: 'p-1',
      style: 'background-color: #dc3545; color: white',
    }),
}

// The one symbol of the details button, as on the creation page: while the row is open the arrow
// turned up; closed, what is going on -- what waits for the moderation in yellow --, and without a
// conversation the arrow that opens the row.
const DETAILS_ICONS: Record<'question' | 'answer' | 'conversation', () => Children> = {
  question: () => m.trust(questionIcon),
  answer: () => icon(priorityIcon, { class: 'details-signal' }),
  conversation: () => m.trust(chatIcon),
}

const detailsIcon = (state: DetailsState) =>
  state === 'question' || state === 'answer' || state === 'conversation'
    ? DETAILS_ICONS[state]()
    : m.trust(arrowDownIcon)

const formatDate = (date: string | null) => (date ? d(new Date(date)) : '—')

// its name, for a screen reader and as a tooltip: the word, and what the symbol shows beside it
const detailsName = (ticket: ListedSupportTicket, showing: boolean) => {
  if (showing) {
    return t('hide_details')
  }
  const state = ticketDetailsState(ticket)
  return state ? `${t('details')} – ${t(`contribution.detailsState.${state}`)}` : t('details')
}

const avatar = (user: ListedSupportTicket['user'], className?: string) => {
  if (!user) {
    return null
  }
  const { letters, colorSeed, colorIndex } = avatarLettering(user)
  const src = memberAvatarSource(user)
  const name = user.alias || `${user.firstName} ${user.lastName}`.trim()
  return m(MemberAvatar, {
    class: className,
    size: LIST_AVATAR_SIZE,
    initials: letters,
    colorSeed,
    colorIndex,
    src,
    name,
    onzoom: src ? () => openMemberAvatarZoom(user, src, name) : undefined,
  })
}

// The group as text (K2: the choice to hand it on comes with K4), "(ohne Gruppe)" where none.
const groupOf = (ticket: ListedSupportTicket) =>
  ticket.creationGroupTag
    ? m('.fw-bold.mb-1', ticket.creationGroupName || ticket.creationGroupTag)
    : m('.mb-1', m('span.fst-italic.text-muted', t('contribution.noGroup')))

/**
 * The support requests of a tab of the support page: at the desk a row each, on a phone a card
 * each. A row opens below it to read the request's thread. The words of a request stand as text,
 * with their line breaks, at most six lines until the row is opened.
 */
export class SupportTicketsTable implements ClassComponent<Attrs> {
  private open: number | null = null
  private shownList: ListedSupportTicket[] = []

  view({ attrs }: Vnode<Attrs>) {
    const { tickets, kind, phone } = attrs
    if (tickets !== this.shownList) {
      this.shownList = tickets
      this.open = null
    }
    // The moderator's own request stands in the list like any other, but they do not open it here:
    // on it they are the member (SUA-018), and the server hands its thread only to the wallet.
    const myself = (ticket: ListedSupportTicket) =>
      ticket.user !== null && isTheModerator(adminStore.moderator, ticket.user)
    const canOpen = (ticket: ListedSupportTicket): ticket is TicketWithMember =>
      ticket.user !== null && !myself(ticket)

    const detailsButton = (ticket: ListedSupportTicket, classes: string) => {
      if (!canOpen(ticket)) {
        return null
      }
      const showing = this.open === ticket.id
      const name = detailsName(ticket, showing)
      return m(
        'button.btn',
        {
          type: 'button',
          class: classes,
          title: name,
          'aria-label': name,
          'aria-expanded': String(showing),
          onclick: () => {
            this.open = showing ? null : ticket.id
          },
        },
        showing ? m.trust(arrowUpIcon) : detailsIcon(ticketDetailsState(ticket)),
      )
    }
    const words = (ticket: ListedSupportTicket) => {
      const closing = closingLine(ticket)
      return [
        m(
          'div',
          {
            class: this.open === ticket.id ? 'support-ticket-text' : 'support-ticket-text clamped',
            'data-test': 'support-ticket-text',
          },
          ticket.text,
        ),
        closing ? m('small.no-select', [m('hr'), ` ${closing}`]) : null,
      ]
    }

    const desk: Record<string, Field<ListedSupportTicket>> = {
      status: {
        key: 'status',
        label: t('status'),
        cell: (ticket) => STATUS_ICONS[ticket.status](),
      },
      name: {
        key: 'name',
        label: t('name'),
        class: 'no-select',
        cell: ({ user }) =>
          user
            ? m('.d-flex.align-items-start.gap-3', [
                m('span.flex-grow-1', [
                  `${user.firstName} ${user.lastName} `,
                  user.alias ? m('small', [m('hr'), ` ${user.alias}`]) : null,
                ]),
                avatar(user),
              ])
            : null,
      },
      request: {
        key: 'request',
        label: t('support.request'),
        class: 'text-break',
        cell: (ticket) => [groupOf(ticket), words(ticket)],
      },
      sent: {
        key: 'sent',
        label: t('support.sent'),
        class: 'no-select',
        cell: (ticket) => formatDate(ticket.createdAt),
      },
      closedAt: {
        key: 'closedAt',
        label: t('support.closedAt'),
        class: 'no-select',
        cell: (ticket) => formatDate(ticket.closedAt),
      },
      details: {
        key: 'details',
        label: t('details'),
        cell: (ticket) => detailsButton(ticket, 'btn-md btn-secondary'),
      },
    }

    // A card: its head with face, name, username and date, the group, the words in full width, the
    // button below.
    const card: Field<ListedSupportTicket>[] = [
      {
        key: 'phoneHead',
        label: '',
        cell: (ticket) =>
          m('.phone-head', [
            m('.phone-face', avatar(ticket.user)),
            // min-width 0: a long alias is cut off here instead of widening the card
            m('div', { style: 'min-width: 0' }, [
              m('span.fw-semibold.text-break', [
                kind === 'all' ? m('span.me-1', STATUS_ICONS[ticket.status]()) : null,
                ticket.user ? `${ticket.user.firstName} ${ticket.user.lastName}`.trim() : '',
              ]),
              m('.d-flex.justify-content-between.gap-2', [
                m('span.small.text-truncate', { style: 'min-width: 0' }, ticket.user?.alias ?? ''),
                m('span.small.text-nowrap', formatDate(ticket.createdAt)),
              ]),
              isOpenTicket(ticket)
                ? null
                : m(
                    '.small.text-body-secondary',
                    `${t('support.closedAt')} ${formatDate(ticket.closedAt)}`,
                  ),
            ]),
            m('.phone-group', { style: 'grid-column: 2' }, groupOf(ticket)),
          ]),
      },
      {
        key: 'phoneText',
        label: '',
        class: 'text-break',
        cell: words,
      },
      {
        key: 'phoneActions',
        label: '',
        cell: (ticket) =>
          m(
            '.phone-actions.d-flex.align-items-center.gap-2.justify-content-end',
            detailsButton(ticket, 'btn-md btn-secondary phone-icon-btn'),
          ),
      },
    ]

    const columns = {
      open: ['name', 'request', 'sent', 'details'],
      closed: ['name', 'request', 'sent', 'closedAt', 'details'],
      all: ['status', 'name', 'request', 'sent', 'closedAt', 'details'],
    }[kind].map((key) => desk[key])

    return m(
      '.open-creations-table.support-tickets-table',
      { class: attrs.class },
      m(Table<ListedSupportTicket>, {
        rows: tickets,
        fields: phone ? card : columns,
        class: 'caption-top table-hover b-table-stacked-lg table-striped',
        labelStacked: false,
        rowKey: (ticket) => ticket.id,
        rowClass: ticketRowTone,
        details: (ticket) =>
          this.open === ticket.id && canOpen(ticket)
            ? m(
                '.card.shadow-lg.ps-3.pe-3.mb-5.rounded.row-details-card',
                m('.card-body', m(SupportTicketThread, { ticket })),
              )
            : null,
      }),
    )
  }
}
