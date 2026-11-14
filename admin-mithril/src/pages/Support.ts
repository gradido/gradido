// AI-GENERATED — not an architecture reference
import { adminListSupportTickets } from '@admin/graphql/supportTickets.graphql'
import { keepLastTab, lastTab } from '@admin/utils/lastSearch'
import m, { type ClassComponent } from 'mithril'
import * as v from 'valibot'
import { Pagination } from '@/components/bootstrap/Pagination'
import { Tabs } from '@/components/bootstrap/Tabs'
import {
  type SupportTableKind,
  SupportTicketsTable,
} from '@/components/support/SupportTicketsTable'
import { toastError } from '@/components/Toasts'
import { type ListedSupportTicket, supportTicketListSchema } from '@/data/SupportTicket.schema'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import { adminStore } from '@/store/admin.store'
import { askMemberAvatars } from '@/store/memberAvatars.store'
import { isPhone } from '@/viewport'
import bellIcon from '~icons/bi/bell-fill'
import checkIcon from '~icons/bi/check'
import listIcon from '~icons/bi/list'
import trashIcon from '~icons/bi/trash'

// the page the last tab is kept for (lastSearch.ts)
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

/**
 * The support requests of the moderator's groups (K2), under one tab per state, 25 to a page, the
 * newest first; a request opens below its row to be read. The tab is kept for each moderator on
 * this device (lastSearch.ts). Answering comes with K3, search and group filter with K4.
 */
export class Support implements ClassComponent {
  private readonly moderator = adminStore.moderator
  private tab = lastTab(LAST_SEARCH_PAGE, this.moderator?.gradidoID, TABS.length)
  private page = 1
  private tickets: ListedSupportTicket[] = []
  private count = 0
  // the question last asked: an answer to one before is dropped
  private asked = 0

  oninit() {
    this.load()
  }

  private async load() {
    const asked = ++this.asked
    const answer = await graphqlRequest(adminListSupportTickets, {
      statuses: TABS[this.tab].states,
      currentPage: this.page,
      pageSize: PAGE_SIZE,
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
    this.tickets = tickets
    this.count = count
    askMemberAvatars(tickets.flatMap((ticket) => ticket.user ?? []))
  }

  view() {
    const phone = isPhone()
    return m('.support-tickets.mt-2', [
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
            this.tickets = []
            this.page = 1
            this.load()
          },
          // on a phone the symbol stands above the word (App.css)
          tabs: TABS.map(({ icon, tone, word }) => ({
            title: [
              m.trust(tone ? icon.replace('<svg ', `<svg class="${tone}" `) : icon),
              ' ',
              m('span.tab-word', t(word)),
            ],
          })),
        }),
      ),
      m(SupportTicketsTable, {
        class: 'mt-4',
        tickets: this.tickets,
        kind: TABS[this.tab].kind,
        phone,
      }),
      // on a phone `‹`, three numbers and `›`; at the desk five places with the ellipses, and « »
      m(Pagination, {
        class: 'justify-content-center pagination-lg b-pagination-pills phone-pager',
        page: this.page,
        pages: Math.ceil(this.count / PAGE_SIZE),
        limit: phone ? 3 : 5,
        noEndButtons: phone,
        onpage: (page: number) => {
          this.page = page
          this.load()
        },
      }),
    ])
  }
}
