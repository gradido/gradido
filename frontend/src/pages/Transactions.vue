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
      <!-- ⛔ `current-page` comes DOWN from the layout, which owns both the page number and
           the query behind it. This page used to keep its own, and the two drifted apart the
           moment the layout kept a page across a navigation: the paginator was rebuilt at
           one while the rows were page three, and the buttons back to one were disabled
           because as far as the paginator knew, it was already there. -->
      <gdd-transaction-list
        :timestamp="timestamp"
        :current-page="listPage"
        :transaction-count="transactionCount"
        :transaction-link-count="transactionLinkCount"
        :open-link-count="openLinkCount"
        :transactions="transactions"
        :show-pagination="true"
        :page-size="pageSize"
        @update-transactions="updateTransactions"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLazyQuery } from '@vue/apollo-composable'
import GddTransactionList from '@/components/GddTransactionList'
import GdtTransactionList from '@/components/GdtTransactionList'
import { listGDTEntriesQuery } from '@/graphql/queries'
import { PAGE_SIZE } from '@/constants'
import { useAppToast } from '@/composables/useToast'

const props = defineProps({
  gdt: { type: Boolean, default: false },
  transactions: {
    default: () => [],
    type: Array,
  },
  // The page of `transactions` the layout currently holds. Not a page this component may
  // set: it asks by emitting `update-transactions` and gets the new number back down here.
  // ⚠️ Which makes it the page ASKED FOR, not the page on screen -- between the request and
  // its answer the paginator is already on the new number while the rows are still the old
  // ones. That gap is one round trip and it closes itself; what it replaces was a gap that
  // did not.
  listPage: { type: Number, default: 1 },
  transactionCount: { type: Number, default: 0 },
  transactionLinkCount: { type: Number, default: 0 },
  openLinkCount: { type: Number, default: 0 },
})

const emit = defineEmits(['update-transactions'])

const timestamp = ref(Date.now())
const transactionsGdt = ref([])
const transactionGdtCount = ref(0)
// ⚠️ The GDT list only. It pages against its OWN query, a few lines below, and has nothing
// to do with `listPage` above -- named apart because two page numbers in one file is how the
// booking list got into trouble in the first place.
const gdtPage = ref(1)
// ⛔ The same constant the layout asks the server with. These two are the pair that has to
// agree: this one divides the paginator, that one decides how many rows arrive. While the
// layout asked for ten and this said twenty-five, a member's first look at their bookings
// showed ten rows on a page the paginator had sized for twenty-five, and rows 11 to 25 were
// on no page at all.
const pageSize = ref(PAGE_SIZE)

const { toastError } = useAppToast()

const route = useRoute()
const router = useRouter()

const variables = ref({
  currentPage: gdtPage.value,
  pageSize: pageSize.value,
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
    pageSize: pageSize.value,
  }
  await loadGdt()
}

const updateTransactions = (pagination) => {
  emit('update-transactions', pagination)
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

watch(
  () => props.gdt,
  (newVal) => {
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
