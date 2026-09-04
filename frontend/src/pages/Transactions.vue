<template>
  <div class="transactions">
    <div v-if="gdt">
      <gdt-transaction-list
        v-model="gdtPage"
        :transactions-gdt="transactionsGdt"
        :transaction-gdt-count="transactionGdtCount"
        :page-size="pageSize"
      />
    </div>
    <div v-else>
      <!-- The way back out, and inside the GDD branch only. A list narrowed to one contact
           looks exactly like the whole one, only shorter: without this the member has 51
           bookings where they know they have hundreds, and nothing says why. The GDT list
           has never heard of the parameter, so it gets no mark.

           The cross clears the parameters from THIS route rather than pointing at
           /transactions, so it cannot move somebody off the tab they were on. -->
      <div v-if="counterparty" class="transactions-filter" data-test="transactions-filter">
        <span class="transactions-filter-label">{{ filterLabel }}</span>
        <router-link
          :to="{ path: route.path }"
          class="transactions-filter-clear"
          :aria-label="$t('transaction.allBookings')"
          :title="$t('transaction.allBookings')"
          data-test="transactions-filter-clear"
        >
          <IBiX />
        </router-link>
      </div>

      <gdd-transaction-list
        :timestamp="timestamp"
        :current-page="listPage"
        :transaction-count="transactionCount"
        :transaction-link-count="transactionLinkCount"
        :open-link-count="openLinkCount"
        :transactions="transactions"
        :narrowed="Boolean(counterparty)"
        :pending="loading"
        :show-pagination="true"
        :page-size="pageSize"
        @update-transactions="askForPage"
        @open-member="openMember"
      />

      <!-- ONE window for the whole list, opened by a tap on a counterparty's name
           (KF-010). A booking row carries the member but not the three figures the window
           states, so `openMember` shows it at once and fills those in when the lookup
           answers. -->
      <contact-window v-model="windowOpen" :contact="selected" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useApolloClient, useLazyQuery, useQuery } from '@vue/apollo-composable'
import ContactWindow from '@/components/Contacts/ContactWindow.vue'
import GddTransactionList from '@/components/GddTransactionList'
import GdtTransactionList from '@/components/GdtTransactionList'
import { listGDTEntriesQuery } from '@/graphql/queries'
import { transactionsQuery } from '@/graphql/transactions.graphql'
import { fetchMemberAvatars } from '@/composables/useMemberAvatars'
import { PAGE_SIZE } from '@/constants'
import { useContactWindow } from '@/composables/useContactWindow'
import { useAppToast } from '@/composables/useToast'
import { memberFromQuery, memberQueryKey } from '@/utils/bookingsRoute'
import { memberAlias } from '@/utils/gradidoAddress'

const props = defineProps({
  gdt: { type: Boolean, default: false },
})

const emit = defineEmits(['update-transactions'])

const timestamp = ref(Date.now())
const transactionsGdt = ref([])
const transactionGdtCount = ref(0)
// ⚠️ The GDT list only. It pages against its OWN query, a few lines below, and has nothing
// to do with `listPage` -- named apart because two page numbers in one file is how the
// booking list got into trouble in the first place.
const gdtPage = ref(1)
// The one number the paginator divides by and the server is asked with.
const pageSize = PAGE_SIZE

const { toastError } = useAppToast()
const { client: apolloClient } = useApolloClient()

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

/**
 * The member this list is narrowed to, off the address -- what the contact window links
 * to. Read through the module the window builds the address with (utils/bookingsRoute.js),
 * which also decides what does NOT count as a narrowing (an array, an empty or over-long
 * value). Read in ONE place: the query below and the mark above both take it from here.
 */
const counterparty = computed(() => memberFromQuery(route.query))

/**
 * The contact window this list opens, and the lookup behind it.
 *
 * ⚠️ Not the same thing as `counterparty` above, though both name a member: that one is the
 * address this list is NARROWED to, this one is whoever was tapped. Tapping a name in a
 * narrowed list opens the window over the very person it is narrowed to, and the link in
 * that window leads back to the address it is already on -- harmless, and the honest answer.
 */
const { windowOpen, selected, openMember } = useContactWindow(apolloClient)

/**
 * The GDD list: this page's own query, this page's own page number.
 *
 * ⛔ Not the layout's. The layout asks for the balance and the member's newest bookings
 * and hands nothing of it down here; while one query served both, a page turned here
 * reached the column beside the overview and a filter would have reached the balance.
 * Two owners, two queries -- a second request when the page opens is the price, and it
 * is the request the layout makes on this route anyway to bring the balance up to date.
 */
const listPage = ref(1)
const transactions = ref([])
const transactionCount = ref(0)
const transactionLinkCount = ref(0)
const openLinkCount = ref(0)

const listVariables = computed(() => ({
  currentPage: listPage.value,
  pageSize,
  order: 'DESC',
  counterparty: counterparty.value,
}))
// Reactive, because /transactions and /gdt share this component and the router patches
// `gdt` in place rather than mounting the page anew -- the watch on it below exists for
// the same reason.
//
// ⛔ `no-cache`, not `network-only`. Both this query and the layout's carry the two
// virtual rows with fixed ids (-1 decay, -2 link summary); written into the normalised
// cache they are ONE entity, and whichever answer lands second re-broadcasts the other
// query with its own decay figures. Left out of the cache, the two answers stay apart.
// The same choice the contacts panel makes (useContactsPanel).
const listOptions = computed(() => ({ fetchPolicy: 'no-cache', enabled: !props.gdt }))

const {
  onResult: onListResult,
  onError: onListError,
  refetch: refetchList,
  loading,
} = useQuery(transactionsQuery, listVariables, listOptions)

