// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { BButton, BPagination } from 'bootstrap-vue-next'
import { computed, defineComponent, onMounted, reactive, ref, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAppToast } from '@/composables/useToast'
import { useViewport } from '@/composables/useViewport'
import { DESK_PAGER_LIMIT, PHONE_PAGER_LIMIT } from '@/constants'
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

export const UserSearch = defineComponent({
  name: 'UserSearch',
  setup() {
    const { t } = useI18n()

    const searchResult = ref<SearchedMember[]>([])
    const criteria = ref('')
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
    const route = useRoute()

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
      filters.byActivated = filters.byActivated === null ? false : null
      refetch()
    }

    const deletedUserSearch = () => {
      filters.byDeleted = filters.byDeleted === null ? true : null
      refetch()
    }

    onMounted(() => {
      const searchQuery = route.query.search
      if (searchQuery) {
        criteria.value = searchQuery as string
      }
    })

    const deskFields = computed(() => [
      // user-search-narrow-break: see UserSearch.module.css. With the username column the
      // address no longer fits in one piece just above 768 px.
      { key: 'email', label: t('e_mail'), tdClass: 'user-search-narrow-break' },
      { key: 'firstName', label: t('firstname') },
      { key: 'lastName', label: t('lastname') },
      // A username may always break inside a word: twenty characters without a hyphen are
      // wider than the column gets below about 880 px.
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
      // On a phone the table stacks its cells (`stacked='md'`), and a stacked row is a card: ONE
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
          // Only the query, as it was: the client keeps the other variables it holds
          await refetch({
            query: newValue,
          } as Parameters<typeof refetch>[0])
        }
      },
    )

    return () => (
      <div class={['user-search', classes.userSearch]}>
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
