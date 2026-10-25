// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { BButton, BPagination } from 'bootstrap-vue-next'
import {
  computed,
  defineComponent,
  nextTick,
  onMounted,
  provide,
  reactive,
  ref,
  watch,
  watchEffect,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAppToast } from '@/composables/useToast'
import { useViewport } from '@/composables/useViewport'
import { DESK_PAGER_LIMIT, PHONE_PAGER_LIMIT } from '@/constants'
import {
  rollToRowAndHold,
  viewAddress,
  viewNumber,
  viewText,
  WAY_BACK_VIEW,
  whenReady,
  withoutView,
} from '@/utils/wayBackView'
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
    const route = useRoute()
    const router = useRouter()

    // The view the moderator stood in before the wallet, where the address brings it back
    // (utils/wayBackView.ts): the search, as the start of what the page asks; the page of the
    // list once the first list has come (whenReady, below), and the member to roll to in the
    // list of that page. The search was read from the address as the page was mounted, which
    // asked first for everybody and then again; now the first answer is for the search.
    const asked = route.query
    const askedPage = viewNumber(asked.page)
    const pageOfView = askedPage !== null && askedPage > 1 ? askedPage : null
    const askedMember = viewNumber(asked.member)
    const searchResult = ref<SearchedMember[]>([])
    const criteria = ref(viewText(asked.search) ?? '')
    const filters = reactive<{ byActivated: boolean | null; byDeleted: boolean | null }>({
      byActivated: null,
      byDeleted: null,
    })
    const rows = ref(0)
    const currentPage = ref(1)
    const perPage = ref(25)
    const response = ref()
    // Whether the page of the view is set: the member is looked for in the list that comes then.
    const viewApplied = ref(pageOfView === null)

    const rest = withoutView(asked, ['page', 'member'])
    if (rest) {
      router.replace({ query: rest })
    }

    // This view as an address, for a pin, a bubble or an arrow in a row (MemberWalletLink).
    provide(WAY_BACK_VIEW, (member) =>
      viewAddress('/user', {
        search: criteria.value,
        page: currentPage.value > 1 ? currentPage.value : null,
        member: member?.userId ?? null,
      }),
    )

    // Back from the wallet: the window rolls to the member's row in the list of the view, once,
    // and keeps it there a moment against the page being put back to its top (utils/wayBackView.ts).
    // A list that comes later stays where the moderator is.
    if (askedMember !== null) {
      const stopRolling = watch(searchResult, () => {
        if (!viewApplied.value) {
          return
        }
        stopRolling()
        nextTick(() => rollToRowAndHold(`[data-user-id="${askedMember}"]`))
      })
    }

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
      filters.byActivated = filters.byActivated === null ? false : null
      refetch()
    }

    const deletedUserSearch = () => {
      filters.byDeleted = filters.byDeleted === null ? true : null
      refetch()
    }

    onMounted(async () => {
      if (pageOfView !== null) {
        await whenReady(() => rows.value > 0)
        currentPage.value = pageOfView
        viewApplied.value = true
      }
    })

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
          // Only the query, as it was: the client keeps the other variables it holds
          await refetch({
            query: newValue,
          } as Parameters<typeof refetch>[0])
        }
      },
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
