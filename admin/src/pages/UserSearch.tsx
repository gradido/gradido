// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { BButton, BPagination } from 'bootstrap-vue-next'
import { computed, defineComponent, reactive, ref, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAppToast } from '@/composables/useToast'
import { useViewport } from '@/composables/useViewport'
import { DESK_PAGER_LIMIT, PHONE_PAGER_LIMIT } from '@/constants'
import { useAdminStore } from '@/store/useAdminStore'
import { keepLastSearch, lastSearch } from '@/utils/lastSearch'
import IBiEnvelope from '~icons/bi/envelope'
import IBiXCircle from '~icons/bi/x-circle'
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

export const UserSearch = defineComponent({
  name: 'UserSearch',
  setup() {
    const { t } = useI18n()

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
    // Whether the first answer still has to show that the kept search finds somebody.
    let keptSearchOnTrial = linkSearch === null && criteria.value !== ''
    const filters = reactive<{ byActivated: boolean | null; byDeleted: boolean | null }>({
      byActivated: null,
      byDeleted: null,
    })
    const rows = ref(0)
    const currentPage = ref(1)
    const perPage = ref(25)
    const response = ref()

    const { creationLabel, creationMonthShorts } = useCreationMonths()
    const { toastSuccess } = useAppToast()

    // Below the phone boundary every member is a card. `unknown` -- no matchMedia -- keeps the
    // desk: nothing changes where the browser cannot be asked.
    const viewport = useViewport()
    const phone = computed(() => viewport.value === 'mobile')

    const { result, refetch } = useQuery(searchUsers, {
      query: criteria.value,
      filters,
      currentPage: currentPage.value,
      pageSize: perPage.value,
      order: 'DESC',
      fetchPolicy: 'no-cache',
    })
    response.value = result.value

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

    const unconfirmedRegisterMails = () => {
      keptSearchOnTrial = false
      filters.byActivated = filters.byActivated === null ? false : null
      refetch()
    }

    const deletedUserSearch = () => {
      keptSearchOnTrial = false
      filters.byDeleted = filters.byDeleted === null ? true : null
      refetch()
    }

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
      // { key: 'has_elopage', label: 'elopage' },
      // { key: 'transactions_list', label: t('transaction') },
      { key: 'status', label: t('status') },
    ])

    const fields = computed(() =>
      // On a phone the table stacks its cells (`stacked='lg'`), and a stacked row is a card: ONE
      // cell that says what the seven columns say, a line each (SearchUserTable, the slot
      // `cell(memberCard)`). Seven stacked cells were seven lines without their names.
      phone.value ? [{ key: 'memberCard', label: '' }] : deskFields.value,
    )

    watch(
      () => currentPage.value,
      async (newValue, oldValue) => {
        if (newValue !== oldValue) {
          await refetch({
            query: criteria.value,
            filters,
            currentPage: newValue,
            pageSize: perPage.value,
            order: 'DESC',
            fetchPolicy: 'no-cache',
          })
        }
      },
    )

    watch(
      () => criteria.value,
      async (newValue, oldValue) => {
        if (newValue !== oldValue) {
          keptSearchOnTrial = false
          // Only the query, as it was: the client keeps the other variables it holds
          await refetch({
            query: newValue,
          } as Parameters<typeof refetch>[0])
        }
      },
    )

    // A kept search that finds nobody any more -- a member whose account is gone -- gives way to
    // everybody (Bernd, 26.10.2026: "Sollte die Suche keine Treffer haben, schaltet es um auf
    // „Alle“"). On the first answer only: a search the moderator gives here, or an entry link's,
    // stays, also where it finds nobody. After the watcher above, which asks for everybody then:
    // the first answer can be here already, from the client's cache.
    watch(
      () => result.value,
      (answer) => {
        if (!keptSearchOnTrial || !answer) {
          return
        }
        keptSearchOnTrial = false
        if (answer.searchUsers.userCount === 0) {
          criteria.value = ''
        }
      },
      { immediate: true },
    )

    return () => (
      <div class='user-search'>
        <div class={classes.userSearchFirstDiv}>
          <BButton
            class='unconfirmedRegisterMails'
            variant='light'
            onClick={unconfirmedRegisterMails}
          >
            <IBiEnvelope style='color: #f5365c' />{' '}
            {filters.byActivated === null
              ? t('all_emails')
              : filters.byActivated === false
                ? t('unregistered_emails')
                : ''}
          </BButton>
          <BButton class='deletedUserSearch' variant='light' onClick={deletedUserSearch}>
            <IBiXCircle style='color: #f5365c' />{' '}
            {filters.byDeleted === null
              ? t('all_emails')
              : filters.byDeleted === true
                ? t('deleted_user')
                : ''}
          </BButton>
        </div>
        <label>{t('user_search')}</label>
        <UserQuery v-model={criteria.value} class='mb-4 mt-2' />
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
          v-model={currentPage.value}
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
