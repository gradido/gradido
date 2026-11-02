// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { BPagination, BTab, BTabs } from 'bootstrap-vue-next'
import { computed, defineComponent, nextTick, onMounted, ref, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAppToast } from '@/composables/useToast'
import { useViewport } from '@/composables/useViewport'
import { DESK_PAGER_LIMIT, PHONE_PAGER_LIMIT } from '@/constants'
import { useAdminStore } from '@/store/useAdminStore'
import { keepLastSearch, keepLastTab, lastSearch, lastTab } from '@/utils/lastSearch'
import IBiCheck from '~icons/bi/check'
import IBiEnvelope from '~icons/bi/envelope'
import IBiList from '~icons/bi/list'
import IBiTrash from '~icons/bi/trash'
import type { Role } from '../components/ChangeUserRoleFormular'
import { type MemberRow, SearchUserTable } from '../components/Tables/SearchUserTable'
import { UserQuery } from '../components/UserQuery'
import { useCreationMonths } from '../composables/useCreationMonths'
import { searchUsers } from '../graphql/searchUsers'
import classes from './UserSearch.module.css'

// a row of the search answer, as the table shows it
type SearchedMember = MemberRow

// The page the last search is kept for (utils/lastSearch.ts), as the router names it.
const LAST_SEARCH_PAGE = '/user'

// What each tab asks the server for, in the order of the tabs. They say what the status column
// says (SearchUserTable, statusBadges): a deleted member is deleted, whatever became of their
// address, so a member stands under one tab beside "all", and "unconfirmed" leaves the deleted out.
const STATUS_FILTERS = [
  { byActivated: null, byDeleted: null },
  { byActivated: true, byDeleted: false },
  { byActivated: false, byDeleted: false },
  { byActivated: null, byDeleted: true },
]

