// AI-GENERATED — not an architecture reference
import { searchUsers } from '@admin/graphql/searchUsers'
import classes from '@admin/pages/UserSearch.module.css'
import { keepLastSearch, keepLastTab, lastSearch, lastTab } from '@admin/utils/lastSearch'
import m, { type ClassComponent } from 'mithril'
import * as v from 'valibot'
import { Pagination } from '@/components/bootstrap/Pagination'
import { Tabs } from '@/components/bootstrap/Tabs'
import { SearchUserTable } from '@/components/SearchUserTable'
import { toastError } from '@/components/Toasts'
import { UserQuery } from '@/components/UserQuery'
import { MemberDetails } from '@/components/userSearch/MemberDetails'
import { creationMonthShorts } from '@/data/CreationMonths.logic'
import { type SearchedMember, searchUsersSchema } from '@/data/SearchedMember.schema'
import { graphqlRequest } from '@/graphql/client'
import { n, t } from '@/i18n'
import { adminStore } from '@/store/admin.store'
import { isPhone } from '@/viewport'
import checkIcon from '~icons/bi/check'
import envelopeIcon from '~icons/bi/envelope'
import listIcon from '~icons/bi/list'
import trashIcon from '~icons/bi/trash'

// the page the last search is kept for (lastSearch.ts), as the old router named it
const LAST_SEARCH_PAGE = '/user'
const PAGE_SIZE = 25

// What each tab asks for, in their order. A deleted member is deleted, whatever became of their
// address: a member stands under one tab beside "all", and "unconfirmed" leaves the deleted out.
const TABS = [
  {
    icon: listIcon,
    tone: '',
    word: 'userSearch.tabs.all',
    filters: { byActivated: null, byDeleted: null },
  },
  {
    icon: checkIcon,
    tone: 'text-success',
    word: 'userSearch.tabs.enabled',
    filters: { byActivated: true, byDeleted: false },
  },
  {
    icon: envelopeIcon,
    tone: 'text-warning-emphasis',
    word: 'userSearch.tabs.unconfirmed',
    filters: { byActivated: false, byDeleted: false },
  },
  {
    icon: trashIcon,
    tone: 'text-danger',
    word: 'userSearch.tabs.deleted',
    filters: { byActivated: null, byDeleted: true },
  },
]

/**
 * The members of the community: a search by text, under one tab per state, a page of 25 at a
 * time. The search and the tab are kept for each moderator on this device (lastSearch.ts); an
 * entry link (`/user?search=…`) brings its own search and opens on everybody.
 */
export class UserSearch implements ClassComponent {
  private criteria = ''
  private tab = 0
  private page = 1
  private members: SearchedMember[] = []
  private count = 0
  // the hits are said once an answer is there, and not after a failed one
  private answered = false
  // What is kept and finds nobody any more gives way to everybody -- on the first answer only:
  // a search typed here, or an entry link's, stays, also where it finds nobody.
  private keptOnTrial = false
  private open: number | null = null
  // the question last asked: an answer to one before is dropped
  private asked = 0

  oninit() {
    const moderator = adminStore.moderator?.gradidoID
    const linkSearch = m.route.param('search')
    this.criteria =
      typeof linkSearch === 'string' ? linkSearch : lastSearch(LAST_SEARCH_PAGE, moderator)
    this.tab =
      typeof linkSearch === 'string' ? 0 : lastTab(LAST_SEARCH_PAGE, moderator, TABS.length)
    this.keptOnTrial = typeof linkSearch !== 'string' && (this.criteria !== '' || this.tab !== 0)
    this.keep()
    this.load()
  }

  private keep() {
    const moderator = adminStore.moderator?.gradidoID
    keepLastSearch(LAST_SEARCH_PAGE, moderator, this.criteria)
    keepLastTab(LAST_SEARCH_PAGE, moderator, this.tab)
  }

  private async load() {
    const asked = ++this.asked
    const answer = await graphqlRequest(searchUsers, {
      query: this.criteria,
      filters: TABS[this.tab].filters,
      currentPage: this.page,
      pageSize: PAGE_SIZE,
      order: 'DESC',
    })
    if (asked !== this.asked) {
      return
    }
    if (!answer.success) {
      // the rows stay those of the list before, and say no number
      this.answered = false
      toastError(answer.error.message)
      return
    }
    const { userCount, userList } = v.parse(searchUsersSchema, answer.value).searchUsers
    if (this.keptOnTrial && userCount === 0) {
      this.criteria = ''
      this.tab = 0
      this.searchAnew()
      return
    }
    this.keptOnTrial = false
    // a new list starts with every row closed
    this.open = null
    this.members = userList
    this.count = userCount
    this.answered = true
    // a page past the end has nothing to show: one turned to while a shorter list was under way
    const lastPage = Math.max(Math.ceil(userCount / PAGE_SIZE), 1)
    if (this.page > lastPage) {
      this.page = lastPage
      this.load()
    }
  }

  // another search or another tab is another list, from its first page
  private searchAnew() {
    this.keptOnTrial = false
    this.page = 1
    this.keep()
    this.load()
  }

  view() {
    const phone = isPhone()
    return m('.user-search', [
      m(UserQuery, {
        class: `mb-3 mt-2 ${classes.searchField}`,
        value: this.criteria,
        oninput: (criteria: string) => {
          this.criteria = criteria
          this.searchAnew()
        },
      }),
      // as on the contribution page: on a phone the symbol stands above the word (App.css)
      m(Tabs, {
        class: 'page-tabs',
        fill: true,
        active: this.tab,
        onchange: (tab: number) => {
          this.tab = tab
          this.searchAnew()
        },
        tabs: TABS.map(({ icon, tone, word }) => ({
          title: [
            m.trust(tone ? icon.replace('<svg ', `<svg class="${tone}" `) : icon),
            ' ',
            m('span.tab-word', t(word)),
          ],
        })),
      }),
      // a line of its own also before the number is there: the list does not move when it comes
      m(
        'p',
        { class: classes.hits, role: 'status', 'data-test': 'user-search-hits' },
        this.answered ? t('userSearch.hits', { count: n(this.count) }, this.count) : '',
      ),
      m(SearchUserTable, {
        members: this.members,
        creationMonths: creationMonthShorts(),
        cards: phone,
        open: this.open,
        ontoggle: (userId: number) => {
          this.open = this.open === userId ? null : userId
        },
        details: (member: SearchedMember) => m(MemberDetails, { member }),
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
