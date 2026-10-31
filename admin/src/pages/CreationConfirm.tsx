// AI-GENERATED — not an architecture reference
import { useApolloClient, useMutation, useQuery } from '@vue/apollo-composable'
import {
  BBadge,
  BButton,
  BModal,
  BPagination,
  BTab,
  BTabs,
  type ButtonVariant,
  useModal,
  vBTooltip,
} from 'bootstrap-vue-next'
import { computed, defineComponent, nextTick, onMounted, ref, watch, withDirectives } from 'vue'
import { useI18n } from 'vue-i18n'
import { ThemedSelect } from '@/components/ThemedSelect'
import { useDateFormatter } from '@/composables/useDateFormatter'
import { fetchMemberAvatars } from '@/composables/useMemberAvatars'
import { useAppToast } from '@/composables/useToast'
import { useViewport } from '@/composables/useViewport'
import { CONFIG } from '@/config'
import { DESK_PAGER_LIMIT, PHONE_PAGER_LIMIT } from '@/constants'
import { useAdminStore } from '@/store/useAdminStore'
import { creationGroupOption } from '@/utils/creationGroupLabel'
import { keepLastSearch, keepLastTab, lastSearch, lastTab } from '@/utils/lastSearch'
import IBiBellFill from '~icons/bi/bell-fill'
import IBiCheck from '~icons/bi/check'
import IBiList from '~icons/bi/list'
import IBiTrash from '~icons/bi/trash'
import IBiXCircle from '~icons/bi/x-circle'
import { AiChat } from '../components/AiChat'
import { CreaEvaluationModal } from '../components/CreaEvaluationModal'
import { type DecisionItem, DecisionModal } from '../components/DecisionModal'
import { type Contribution, OpenCreationsTable } from '../components/Tables/OpenCreationsTable'
import { UserQuery } from '../components/UserQuery'
import { adminDeleteContribution } from '../graphql/adminDeleteContribution'
import {
  adminListContributions,
  adminListContributionsCount,
} from '../graphql/adminListContributions.graphql'
import { adminUpdateContribution } from '../graphql/adminUpdateContribution'
import { confirmContribution } from '../graphql/confirmContribution'
import { assignContributionCreationGroups, creationGroups } from '../graphql/creationGroups.graphql'
import { denyContribution } from '../graphql/denyContribution'
import { getContribution } from '../graphql/getContribution.graphql'
import './CreationConfirm.css'

type ListVariables = {
  filter: {
    statusFilter: string[]
    query: string
    hideResubmission: boolean
    creationGroup: string
  }
  paginated: { currentPage: number; pageSize: number; order?: string }
}

// The names a session stored before the rename (see seesAllCreationGroups below).
type PreRenameModerator = { seesAllGroups?: boolean; visibleGroupTags?: string[] } | null

type CreationGroup = { tag: string; name?: string | null }

type Field = {
  key: string
  label: string
  class?: string
  formatter?: (value: unknown) => string
}

type ResubmissionSaved = {
  id: number
  resubmissionAt: string | null
  unchanged?: boolean
}

const FILTER_TAB_MAP = [
  ['IN_PROGRESS', 'PENDING'],
  ['CONFIRMED'],
  ['DENIED'],
  ['DELETED'],
  ['IN_PROGRESS', 'PENDING', 'CONFIRMED', 'DENIED', 'DELETED'],
]

// The tab that mixes every state; its rows say on their own which one they are in.
const ALL_TAB = 4

// The page the last search and tab are kept for (utils/lastSearch.ts), as the router names it.
const LAST_SEARCH_PAGE = '/creation-confirm'