onListResult((value) => {
  const tr = value?.data?.transactionList
  if (!tr) return
  transactions.value = tr.transactions || []
  transactionCount.value = tr.balance?.count || 0
  transactionLinkCount.value = tr.balance?.linkCount || 0
  openLinkCount.value = tr.balance?.openLinkCount || 0
  // The faces beside the rows, for this page's rows -- the layout fetches them only for
  // the twelve it holds. Best effort by design: nobody loses their bookings over a portrait.
  fetchMemberAvatars(
    apolloClient,
    transactions.value.map((row) => row.linkedUser),
  )
})

onListError((error) => {
  transactionCount.value = -1
  toastError(error.message)
})

/**
 * The list asked for a page (the paginator), or for the page it is on again (the link
 * summary row, after a link was withdrawn -- GddTransactionList turns that into a request
 * for the current page).
 *
 * ⚠️ The same page asked for again is not a page turn: the variables do not change, so the
 * query would not run -- it is fetched again explicitly. And it is the one case that tells
 * the LAYOUT as well: a withdrawn link moves the balance in the header, a page turn does
 * not. The failure of the refetch is reported through onListError; the catch keeps it from
 * surfacing a second time as an unhandled rejection. `?.` because refetch answers nothing
 * while the query is switched off on the GDT tab.
 */
const askForPage = ({ currentPage = 1 } = {}) => {
  if (currentPage === listPage.value) {
    refetchList()?.catch(() => {})
    emit('update-transactions', {})
    return
  }
  listPage.value = currentPage
}

/** Everything the last answer left on screen, gone -- before the next member's arrives. */
const forgetList = () => {
  listPage.value = 1
  transactions.value = []
  transactionCount.value = 0
  transactionLinkCount.value = 0
  openLinkCount.value = 0
}

// A different member -- or none -- starts on page one, with nothing of the previous list
// left on screen: the mark reads the name off the rows, and the old rows would have named
// the wrong person under it until the answer arrived.
//
// ⛔ Watched as a STRING, not as the object: `memberFromQuery` builds a fresh object on
// every read of the address, and a watch on it would fire on identity -- a navigation
// that rebuilt the address with the same pair would empty the list, while Apollo, which
// compares the variables by content, would not ask again. The key changes only when the
// pair does.
watch(() => memberQueryKey(counterparty.value), forgetList)

/**
 * Whose bookings these are.
 *
 * ⚠️ The name comes off the ROWS, not out of the address. A Gradido id is not a name, and
 * putting one in the label would tell the member nothing; every row in a narrowed list has
 * the same counterparty, so the first one with a counterparty answers it -- named the way
 * every row and the contact window name them (`memberAlias`: a legacy alias too short to
 * count falls back to the id, which is what the rows beneath show as well). Where the
 * filter matched nothing there is no row and no name -- and then the shorter sentence is
 * also the true one.
 */
const filterLabel = computed(() => {
  const named = transactions.value.find((row) => row.linkedUser?.gradidoID)
  return named
    ? t('transaction.onlyWith', {
        name: memberAlias(named.linkedUser.alias, named.linkedUser.gradidoID),
      })
    : t('transaction.onlyWithSomeone')
})

const variables = ref({
  currentPage: gdtPage.value,
  pageSize,
})

const {
  load: loadGdt,
  onResult,
  onError,
} = useLazyQuery(listGDTEntriesQuery, variables, {
  fetchPolicy: 'network-only',
})

const updateGdt = async () => {
  variables.value = {
    currentPage: gdtPage.value,
    pageSize,
  }
  await loadGdt()
}

onResult((result) => {
  const { listGDTEntries } = result.data
  transactionsGdt.value = listGDTEntries.gdtEntries
  transactionGdtCount.value = listGDTEntries.count
  window.scrollTo(0, 0)
  if (route.path === '/transactions') {
    router.replace('/gdt')
  }
})

onError((error) => {
  transactionGdtCount.value = -1
  toastError(error.message)
})

// The tabs share this instance (see `listOptions`), so switching to the GDT tab and back
// is what a fresh visit to the bookings used to be: it starts on page one, the way a
// navigation into the list always has.
watch(
  () => props.gdt,
  (newVal) => {
    listPage.value = 1
    if (newVal) {
      updateGdt()
    }
  },
)

watch(gdtPage, () => {
  if (props.gdt) {
    updateGdt()
  }
})

onMounted(() => {
  if (props.gdt) {
    updateGdt()
  }
})
</script>
<style>
/* ⛔ This block is UNSCOPED, so every selector here must be unmistakably this page's. A
   generic name would style whatever else in the wallet happened to wear it -- which is how
   an overlay's class name put an invisible sheet over the whole application on 03.09.2026. */
.transactions-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.35rem 0.5rem 0.35rem 0.75rem;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 999px;
  width: fit-content;
  max-width: 100%;
}

.transactions-filter-label {
  font-size: 0.85rem;
  color: var(--bs-secondary-color, #6c757d);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transactions-filter-clear {
  display: flex;
  align-items: center;
  color: var(--bs-secondary-color, #6c757d);
  line-height: 1;
  flex: none;
}

.transactions-filter-clear:hover,
.transactions-filter-clear:focus-visible {
  color: var(--bs-body-color);
}

.nav-tabs > li > a {
  padding-top: 14px;
  margin-bottom: 14px;
}

.nav-tabs .nav-link {
  background-color: rgb(204 204 204 / 18.5%);
}

.nav-tabs .nav-link.active {
  background-color: rgb(248 249 254);
}
</style>
