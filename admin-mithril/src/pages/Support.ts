// AI-GENERATED — not an architecture reference
import { creationGroups } from '@admin/graphql/creationGroups.graphql'
import {
  adminCloseSupportTicket,
  adminDeleteSupportTicket,
  adminListSupportTickets,
} from '@admin/graphql/supportTickets.graphql'
import { keepLastSearch, keepLastTab, lastSearch, lastTab } from '@admin/utils/lastSearch'
// the creation page's rules for its tabs, under its class, which this page carries too
import '@admin/pages/CreationConfirm.css'
import m, { type ClassComponent } from 'mithril'
import * as v from 'valibot'
import { ConfirmModal } from '@/components/bootstrap/ConfirmModal'
import { Pagination } from '@/components/bootstrap/Pagination'
import { Tabs } from '@/components/bootstrap/Tabs'
import {
  type SupportDecision,
  type SupportTableKind,
  SupportTicketsTable,
} from '@/components/support/SupportTicketsTable'
import { ThemedSelect } from '@/components/ThemedSelect'
import { toastError, toastSuccess } from '@/components/Toasts'
import { UserQuery } from '@/components/UserQuery'
import { creationGroupNameSchema } from '@/data/CreationGroup.schema'
import { refusalWords, supportGroupFilterOptions } from '@/data/SupportTicket.logic'
import { type ListedSupportTicket, supportTicketListSchema } from '@/data/SupportTicket.schema'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import { adminStore } from '@/store/admin.store'
import { askMemberAvatars } from '@/store/memberAvatars.store'
import { askOpenSupportTickets } from '@/store/openSupportTickets.store'
import { isPhone } from '@/viewport'
import bellIcon from '~icons/bi/bell-fill'
import checkIcon from '~icons/bi/check'
import listIcon from '~icons/bi/list'
import trashIcon from '~icons/bi/trash'

// the page the last search and tab are kept for (lastSearch.ts)
const LAST_SEARCH_PAGE = '/support'
const PAGE_SIZE = 25

type State = ListedSupportTicket['status']

// What each tab shows, in their order: the symbols and colours of the creation page (SUA-007).
const TABS: {
  icon: string
  tone: string
  word: string
  states: State[]
  kind: SupportTableKind
}[] = [
  {
    icon: bellIcon,
    tone: 'text-primary',
    word: 'support.tab.open',
    states: ['OPEN', 'IN_PROGRESS'],
    kind: 'open',
  },
  {
    icon: checkIcon,
    tone: 'text-success',
    word: 'support.tab.closed',
    states: ['CLOSED'],
    kind: 'closed',
  },
  {
    icon: trashIcon,
    tone: 'text-danger',
    word: 'support.tab.deleted',
    states: ['DELETED'],
    kind: 'closed',
  },
  {
    icon: listIcon,
    tone: '',
    word: 'support.tab.all',
    states: ['OPEN', 'IN_PROGRESS', 'CLOSED', 'DELETED'],
    kind: 'all',
  },
]

// The two buttons of an open row (K3): what they send, what the question before says, and what
// is said after. Neither mails the member (SUA-018).
const DECISIONS = {
  close: {
    mutation: adminCloseSupportTicket,
    title: 'support.confirmClose.title',
    body: 'support.confirmClose.body',
    yes: 'support.confirmClose.yes',
    variant: 'success',
    done: 'support.closed',
  },
  delete: {
    mutation: adminDeleteSupportTicket,
    title: 'support.confirmDelete.title',
    body: 'support.confirmDelete.body',
    yes: 'support.confirmDelete.yes',
    variant: 'danger',
    done: 'support.deleted',
  },
} as const

const groupsSchema = v.object({
  creationGroups: v.array(creationGroupNameSchema),
})

/**
 * The support requests of the moderator's groups, under one tab per state, 25 to a page, the
 * newest first (K2), searched by text or by a member and filtered by group (K4); a request opens
 * below its row to be read and answered, and an open one is closed with the tick or deleted from
 * its row (K3). After every write -- done or refused -- the page asks for its list and for the
 * count of the open tab anew: what a request is now, the server says. The search and the tab are
 * kept for each moderator on this device (lastSearch.ts); the group filter opens on all they see.
 */
export class Support implements ClassComponent {
  private readonly moderator = adminStore.moderator
  private tab = lastTab(LAST_SEARCH_PAGE, this.moderator?.gradidoID, TABS.length)
  private query = lastSearch(LAST_SEARCH_PAGE, this.moderator?.gradidoID)
  private groups: v.InferOutput<typeof groupsSchema>['creationGroups'] = []
  // the first choice, all the moderator sees: their choices are known before the groups are
  private group = this.moderator ? supportGroupFilterOptions(this.moderator, [])[0].value : ''
  // A kept search that finds nothing any more gives way to the whole list -- on the first answer
  // only: a search given here stays, also where it finds nothing.
  private keptOnTrial = this.query !== ''
  private page = 1
  private tickets: ListedSupportTicket[] = []
  private count = 0
  // the question last asked: an answer to one before is dropped
  private asked = 0
  // the row button the moderator is asked about
  private decision: { ticket: ListedSupportTicket; decision: SupportDecision } | null = null
  // the requests a decision is on its way for: a second click sends nothing
  private readonly deciding = new Set<number>()

  oninit() {
    // in a request of its own, as the creation page asks: the groups are not support's to count
    graphqlRequest(creationGroups).then((answer) => {
      if (answer.success) {
        this.groups = v.parse(groupsSchema, answer.value).creationGroups
      }
    })
    this.load(this.page)
    askOpenSupportTickets()
  }