export const CreationConfirm = defineComponent({
  name: 'CreationConfirm',
  setup() {
    const store = useAdminStore()
    const { t } = useI18n()
    const { toastError, toastSuccess, toastWarning } = useAppToast()

    // The tab: the one this moderator left the page on (utils/lastSearch.ts), from the first list
    // on. The library's tabs choose their first tab while they register one by one, and a tab
    // set before is lost (bootstrap-vue-next 0.26.8, BTabs `findActive`): they are shown it once
    // they stand, and what the moderator picks there is the tab from then on.
    const tabIndex = ref(
      lastTab(LAST_SEARCH_PAGE, store.moderator?.gradidoID, FILTER_TAB_MAP.length),
    )
    const shownTab = ref(0)
    watch(shownTab, (tab) => {
      if (tab >= 0) {
        tabIndex.value = tab
      }
    })
    watch(tabIndex, (tab) => keepLastTab(LAST_SEARCH_PAGE, store.moderator?.gradidoID, tab))
    onMounted(async () => {
      await nextTick()
      shownTab.value = tabIndex.value
    })
    const { client: apolloClient } = useApolloClient()
    const items = ref<Contribution[]>([])
    const overlay = ref(false)
    const item = ref<Contribution>({} as Contribution)
    const variant = ref('confirm')
    const rows = ref(0)
    const currentPage = ref(1)
    const pageSize = ref(25)
    // The search: the last one this moderator left the page with, whenever it was
    // (utils/lastSearch.ts), and kept again as it changes -- typed into the field above the
    // table, or a member picked with the magnifier of a row, which is their e-mail address here.
    const query = ref(lastSearch(LAST_SEARCH_PAGE, store.moderator?.gradidoID))
    watch(query, (search) => keepLastSearch(LAST_SEARCH_PAGE, store.moderator?.gradidoID, search))
    // Whether the first list still has to show that the kept search finds something (onResult).
    let keptSearchOnTrial = query.value !== ''
    // The count of the badges in the menu and on the tab, asked for on its own where the page
    // opens with a search: its list counts only what the search leaves (coderabbit, #4206). With
    // the start page's query; none where the page opens on the whole list, whose answer says it.
    if (keptSearchOnTrial) {
      apolloClient
        .query({
          query: adminListContributionsCount,
          variables: {
            filter: { statusFilter: ['IN_PROGRESS', 'PENDING'], hideResubmission: true },
          },
          fetchPolicy: 'network-only',
        })
        .then(({ data }) => store.setOpenCreations(data.adminListContributions.contributionCount))
        .catch(() => {
          // The badges keep the count they had; the list says on its own what went wrong.
        })
    }
    const hideResubmissionModel = ref(true)
    // Group functions: filter the contribution list by a single creation group.
    const creationGroup = ref('')

    const { formatDateOrDash } = useDateFormatter()

    // Below the phone boundary every row is a card. `unknown` -- no matchMedia -- keeps the
    // desk: nothing changes where the browser cannot be asked.
    const viewport = useViewport()
    const phone = computed(() => viewport.value === 'mobile')

    const baseFields: Record<string, Field> = {
      name: { key: 'name', label: t('name'), class: 'no-select' },
      firstName: { key: 'user.firstName', label: t('firstname'), class: 'no-select' },
      lastName: { key: 'user.lastName', label: t('lastname'), class: 'no-select' },
      amount: { key: 'amount', label: t('creation'), formatter: (value) => `${value} GDD` },
      memo: { key: 'memo', label: t('text'), class: 'text-break' },
      contributionDate: {
        key: 'contributionDate',
        label: t('created'),
        class: 'no-select',
        formatter: formatDateOrDash,
      },
      createdAt: {
        key: 'createdAt',
        label: t('createdAt'),
        class: 'no-select',
        formatter: formatDateOrDash,
      },
      closedAt: {
        key: 'closedAt',
        label: t('contributions.closed'),
        class: 'no-select',
        formatter: formatDateOrDash,
      },
    }

    const role = computed(() => store.moderator?.role ?? null)
    const isAdmin = computed(() => role.value === 'ADMIN')
    const isAiUser = computed(() => isAdmin.value || role.value === 'MODERATOR_AI')
    const showCreaChat = computed(() => CONFIG.ANTHROPIC_ACTIVE && isAiUser.value)
    // Who sees the Crea button: AI moderators on the open tab (0) and on the "all" tab (4) --
    // there only on still-open contributions (see creaOpenOnly), so they can jump straight
    // from a participant's history to an open item. Administrators additionally see it on the
    // dedicated confirmed/denied/deleted tabs to test Crea against the whole pool. Plain
    // moderators hold no AI_SEND_MESSAGE right and see no button. This only guides the UI --
    // the resolver's @Authorized guard is what actually enforces the right.
    const showCreaColumn = computed(() =>
      tabIndex.value === 0 || tabIndex.value === 4 ? isAiUser.value : isAdmin.value,
    )
    // The "all" tab (index 4) mixes open and closed contributions; there Crea shows only on
    // the open (blue) rows -- the ones still to be processed. Other tabs are single-status.
    const creaOpenOnly = computed(() => tabIndex.value === ALL_TAB)

    const fields = computed(() => {
      // On a phone the table stacks its cells (`stacked='lg'`), and a stacked row is a card: the
      // head with face, name, amount and date, the text in full width, the buttons below. The
      // same three cells on every tab: the state of a contribution decides what can be pressed
      // on its card, the tab only whether Crea is offered (`showCrea`).
      if (phone.value) {
        return [
          { key: 'phoneHead', label: '' },
          { key: 'phoneMemo', label: '', class: 'text-break' },
          { key: 'phoneActions', label: '' },
        ]
      }
      const tabFields = [
        // open contributions
        [
          { key: 'bookmark', label: t('delete') },
          { key: 'deny', label: t('deny') },
          { key: 'searchUser', label: '' },
          baseFields.name,
          baseFields.amount,
          baseFields.memo,
          baseFields.contributionDate,
          { key: 'creaEvaluate', label: t('crea.column') },
          { key: 'editCreation', label: t('details') },
          { key: 'confirm', label: t('save') },
        ],
        // confirmed contributions
        [
          { key: 'searchUser', label: '' },
          baseFields.name,
          baseFields.amount,
          baseFields.memo,
          baseFields.contributionDate,
          baseFields.createdAt,
          baseFields.closedAt,
          { key: 'creaEvaluate', label: t('crea.column') },
          { key: 'chatCreation', label: t('details') },
        ],
        // denied contributions
        [
          { key: 'searchUser', label: '' },
          baseFields.name,
          baseFields.amount,
          baseFields.memo,
          baseFields.contributionDate,
          baseFields.createdAt,
          baseFields.closedAt,
          { key: 'creaEvaluate', label: t('crea.column') },
          { key: 'chatCreation', label: t('details') },
        ],
        // deleted contributions
        [
          { key: 'searchUser', label: '' },
          baseFields.name,
          baseFields.amount,
          baseFields.memo,
          baseFields.contributionDate,
          baseFields.createdAt,
          baseFields.closedAt,
          { key: 'creaEvaluate', label: t('crea.column') },
          { key: 'chatCreation', label: t('details') },
        ],
        // all contributions
        [
          { key: 'contributionStatus', label: t('status') },
          { key: 'searchUser', label: '' },
          baseFields.name,
          baseFields.amount,
          baseFields.memo,
          baseFields.contributionDate,
          baseFields.createdAt,
          baseFields.closedAt,
          { key: 'creaEvaluate', label: t('crea.column') },
          { key: 'chatCreation', label: t('details') },
        ],
      ][tabIndex.value]

      return showCreaColumn.value
        ? tabFields
        : tabFields.filter((field) => field.key !== 'creaEvaluate')
    })

    const statusFilter = computed(() => [...FILTER_TAB_MAP[tabIndex.value]])

    const overlayTitle = computed(() => `overlay.${variant.value}.title`)
    const overlayText = computed(() => `overlay.${variant.value}.text`)
    const overlayQuestion = computed(() => `overlay.${variant.value}.question`)
    const overlayBtnText = computed(() => `overlay.${variant.value}.yes`)
    const overlayEvent = computed(() => {
      switch (variant.value) {
        case 'confirm':
          return confirmCreation
        case 'deny':
          return denyCreation
        case 'delete':
          return deleteCreation
        default:
          return null
      }
    })
    const overlayIcon = computed((): ButtonVariant => {
      switch (variant.value) {
        case 'confirm':
          return 'success'
        case 'deny':
          return 'warning'
        case 'delete':
          return 'danger'
        default:
          return 'info'
      }
    })
    const showResubmissionCheckbox = computed(() => tabIndex.value === 0)
    const hideResubmission = computed(() =>
      showResubmissionCheckbox.value ? hideResubmissionModel.value : false,
    )

    watch(tabIndex, () => {
      currentPage.value = 1
      items.value = []
      keptSearchOnTrial = false
    })

    // Narrowing the list has to start over at page one. Picking a group while standing on a
    // later page would otherwise ask for a page the narrowed result does not have, and the
    // empty table reads as "this group has nothing".
    watch(creationGroup, () => {
      currentPage.value = 1
    })

    // The same rule for the search, which narrows the list just as hard. Watched on the
    // value rather than on one of its callers, because two things write it: the search
    // field above the table and the magnifier in the row. Guarding only the magnifier
    // would have left the typed search asking for page 3 of a two-line result.
    watch(query, () => {
      currentPage.value = 1
      keptSearchOnTrial = false
    })

    // Group functions: canonical tag options for the filter dropdown.
    const { result: creationGroupsResult } = useQuery(creationGroups)

    // A scoped moderator may only work in the groups their role covers, so the filter offers
    // only those. The backend already restricts what they can load; this keeps the dropdown from
    // offering choices that would return nothing. An administrator — or an unrestricted moderator
    // — gets the full set unchanged.
    // ⚠️ Both fields are read under their old names as well, and it matters. The whole store is
    // persisted to localStorage, and verifyLogin only runs again at /authenticate -- so a
    // moderator who was signed in when this deploys still carries seesAllGroups /
    // visibleGroupTags in their browser. Reading only the new names would leave both undefined,
    // and `?? true` would then quietly promote a scoped moderator to the administrator's view of
    // the filter: every group in the community offered, the selection defaulting to "all", and a
    // group they do not moderate answering with an empty table that reads as "nothing here".
    // Nothing leaks -- the backend still enforces from the database -- but the dropdown lies
    // until they sign in again, which may be days.
    //
    // A changeover aid: it can go once no live session predates the rename. The line below does
    // the same for a field added earlier, for the same reason.
    const moderator = computed(() => store.moderator)
    const preRename = computed(() => store.moderator as PreRenameModerator)
    const seesAllCreationGroups = computed(
      () => moderator.value?.seesAllCreationGroups ?? preRename.value?.seesAllGroups ?? true,
    )
    const visibleCreationGroups = computed<string[]>(
      () => moderator.value?.visibleCreationGroups ?? preRename.value?.visibleGroupTags ?? [],
    )
    // "No group" is not a group, so it cannot appear in the list above. Without it a scope of
    // "one group plus the ungrouped ones" would look exactly like that one group, and the
    // ungrouped contributions the moderator is assigned to would have no filter that reaches
    // them. Older sessions predate the field, hence the fallback.
    const seesUntagged = computed(() => store.moderator?.seesUntagged ?? false)

    const creationGroupFilterOptions = computed(() => {
      const allGroups: CreationGroup[] = creationGroupsResult.value?.creationGroups ?? []
      if (seesAllCreationGroups.value) {
        // Three answers that cover the list exactly once: everything, everything some group
        // moderator looks after, everything nobody does — plus every group. The two '*…' values
        // are reserved tokens the backend matches; a real slug can never be '*…', so no
        // collision.
        return [
          { value: '', text: t('creationGroupFilter.all') },
          { value: '*grouped', text: t('creationGroupFilter.grouped') },
          { value: '*untagged', text: t('creationGroupFilter.untagged') },
          ...allGroups.map(creationGroupOption),
        ]
      }
      // Scoped moderator. The store already says which groups they cover, so the shape is
      // decided before the full group list has even loaded.
      if (visibleCreationGroups.value.length === 0) {
        // Scoped to untagged contributions only — the one thing this moderator can see.
        return [{ value: '*untagged', text: t('creationGroupFilter.untagged') }]
      }
      // "All my groups" plus each of them, and "no group" when the scope covers it too; never
      // "all", never a group outside the scope.
      return [
        { value: '*grouped', text: t('creationGroupFilter.grouped') },
        ...(seesUntagged.value
          ? [{ value: '*untagged', text: t('creationGroupFilter.untagged') }]
          : []),
        ...allGroups
          .filter((creationGroupItem) =>
            visibleCreationGroups.value.includes(creationGroupItem.tag),
          )
          .map(creationGroupOption),
      ]
    })

    // Keep the chosen filter among the options actually on offer. A scoped moderator has no
    // "all" entry, so the default falls to their first option ("all my groups", or "untagged").
    watch(
      creationGroupFilterOptions,
      (options) => {
        if (options.length > 0 && !options.some((option) => option.value === creationGroup.value)) {
          creationGroup.value = options[0].value
        }
      },
      { immediate: true },
    )

    const { onResult, onError, refetch } = useQuery<any, ListVariables>(
      adminListContributions,
      {
        filter: {
          statusFilter: statusFilter.value,
          query: query.value,
          hideResubmission: hideResubmission.value,
          creationGroup: creationGroup.value,
        },
        paginated: {
          currentPage: currentPage.value,
          pageSize: pageSize.value,
          order: 'DESC',
        },
      },
      {
        fetchPolicy: 'no-cache',
      },
    )

    watch([statusFilter, query, hideResubmission, creationGroup, currentPage], () => {
      refetch({
        filter: {
          statusFilter: statusFilter.value,
          query: query.value,
          hideResubmission: hideResubmission.value,
          creationGroup: creationGroup.value,
        },
        paginated: {
          currentPage: currentPage.value,
          pageSize: pageSize.value,
        },
      })
    })

    onError((error) => {
      toastError(error.message)
    })

    // When a refetch is done, the composable hands the query's present state out once more
    // (vue-apollo-composable, `refetch`): no list at all while a later one is on its way, or the
    // same list again. Neither is a list of its own: the one without a list threw, and drawn anew
    // from the same list the rows lost their open details. The rows come from the answer handed
    // out, not from `result`: the composable sets that first, and a later answer can come between.
    let lastList: unknown = null
    onResult((answer) => {
      if (answer.loading || !answer.data || answer.data === lastList) {
        return
      }
      lastList = answer.data
      // A kept search that finds nothing any more -- the contribution was processed by somebody
      // else meanwhile, say -- gives way to the whole list (Bernd, 26.10.2026: "Sollte die Suche
      // keine Treffer haben, schaltet es um auf „Alle“"). On the first list only: a search the
      // moderator gives here stays, also where it finds nothing.
      if (keptSearchOnTrial) {
        keptSearchOnTrial = false
        if (answer.data.adminListContributions.contributionCount === 0 && query.value !== '') {
          query.value = ''
          return
        }
      }
      rows.value = answer.data.adminListContributions.contributionCount
      // Copies, as SearchUserTable makes them: what Apollo Client 3 answers is frozen, and the
      // table opens a row by writing `_showDetails` into its item.
      items.value = answer.data.adminListContributions.contributionList.map(
        (contribution: Contribution) => ({ ...contribution }),
      )
      // The faces of the members whose contributions are on this page, in one round trip. Each
      // row carries a DATE, not a picture; everything already held under that date needs
      // nothing, so paging back and forth asks for nothing at all.
      fetchMemberAvatars(
        apolloClient,
        items.value.map((contribution) => contribution.user).filter(Boolean),
      )
      // The count of the badges in the menu and on the tab: all open contributions, never the
      // few a search leaves -- the page opens with the last search now, not only after typing.
      if (statusFilter.value.toString() === FILTER_TAB_MAP[0].toString() && query.value === '') {
        store.setOpenCreations(answer.data.adminListContributions.contributionCount)
      }
    })

    // Group functions: move a contribution to another group (or to none). The table asks for
    // confirmation first; the backend refuses once the contribution is closed.
    const {
      mutate: assignGroupMutation,
      onDone: onAssignGroupDone,
      onError: onAssignGroupError,
    } = useMutation(assignContributionCreationGroups)

    const groupChangeFailures = ref(0)

    const assignGroup = ({ contributionId, tags }: { contributionId: number; tags: string[] }) => {
      assignGroupMutation({ contributionId, tags })
    }

    onAssignGroupDone(() => {
      refetch()
      toastSuccess(t('contribution.changeGroupDone'))
    })

    onAssignGroupError((error) => {
      toastError(error.message)
      // The table still shows the group the moderator picked; tell it the change did not
      // happen.
      groupChangeFailures.value++
    })

    // `throws: 'always'`: a refused decision comes back to `decide` as an error, whether or not
    // anybody else listens for one.
    const { mutate: deleteMutation } = useMutation(adminDeleteContribution, { throws: 'always' })
    const { mutate: denyMutation } = useMutation(denyContribution, { throws: 'always' })
    const { mutate: confirmMutation } = useMutation(confirmContribution, { throws: 'always' })

    // The contributions whose decision is on its way to the server: a second press sends nothing.
    const deciding = new Set<number>()

    /**
     * Sends a decision and takes its answer back to the contribution it was sent for.
     *
     * ⛔ Not to whatever `item` holds when the answer comes: the dialog can be closed while the
     * answer is on its way and opened for another contribution. The answer then took THAT one
     * out of the list and closed its dialog, while the decided one stayed.
     */
    const decide = async (
      send: (variables: { id: number }) => Promise<unknown>,
      done: () => string,
    ) => {
      const decided = item.value
      if (deciding.has(decided.id)) {
        return
      }
      deciding.add(decided.id)
      try {
        await send({ id: decided.id })
        updatePendingCreations(decided.id)
        toastSuccess(done())
      } catch (error) {
        toastError((error as Error).message)
      } finally {
        deciding.delete(decided.id)
        // The dialog closes if it still shows this contribution.
        if (item.value.id === decided.id) {
          overlay.value = false
        }
      }
    }

    // ⚠️ onResult answers `{ off }`, which has no onError: the chained call throws a TypeError
    // once the result handler is registered, and no error handler is ever attached. Kept as
    // the template version had it; the assertion only tells the types what the code assumes.
    const reloadContribution = (id: number) => {
      const resultHandler = useQuery(getContribution, { id }).onResult((result) => {
        const contribution = result.data.contribution
        const index = items.value.findIndex((obj) => obj.id === contribution.id)
        items.value[index] = { ...contribution }
      }) as unknown as { onError: (handler: (error: Error) => void) => void }
      resultHandler.onError((error) => {
        overlay.value = false
        toastError(error.message)
      })
    }

    const deleteCreation = () => decide(deleteMutation, () => t('creation_form.toasted_delete'))
    const denyCreation = () => decide(denyMutation, () => t('creation_form.toasted_denied'))
    const confirmCreation = () => decide(confirmMutation, () => t('creation_form.toasted_created'))

    const updatePendingCreations = (id: number) => {
      items.value = items.value.filter((obj) => obj.id !== id)
      store.openCreationsMinus(1)
    }

    const showOverlay = (selectedItem: Contribution, selectedVariant: string) => {
      overlay.value = true
      item.value = selectedItem
      variant.value = selectedVariant
    }

    const creaItem = ref<Contribution | null>(null)
    const { show: showCreaModal } = useModal('crea-evaluation-modal')
    const openCreaModal = (selectedItem: Contribution) => {
      creaItem.value = selectedItem
      showCreaModal()
    }

    const updateStatus = (id: number) => {
      const target = items.value.find((obj) => obj.id === id)
      if (target) {
        target.messagesCount++
        target.contributionStatus = 'IN_PROGRESS'
      }
    }

    // Bulk resubmission: after a moderator saves a reminder on one contribution, offer to
    // apply it to all displayed contributions -- but only when the list shows a SINGLE
    // participant (all rows same userId, e.g. filtered to one user) and holds more than one
    // open contribution. This never touches other participants' contributions.
    const { mutate: updateContributionMutation } = useMutation(adminUpdateContribution)
    const bulkResubmission = ref<{
      show: boolean
      resubmissionAt: string | null
      name: string
      currentId: number | null
    }>({ show: false, resubmissionAt: null, name: '', currentId: null })

    // Clearing a reminder (resubmissionAt === null) makes the modal speak of "removing",
    // otherwise of "applying" the date.
    const isBulkClearing = computed(() => bulkResubmission.value.resubmissionAt === null)
    const bulkTitle = computed(() =>
      isBulkClearing.value ? t('bulkResubmission.titleRemove') : t('bulkResubmission.title'),
    )
    const bulkQuestion = computed(() => {
      const name = bulkResubmission.value.name
      return isBulkClearing.value
        ? t('bulkResubmission.questionRemove', { name })
        : t('bulkResubmission.question', { name })
    })

    const displayedOpenItems = () =>
      items.value.filter((c) => FILTER_TAB_MAP[0].includes(c.contributionStatus))
    const isSingleParticipant = () => new Set(items.value.map((c) => c.userId)).size === 1

    const onResubmissionSaved = ({ id, resubmissionAt, unchanged }: ResubmissionSaved) => {
      // Offer to propagate only when there is something to spread: a reminder value (a
      // date), or a real save (a removal propagates the clearing). A no-op with no reminder
      // has nothing to propagate -- show a neutral notice instead of opening the prompt.
      const canPropagate = resubmissionAt != null || !unchanged
      if (canPropagate && isSingleParticipant() && displayedOpenItems().length > 1) {
        const user = items.value[0]?.user
        const name = user ? `${user.firstName} ${user.lastName}` : ''
        bulkResubmission.value = { show: true, resubmissionAt, name, currentId: id }
      } else if (unchanged) {
        // Nothing changed and nothing (or no group) to propagate to: a neutral notice
        // instead of the backend's red "wasn't changed" error.
        toastWarning(t('bulkResubmission.noChange'))
      }
    }

    const applyBulkResubmission = async () => {
      const { resubmissionAt, currentId } = bulkResubmission.value
      // The current contribution was already saved individually -- exclude it so we never
      // re-send an unchanged value. A backend "wasn't changed at all" rejection (another
      // displayed contribution already holds this exact date, or already had no reminder
      // when clearing) is a harmless no-op: it must not abort the batch or raise an error.
      const targets = displayedOpenItems().filter((c) => c.id !== currentId)
      const results = await Promise.allSettled(
        targets.map((c) => updateContributionMutation({ id: c.id, resubmissionAt })),
      )
      const failure = results.find(
        (r): r is PromiseRejectedResult =>
          r.status === 'rejected' && !r.reason?.message?.includes("wasn't changed"),
      )
      if (failure) {
        toastError(failure.reason.message)
      } else {
        toastSuccess(
          isBulkClearing.value
            ? t('bulkResubmission.successRemove')
            : t('bulkResubmission.success'),
        )
      }
      refetch()
    }

    // `title-link-attributes` is no prop of BTab in this bootstrap-vue-next: it falls through as
    // an attribute, as it did in the template. Hyphenated, so the types let it pass too.
    // The listeners of the table are hyphenated as well: its events are declared kebab-case,
    // and that is the name the types give their handlers.
    // The title of a tab keeps its word and its number in elements of their own: on a phone the
    // symbol stands above the word and the number at the corner (App.css, CreationConfirm.css).
    return () => (
      <div class='creation-confirm'>
        {/* The search and the group side by side, both on the page's ground with an edge, and
            the group without a word before it: each of its choices names the group (Bernd,
            25.10.2026). On a narrow window they stand one above the other (CreationConfirm.css). */}
        <div class='creation-filters mt-2 mb-2'>
          <UserQuery
            v-model={query.value}
            class='creation-search'
            placeholder={t('user_memo_search')}
          />
          <ThemedSelect
            v-model={creationGroup.value}
            options={creationGroupFilterOptions.value}
            class='creation-group-filter'
            data-test='creation-group-filter'
          />
        </div>
        {showResubmissionCheckbox.value ? (
          // The word is the label of the box, so a tap on it ticks the box too.
          <p class='mb-4 d-flex align-items-center hide-resubmission-row'>
            <input
              v-model={hideResubmissionModel.value}
              id='hide-resubmission'
              type='checkbox'
              class='hideResubmission'
            />
            {withDirectives(
              <label for='hide-resubmission' class='ms-2'>
                {t('hide_resubmission')}
              </label>,
              [[vBTooltip, t('hide_resubmission_tooltip')]],
            )}
          </p>
        ) : null}
        <div>
          <BTabs v-model={shownTab.value} class='creation-tabs page-tabs' contentClass='mt-3' fill>
            <BTab active title-link-attributes={{ 'data-test': 'open' }}>
              {{
                title: () => [
                  <IBiBellFill class='text-primary' />,
                  ' ',
                  <span class='tab-word'>{t('contributions.open')}</span>,
                  ' ',
                  store.openCreations > 0 ? (
                    <BBadge variant='danger' class='tab-badge'>
                      {store.openCreations}
                    </BBadge>
                  ) : null,
                ],
              }}
            </BTab>
            <BTab title-link-attributes={{ 'data-test': 'confirmed' }}>
              {{
                title: () => [
                  <IBiCheck class='text-success' />,
                  ' ',
                  <span class='tab-word'>{t('contributions.confirms')}</span>,
                ],
              }}
            </BTab>
            <BTab title-link-attributes={{ 'data-test': 'denied' }}>
              {{
                title: () => [
                  <IBiXCircle class='text-warning-emphasis' />,
                  ' ',
                  <span class='tab-word'>{t('contributions.denied')}</span>,
                ],
              }}
            </BTab>
            <BTab title-link-attributes={{ 'data-test': 'deleted' }}>
              {{
                title: () => [
                  <IBiTrash class='text-danger' />,
                  ' ',
                  <span class='tab-word'>{t('contributions.deleted')}</span>,
                ],
              }}
            </BTab>
            <BTab title-link-attributes={{ 'data-test': 'all' }}>
              {{
                title: () => [
                  <IBiList />,
                  ' ',
                  <span class='tab-word'>{t('contributions.all')}</span>,
                ],
              }}
            </BTab>
          </BTabs>
        </div>
        {/* At the desk the table keeps its last buttons clear of the Crea button in the corner, and
            only where that button stands: a card has no room for it, it rolls away instead. */}
        <OpenCreationsTable
          class={['mt-4', { 'beside-crea-chat': showCreaChat.value && !phone.value }]}
          items={items.value}
          fields={fields.value}
          hideResubmission={hideResubmission.value}
          creaOpenOnly={creaOpenOnly.value}
          showCrea={showCreaColumn.value}
          showStatus={tabIndex.value === ALL_TAB}
          creationGroups={creationGroupsResult.value?.creationGroups ?? []}
          groupChangeFailures={groupChangeFailures.value}
          onAssign-group={assignGroup}
          onShow-overlay={showOverlay}
          onUpdate-status={updateStatus}
          onReload-contribution={reloadContribution}
          onUpdate-contributions={() => refetch()}
          onSearch-for-email={(email: string) => {
            query.value = email
          }}
          onCrea-evaluate={openCreaModal}
          onResubmission-saved={onResubmissionSaved}
        />

        {/* On a phone `‹`, three numbers and `›` -- every page stays reachable, and the pager
            fits a 320px window. At the desk as before: five places with the ellipses, and « ».
            No `noEllipsis` for the phone: with three numbers bootstrap-vue-next 0.26.8 draws no
            ellipsis anyway (`limit <= ELLIPSIS_THRESHOLD`, which is 3). The class keeps all three
            numbers in sight below 576px (App.css). */}
        <BPagination
          v-model={currentPage.value}
          class='phone-pager'
          pills
          size='lg'
          perPage={pageSize.value}
          totalRows={rows.value}
          align='center'
          limit={phone.value ? PHONE_PAGER_LIMIT : DESK_PAGER_LIMIT}
          noGotoEndButtons={phone.value}
        />
        {showCreaChat.value ? <AiChat /> : null}
        {/* Every decision asks once more, in a dialog that scrolls where the window is short.
            Escape, its × and the backdrop close it as its cancel does; none of them sends
            anything. */}
        <DecisionModal
          v-model={overlay.value}
          item={item.value as unknown as DecisionItem}
          onOverlay-cancel={() => {
            overlay.value = false
          }}
        >
          {{
            // The texts of the variant: overlay.confirm|delete|deny.*, keys the template
            // built at runtime as well. ESLint's i18n check cannot follow them.
            /* eslint-disable @intlify/vue-i18n/no-dynamic-keys */
            title: () => t(overlayTitle.value),
            text: () => <p>{t(overlayText.value)}</p>,
            question: () => <p>{t(overlayQuestion.value)}</p>,
            'submit-btn': () => (
              <BButton
                size='md'
                variant={overlayIcon.value}
                onClick={overlayEvent.value ?? undefined}
              >
                {t(overlayBtnText.value)}
              </BButton>
            ),
            /* eslint-enable @intlify/vue-i18n/no-dynamic-keys */
          }}
        </DecisionModal>
        <CreaEvaluationModal contribution={creaItem.value} />
        <BModal
          v-model={bulkResubmission.value.show}
          title={bulkTitle.value}
          okTitle={t('bulkResubmission.confirm')}
          cancelTitle={t('bulkResubmission.cancel')}
          onOk={applyBulkResubmission}
        >
          {bulkQuestion.value}
        </BModal>
      </div>
    )
  },
})