export const UserSearch = defineComponent({
  name: 'UserSearch',
  setup() {
    const { t, locale } = useI18n()

    const route = useRoute()

    const searchResult = ref<SearchedMember[]>([])
    const store = useAdminStore()

    // The search of an entry link's address, else the last one this moderator left the page
    // with, whenever it was (utils/lastSearch.ts), as the first question: read once the page
    // stood, it asked for everybody first and then again. One text only, as `searchUsers` takes
    // one; a repeated parameter is no search. Kept again as it changes, the link's as well.
    const linkSearch = typeof route.query.search === 'string' ? route.query.search : null
    const criteria = ref(linkSearch ?? lastSearch(LAST_SEARCH_PAGE, store.moderator?.gradidoID))
    watch(
      criteria,
      (search) => keepLastSearch(LAST_SEARCH_PAGE, store.moderator?.gradidoID, search),
      { immediate: true },
    )
    // The tab: the one this moderator left the page on (utils/lastSearch.ts), from the first list
    // on, as on the creation page. The library's tabs choose their first tab while they register
    // one by one, and a tab set before is lost (bootstrap-vue-next 0.26.8, BTabs `findActive`):
    // they are shown it once they stand, and what the moderator picks there is the tab from then
    // on. An entry link looks for one member, whoever they are, so it opens on everybody.
    const tabIndex = ref(
      linkSearch === null
        ? lastTab(LAST_SEARCH_PAGE, store.moderator?.gradidoID, STATUS_FILTERS.length)
        : 0,
    )
    const shownTab = ref(0)
    watch(shownTab, (tab) => {
      if (tab >= 0) {
        tabIndex.value = tab
      }
    })
    watch(tabIndex, (tab) => keepLastTab(LAST_SEARCH_PAGE, store.moderator?.gradidoID, tab), {
      immediate: true,
    })
    onMounted(async () => {
      await nextTick()
      shownTab.value = tabIndex.value
    })
    // Whether the first answer still has to show that what is kept finds somebody.
    let keptOnTrial = linkSearch === null && (criteria.value !== '' || tabIndex.value !== 0)
    const rows = ref(0)
    const currentPage = ref(1)
    const perPage = ref(25)
    const response = ref()

    const { creationLabel, creationMonthShorts } = useCreationMonths()
    const { toastError, toastSuccess } = useAppToast()

    // Below the phone boundary every member is a card. `unknown` -- no matchMedia -- keeps the
    // desk: nothing changes where the browser cannot be asked.
    const viewport = useViewport()
    const phone = computed(() => viewport.value === 'mobile')

    // ⛔ A function, so that every change asks once, with all of what the page shows now. These
    // were values read when the page opened: a change of filter started the question over with
    // the text and the page of that moment, whatever the field and the pager said by then
    // (measured in the built admin interface, 30.10.2026). And `fetchPolicy` stood among them,
    // where it was a variable like any other and the client answered from its cache.
    const { result, error, onError } = useQuery(
      searchUsers,
      () => ({
        query: criteria.value,
        filters: STATUS_FILTERS[tabIndex.value],
        currentPage: currentPage.value,
        pageSize: perPage.value,
        order: 'DESC',
      }),
      { fetchPolicy: 'no-cache' },
    )
    response.value = result.value

    onError((failure) => {
      toastError(failure.message)
    })

    // The pager takes a page back to the number of pages it has, and on an empty list that is 0
    // (bootstrap-vue-next 0.26.8, BPagination `sanitizeCurrentPage`). The server refuses a page 0
    // (`Paginated`, @IsPositive), and the list would not answer again: the first page is the least.
    const shownPage = computed({
      get: () => currentPage.value,
      set: (page: number) => {
        currentPage.value = Math.max(page, 1)
      },
    })

    watchEffect(() => {
      if (result.value) {
        // ⛔ Copies, which this page may write to. It notes a new role and a deletion in the
        // rows it holds (updateRole, updateDeletedAt), and what the client hands out is
        // read-only: it freezes the answers it keeps. Written to the answer itself, both threw
        // -- a member deleted in their row was deleted on the server, and the page said nothing
        // (measured in the built admin interface, 13.10.2026).
        searchResult.value = result.value.searchUsers.userList.map((row: SearchedMember) => ({
          ...row,
        }))
        rows.value = result.value.searchUsers.userCount
      }
    })

    // A member the page does not hold throws here, as it did
    const rowOf = (userId: number) =>
      searchResult.value.find((obj) => obj.userId === userId) as SearchedMember

    const updateRole = (userId: number, role: Role | null) => {
      rowOf(userId).role = role
    }

    const updateDeletedAt = (userId: number, deletedAt: string | Date | null) => {
      const row = rowOf(userId)
      row.deletedAt = deletedAt
      // The pin behind the username goes with the account (MemberWalletLink): the server gives
      // a deleted member none, and this row is not asked for again. The table draws rows of its
      // own and notes the same there (SearchUserTable, updateDeletedAt); these are kept in step.
      if (deletedAt) {
        row.findableOnMap = false
      }
      toastSuccess(deletedAt ? t('user_deleted') : t('user_recovered'))
    }

    // While what was kept gives way, the answer on the page is the one about to be replaced.
    const givingWay = ref(false)

    // What the list answers: the number stands in a line of its own, also where it is 0. Nothing
    // before the first answer, which would be read out and replaced at once, and the line keeps
    // its height, so that the list does not move when the number comes (UserSearch.module.css).
    // Nothing either where the question failed: the rows are still those of the list before.
    const hits = computed(() =>
      result.value && !error.value && !givingWay.value
        ? t('userSearch.hits', { count: rows.value.toLocaleString(locale.value) }, rows.value)
        : '',
    )

    const deskFields = computed(() => [
      // The address stays whole: from 992px on, where the table stands, it fits in one piece
      // beside the username column (measured 23.10.2026 with a 36-character address).
      { key: 'email', label: t('e_mail') },
      { key: 'firstName', label: t('firstname') },
      { key: 'lastName', label: t('lastname') },
      // A username may always break inside a word: a name without a hyphen is one piece, and a
      // table gives a column at least its longest piece. Twenty characters needed more than the
      // column had below about 880 px (measured 23.10.2026, when the table stood from 768 px on).
      { key: 'alias', label: t('username'), tdClass: 'text-break' },
      {
        key: 'creation',
        label: creationLabel(),
        formatter: (value: unknown) => {
          return (value as number[]).join(' | ')
        },
      },
      { key: 'createdAt', label: t('registered_at') },
      // { key: 'show_details', label: t('details') },
      // { key: 'confirm_mail', label: t('confirmed') },
      // { key: 'transactions_list', label: t('transaction') },
      { key: 'status', label: t('status') },
    ])

    const fields = computed(() =>
      // On a phone the table stacks its cells (`stacked='lg'`), and a stacked row is a card: ONE
      // cell that says what the seven columns say, a line each (SearchUserTable, the slot
      // `cell(memberCard)`). Seven stacked cells were seven lines without their names.
      phone.value ? [{ key: 'memberCard', label: '' }] : deskFields.value,
    )

    // Another search or another tab is another list, which starts at its first page.
    watch([criteria, tabIndex], () => {
      keptOnTrial = false
      currentPage.value = 1
    })

    // What is kept and finds nobody any more -- a member whose account is gone, or a tab that is
    // empty by now -- gives way to everybody (Bernd, 26.10.2026: "Sollte die Suche keine Treffer
    // haben, schaltet es um auf „Alle“"). On the first answer only: a search the moderator gives
    // here, or an entry link's, stays, also where it finds nobody.
    watch(
      () => result.value,
      (answer) => {
        if (!answer) {
          return
        }
        givingWay.value = false
        // A page past the end of the list has nothing to show: one turned to while the answer for
        // a shorter list was under way, or the next one after a member left this tab.
        const lastPage = Math.max(Math.ceil(answer.searchUsers.userCount / perPage.value), 1)
        if (currentPage.value > lastPage) {
          currentPage.value = lastPage
        }
        if (!keptOnTrial) {
          return
        }
        keptOnTrial = false
        if (answer.searchUsers.userCount === 0) {
          givingWay.value = true
          criteria.value = ''
          tabIndex.value = 0
          shownTab.value = 0
        }
      },
      { immediate: true },
    )

    return () => (
      <div class='user-search'>
        <UserQuery v-model={criteria.value} class={['mb-3 mt-2', classes.searchField]} />
        {/* As on the contribution page: on a phone the symbol stands above the word (App.css). */}
        <BTabs v-model={shownTab.value} class='page-tabs' fill>
          <BTab>
            {{
              title: () => [
                <IBiList />,
                ' ',
                <span class='tab-word'>{t('userSearch.tabs.all')}</span>,
              ],
            }}
          </BTab>
          <BTab>
            {{
              title: () => [
                <IBiCheck class='text-success' />,
                ' ',
                <span class='tab-word'>{t('userSearch.tabs.enabled')}</span>,
              ],
            }}
          </BTab>
          <BTab>
            {{
              title: () => [
                <IBiEnvelope class='text-warning-emphasis' />,
                ' ',
                <span class='tab-word'>{t('userSearch.tabs.unconfirmed')}</span>,
              ],
            }}
          </BTab>
          <BTab>
            {{
              title: () => [
                <IBiTrash class='text-danger' />,
                ' ',
                <span class='tab-word'>{t('userSearch.tabs.deleted')}</span>,
              ],
            }}
          </BTab>
        </BTabs>
        <p class={classes.hits} role='status' data-test='user-search-hits'>
          {hits.value}
        </p>
        <SearchUserTable
          // no prop of SearchUserTable: it lands on the element, as it did
          {...({ type: 'PageUserSearch' } as object)}
          items={searchResult.value}
          fields={fields.value}
          creationMonths={creationMonthShorts()}
          onUpdate-role={updateRole}
          onUpdate-deleted-at={updateDeletedAt}
        />
        {/* As on the contribution page: on a phone `‹`, three numbers and `›`, at the desk five
            places with the ellipses, and « ». */}
        <BPagination
          v-model={shownPage.value}
          class='phone-pager'
          perPage={perPage.value}
          totalRows={rows.value}
          align='center'
          limit={phone.value ? PHONE_PAGER_LIMIT : DESK_PAGER_LIMIT}
          noGotoEndButtons={phone.value}
          pills
          size='lg'
        />
      </div>
    )
  },
})