  /**
   * Asks for a page of the tab. The page counts as shown only once its requests are there: a page
   * that fails to come leaves the one before in place, list and pager alike. A page beyond the
   * last -- its last request just closed or deleted -- gives way to the last one there is.
   */
  private async load(page: number) {
    const asked = ++this.asked
    const answer = await graphqlRequest(adminListSupportTickets, {
      statuses: TABS[this.tab].states,
      currentPage: page,
      pageSize: PAGE_SIZE,
      query: this.query,
      creationGroup: this.group,
    })
    if (asked !== this.asked) {
      return
    }
    if (!answer.success) {
      toastError(t('support.loadFailed'))
      return
    }
    const { count, tickets } = v.parse(
      supportTicketListSchema,
      answer.value,
    ).adminListSupportTickets
    if (this.keptOnTrial && count === 0) {
      this.query = ''
      this.searchAnew()
      return
    }
    this.keptOnTrial = false
    const last = Math.max(1, Math.ceil(count / PAGE_SIZE))
    if (page > last) {
      this.load(last)
      return
    }
    this.page = page
    this.tickets = tickets
    this.count = count
    askMemberAvatars(tickets.flatMap((ticket) => ticket.user ?? []))
  }

  // A narrower or another list starts at its first page: a later one may not be in it. The one
  // way to load (load), page 1.
  private searchAnew() {
    this.keptOnTrial = false
    keepLastSearch(LAST_SEARCH_PAGE, this.moderator?.gradidoID, this.query)
    this.load(1)
  }

  /** After a write: the page as it is now, and the count of the open tab. */
  private written() {
    this.load(this.page)
    askOpenSupportTickets()
  }

  // The question closes before the yes is acted on (ConfirmModal): what was asked comes along.
  private async decide({
    ticket,
    decision,
  }: {
    ticket: ListedSupportTicket
    decision: SupportDecision
  }) {
    if (this.deciding.has(ticket.id)) {
      return
    }
    this.deciding.add(ticket.id)
    const answer = await graphqlRequest(DECISIONS[decision].mutation, {
      supportTicketId: ticket.id,
    })
    this.deciding.delete(ticket.id)
    if (answer.success) {
      toastSuccess(t(DECISIONS[decision].done))
    } else {
      toastError(refusalWords(answer.error.messages, { note: false }))
    }
    this.written()
  }

  view() {
    const phone = isPhone()
    const pending = this.decision
    const asked = pending ? DECISIONS[pending.decision] : null
    // `creation-confirm` as well: the rules of the creation page's search row and tabs hold here
    return m('.support-tickets.creation-confirm.mt-2', [
      // the search and the group side by side; on a narrow window one above the other
      m('.creation-filters.mt-2.mb-2', [
        m(UserQuery, {
          class: 'creation-search',
          placeholder: t('user_memo_search'),
          value: this.query,
          oninput: (query: string) => {
            this.query = query
            this.searchAnew()
          },
        }),
        m(ThemedSelect, {
          class: 'creation-group-filter',
          'data-test': 'support-group-filter',
          value: this.group,
          options: this.moderator ? supportGroupFilterOptions(this.moderator, this.groups) : [],
          onchange: (group: string) => {
            this.group = group
            this.searchAnew()
          },
        }),
      ]),
      m(
        'div',
        m(Tabs, {
          class: 'creation-tabs page-tabs',
          contentClass: 'mt-3',
          fill: true,
          active: this.tab,
          onchange: (tab: number) => {
            this.tab = tab
            keepLastTab(LAST_SEARCH_PAGE, this.moderator?.gradidoID, tab)
            // the tab before goes at once, its pages too: none of them may be asked for in this one;
            // the search and the group stay
            this.tickets = []
            this.count = 0
            this.page = 1
            this.searchAnew()
          },
          // on a phone the symbol stands above the word (App.css) and the number at the corner of
          // the tab (CreationConfirm.css)
          tabs: TABS.map(({ icon, tone, word }, index) => ({
            title: [
              m.trust(tone ? icon.replace('<svg ', `<svg class="${tone}" `) : icon),
              ' ',
              m('span.tab-word', t(word)),
              ' ',
              index === 0 && adminStore.openSupportTickets > 0
                ? m('span.badge.text-bg-danger.tab-badge', adminStore.openSupportTickets)
                : null,
            ],
          })),
        }),
      ),
      m(SupportTicketsTable, {
        class: 'mt-4',
        tickets: this.tickets,
        kind: TABS[this.tab].kind,
        phone,
        ondecide: (ticket: ListedSupportTicket, decision: SupportDecision) => {
          this.decision = { ticket, decision }
        },
        onsearch: (search: string) => {
          this.query = search
          this.searchAnew()
        },
        onwritten: () => this.written(),
      }),
      // on a phone `‹`, three numbers and `›`; at the desk five places with the ellipses, and « »
      m(Pagination, {
        class: 'justify-content-center pagination-lg b-pagination-pills phone-pager',
        page: this.page,
        pages: Math.ceil(this.count / PAGE_SIZE),
        limit: phone ? 3 : 5,
        noEndButtons: phone,
        onpage: (page: number) => this.load(page),
      }),
      pending && asked
        ? m(ConfirmModal, {
            title: t(asked.title),
            body: t(asked.body),
            yes: t(asked.yes),
            variant: asked.variant,
            onyes: () => this.decide(pending),
            onclose: () => {
              this.decision = null
            },
          })
        : null,
    ])
  }
}
