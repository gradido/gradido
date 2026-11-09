// AI-GENERATED — not an architecture reference
import { useApolloClient, useLazyQuery, useQuery } from '@vue/apollo-composable'
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ContactWindow } from '@/components/Contacts/ContactWindow'
import { GddTransactionList, type TransactionRow } from '@/components/GddTransactionList'
import { type GdtEntry, GdtTransactionList } from '@/components/GdtTransactionList'
import { useContactWindow } from '@/composables/useContactWindow'
import { fetchMemberAvatars } from '@/composables/useMemberAvatars'
import { useAppToast } from '@/composables/useToast'
import { PAGE_SIZE } from '@/constants'
import { listGDTEntriesQuery } from '@/graphql/queries'
import { transactionsQuery } from '@/graphql/transactions.graphql'
import { memberFromQuery, memberQueryKey } from '@/utils/bookingsRoute'
import { memberAlias } from '@/utils/gradidoAddress'
import IBiX from '~icons/bi/x'
import './Transactions.css'

/** The bookings page: the member's GDD bookings, or on `/gdt` their GDT entries. */
export const Transactions = defineComponent({
  name: 'Transactions',
  props: {
    gdt: { type: Boolean, default: false },
  },
  emits: ['update-transactions'],
  setup(props, { emit, expose }) {
    const timestamp = ref(Date.now())
    const transactionsGdt = ref<GdtEntry[]>([])
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
    const transactions = ref<TransactionRow[]>([])
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
    const listOptions = computed(() => ({ fetchPolicy: 'no-cache' as const, enabled: !props.gdt }))

    const {
      onResult: onListResult,
      onError: onListError,
      refetch: refetchList,
      loading,
    } = useQuery(transactionsQuery, listVariables, listOptions)

    onListResult((value) => {
      const tr = value?.data?.transactionList
      if (!tr) {
        return
      }
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
    const askForPage = ({ currentPage = 1 }: { currentPage?: number } = {}) => {
      if (currentPage === listPage.value) {
        refetchList()?.catch(() => {
          // reported through onListError
        })
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
     * Whose bookings these are, and HOW MANY -- the mark says "117 bookings with Margret", so
     * the size of the narrowed list can be read without counting the rows or turning to the
     * last page (Bernd, 12.09.2026).
     *
     * ⚠️ The figure is `transactionCount`, the count of the WHOLE narrowed list, not of the
     * page on screen. The backend already narrows it: `dbSelectTransactionsByUserId` is asked
     * with `narrowedTo`, and the paginator beneath divides by the same number. Nothing is
     * fetched for this.
     *
     * ⚠️ The name comes off the ROWS, not out of the address. A Gradido id is not a name, and
     * putting one in the label would tell the member nothing; every row in a narrowed list has
     * the same counterparty, so the first one with a counterparty answers it -- named the way
     * every row and the contact window name them (`memberAlias`: a legacy alias too short to
     * count falls back to the id, which is what the rows beneath show as well).
     *
     * Where the filter matched nothing -- and while the answer is still on its way -- there is
     * no row, no name, and no count worth stating: the shorter sentence is the true one there,
     * as it was before. A "0 bookings" under a name nobody knows would say less, not more.
     */
    const filterLabel = computed(() => {
      const named = transactions.value.find((row) => row.linkedUser?.gradidoID)?.linkedUser
      if (!named?.gradidoID) {
        return t('transaction.onlyWithSomeone')
      }
      const count = transactionCount.value
      // The count twice: once as the word the sentence is built from, once as the form to
      // choose. German and English part at one, Russian at one/few/many (slavicPlural).
      return t(
        'transaction.onlyWith',
        { n: count, name: memberAlias(named.alias, named.gradidoID) },
        count,
      )
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

    expose({ transactionsGdt, transactionGdtCount, gdtPage })

    return () => (
      <div class='transactions'>
        {props.gdt ? (
          <div>
            <GdtTransactionList
              modelValue={gdtPage.value}
              onUpdate:modelValue={(page: number) => {
                gdtPage.value = page
              }}
              transactionsGdt={transactionsGdt.value}
              transactionGdtCount={transactionGdtCount.value}
              pageSize={pageSize}
            />
          </div>
        ) : (
          <div>
            {/* The way back out, and inside the GDD branch only. A list narrowed to one contact
                looks exactly like the whole one, only shorter: without this the member has 51
                bookings where they know they have hundreds, and nothing says why. The GDT list
                has never heard of the parameter, so it gets no mark.

                The cross clears the parameters from THIS route rather than pointing at
                /transactions, so it cannot move somebody off the tab they were on. */}
            {counterparty.value ? (
              <div class='transactions-filter' data-test='transactions-filter'>
                <span class='transactions-filter-label'>{filterLabel.value}</span>
                <RouterLink
                  to={{ path: route.path }}
                  class='transactions-filter-clear'
                  aria-label={t('transaction.allBookings')}
                  title={t('transaction.allBookings')}
                  data-test='transactions-filter-clear'
                >
                  <IBiX />
                </RouterLink>
              </div>
            ) : null}

            <GddTransactionList
              timestamp={timestamp.value}
              currentPage={listPage.value}
              transactionCount={transactionCount.value}
              transactionLinkCount={transactionLinkCount.value}
              openLinkCount={openLinkCount.value}
              transactions={transactions.value}
              narrowed={Boolean(counterparty.value)}
              pending={loading.value}
              showPagination={true}
              pageSize={pageSize}
              onUpdate-transactions={askForPage}
              onOpen-member={openMember}
            />

            {/* ONE window for the whole list, opened by a tap on a counterparty's name
                (KF-010). A booking row carries the member but not the three figures the window
                states, so `openMember` shows it at once and fills those in when the lookup
                answers. */}
            <ContactWindow
              modelValue={windowOpen.value}
              contact={selected.value}
              onUpdate:modelValue={(isOpen: boolean) => {
                windowOpen.value = isOpen
              }}
            />
          </div>
        )}
      </div>
    )
  },
})
