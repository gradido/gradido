<template>
  <div class="transactions">
    <div v-if="gdt">
      <gdt-transaction-list
        v-model="currentPage"
        :transactions-gdt="transactionsGdt"
        :transaction-gdt-count="transactionGdtCount"
        :page-size="pageSize"
      />
    </div>
    <div v-else>
      <gdd-transaction-list
        :timestamp="timestamp"
        :transaction-count="transactionCount"
        :transaction-link-count="transactionLinkCount"
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
import { useAppToast } from '@/composables/useToast'

const props = defineProps({
  gdt: { type: Boolean, default: false },
  transactions: {
    default: () => [],
    type: Array,
  },
  transactionCount: { type: Number, default: 0 },
  transactionLinkCount: { type: Number, default: 0 },
})

const emit = defineEmits(['update-transactions'])

const timestamp = ref(Date.now())
const transactionsGdt = ref([])
const transactionGdtCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(25)

const { toastError } = useAppToast()

const route = useRoute()
const router = useRouter()

const variables = ref({
  currentPage: currentPage.value,
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
    currentPage: currentPage.value,
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

watch(currentPage, () => {
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
