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
  memberSearchOf,
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
import checkLgIcon from '~icons/bi/check-lg'
import questionIcon from '~icons/bi/question-lg'
import questionSquareIcon from '~icons/bi/question-square'
import searchIcon from '~icons/bi/search'
import trashIcon from '~icons/bi/trash'
import priorityIcon from '~icons/ic/round-priority-high'
import { SupportTicketThread, type TicketWithMember } from './SupportTicketThread'

/** Which columns: the open tab's, a closed one's, or those of "all", which add the state. */
export type SupportTableKind = 'open' | 'closed' | 'all'

/** What the buttons of an open row do: close it with the tick, or delete it (K3, SUA-018). */
export type SupportDecision = 'close' | 'delete'

interface Attrs {
  tickets: ListedSupportTicket[]
  kind: SupportTableKind
  /** each row a card */
  phone: boolean
  /** a button of a row was pressed: the page asks first */
  ondecide: (ticket: ListedSupportTicket, decision: SupportDecision) => void
  /** the magnifier of a row: the page searches for its member */
  onsearch: (search: string) => void
  /** the form of an opened request wrote: the list and the count anew */
  onwritten: () => void
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
 * each. A row opens below it to read the request's thread and to answer it. The words of a request
 * stand as text, with their line breaks, at most six lines until the row is opened. An open row
 * has a button to delete it in front and one to close it at the end.
 */
export class SupportTicketsTable implements ClassComponent<Attrs> {
  private open: number | null = null
  private shownList: ListedSupportTicket[] = []

  view({ attrs }: Vnode<Attrs>) {
    const { tickets, kind, phone, ondecide, onsearch, onwritten } = attrs
    // The moderator's own request stands in the list like any other, but they do not open it here
    // nor act on it: on it they are the member (SUA-018), and the server refuses it to them.
    const myself = (ticket: ListedSupportTicket) =>
      ticket.user !== null && isTheModerator(adminStore.moderator, ticket.user)
    const canOpen = (ticket: ListedSupportTicket): ticket is TicketWithMember =>
      ticket.user !== null && !myself(ticket)
    // A new list -- after a write, or another page or tab -- leaves the opened row open where it
    // still stands in it: its thread loads anew of itself.
    if (tickets !== this.shownList) {
      this.shownList = tickets
      if (!tickets.some((ticket) => ticket.id === this.open && canOpen(ticket))) {
        this.open = null
      }
    }
    // Closing with the tick and deleting: only on the open tab, never on the own request. A
    // deleted member's request has them too: it does not open, and would else stay open for ever.
    const decides = (ticket: ListedSupportTicket) =>
      kind === 'open' && isOpenTicket(ticket) && !myself(ticket)
    const decideButton = (
      ticket: ListedSupportTicket,
      decision: SupportDecision,
      classes: string,
      svg: string,
    ) => {
      const name = decision === 'delete' ? t('delete') : t('support.close')
      return m(
        'button.btn',
        {
          type: 'button',
          class: classes,
          title: name,
          'aria-label': name,
          'data-test': `support-${decision}`,
          onclick: () => ondecide(ticket, decision),
        },
        m.trust(svg),
      )
    }

    // The magnifier searches for the member of the row (K4), in every tab, the moderator's own row
    // too: it only searches. No member, no magnifier.
    const searchButton = (ticket: ListedSupportTicket, classes: string) => {
      const search = memberSearchOf(ticket)
      const name = t('support.searchMember')
      return search
        ? m(
            'button.btn',
            {
              type: 'button',
              class: classes,
              title: name,
              'aria-label': name,
              'data-test': 'support-search-member',
              onclick: () => onsearch(search),
            },
            m.trust(searchIcon),
          )
        : null
    }

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
    // Six lines until the row is opened; a row that does not open (the own request, a deleted
    // member's) shows its words in full, or the rest could not be read at all.
    const words = (ticket: ListedSupportTicket) => {
      const closing = closingLine(ticket)
      const whole = this.open === ticket.id || !canOpen(ticket)
      return [
        m(
          'div',
          {
            class: whole ? 'support-ticket-text' : 'support-ticket-text clamped',
            'data-test': 'support-ticket-text',
          },
          ticket.text,
        ),
        closing ? m('small.no-select', [m('hr'), ` ${closing}`]) : null,
      ]
    }

    const desk: Record<string, Field<ListedSupportTicket>> = {
      delete: {
        key: 'delete',
        label: t('delete'),
        cell: (ticket) =>
          decides(ticket)
            ? m('div', decideButton(ticket, 'delete', 'btn-md btn-danger me-2', trashIcon))
            : null,
      },
      status: {
        key: 'status',
        label: t('status'),
        cell: (ticket) => STATUS_ICONS[ticket.status](),
      },
      search: {
        key: 'search',
        label: '',
        cell: (ticket) => searchButton(ticket, 'btn-md btn-link p-0 border-0 text-primary'),
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
      close: {
        key: 'close',
        label: t('support.close'),
        cell: (ticket) =>
          decides(ticket)
            ? m('div', decideButton(ticket, 'close', 'btn-md btn-success me-2', checkIcon))
            : null,
      },
    }

    // A card: its head with face, name, username and date, the group, the words in full width, the
    // buttons below -- to delete on the left, to open and to close on the right, as for a
    // contribution.
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
            // the magnifier below the face, as on a contribution's card
            m('.phone-search', searchButton(ticket, 'btn-md btn-link phone-icon-btn text-primary')),
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
          m('.phone-actions.d-flex.align-items-center.gap-2', [
            decides(ticket)
              ? decideButton(ticket, 'delete', 'btn-md btn-danger phone-icon-btn', trashIcon)
              : null,
            m('.d-flex.align-items-center.gap-2.ms-auto', [
              detailsButton(ticket, 'btn-md btn-secondary phone-icon-btn'),
              decides(ticket)
                ? decideButton(ticket, 'close', 'btn-md btn-success phone-icon-btn', checkLgIcon)
                : null,
            ]),
          ]),
      },
    ]

    // the magnifier in a narrow column of its own before the name, in every tab
    const columns = {
      open: ['delete', 'search', 'name', 'request', 'sent', 'details', 'close'],
      closed: ['search', 'name', 'request', 'sent', 'closedAt', 'details'],
      all: ['status', 'search', 'name', 'request', 'sent', 'closedAt', 'details'],
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
                m('.card-body', m(SupportTicketThread, { ticket, onwritten })),
              )
            : null,
      }),
    )
  }
}
