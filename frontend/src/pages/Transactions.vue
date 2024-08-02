<template>
  <div class="transactions">
    <div v-if="gdt">
      <gdt-transaction-list
        v-model="currentPage"
        :transactionsGdt="transactionsGdt"
        :transactionGdtCount="transactionGdtCount"
        :pageSize="pageSize"
      />
    </div>
    <div v-else>
      <gdd-transaction-list
        :timestamp="timestamp"
        :transactionCount="transactionCount"
        :transactionLinkCount="transactionLinkCount"
        :transactions="transactions"
        :showPagination="true"
        :pageSize="pageSize"
        @update-transactions="updateTransactions"
      />
    </div>
  </div>
</template>
<!--<script>-->
<!--import GddTransactionList from '@/components/GddTransactionList'-->
<!--import GdtTransactionList from '@/components/GdtTransactionList'-->
<!--import { listGDTEntriesQuery } from '@/graphql/queries'-->

<!--export default {-->
<!--  name: 'Transactions',-->
<!--  components: {-->
<!--    GddTransactionList,-->
<!--    GdtTransactionList,-->
<!--  },-->
<!--  props: {-->
<!--    gdt: { type: Boolean, default: false },-->
<!--    transactions: {-->
<!--      default: () => [],-->
<!--    },-->
<!--    transactionCount: { type: Number, default: 0 },-->
<!--    transactionLinkCount: { type: Number, default: 0 },-->
<!--  },-->
<!--  data() {-->
<!--    return {-->
<!--      timestamp: Date.now(),-->
<!--      transactionsGdt: [],-->
<!--      transactionGdtCount: 0,-->
<!--      currentPage: 1,-->
<!--      pageSize: 25,-->
<!--      tabIndex: 0,-->
<!--    }-->
<!--  },-->
<!--  methods: {-->
<!--    async updateGdt() {-->
<!--      this.$apollo-->
<!--        .query({-->
<!--          query: listGDTEntriesQuery,-->
<!--          variables: {-->
<!--            currentPage: this.currentPage,-->
<!--            pageSize: this.pageSize,-->
<!--          },-->
<!--          fetchPolicy: 'network-only',-->
<!--        })-->
<!--        .then((result) => {-->
<!--          const {-->
<!--            data: { listGDTEntries },-->
<!--          } = result-->
<!--          this.transactionsGdt = listGDTEntries.gdtEntries-->
<!--          this.transactionGdtCount = listGDTEntries.count-->
<!--          window.scrollTo(0, 0)-->
<!--          // eslint-disable-next-line no-unused-expressions-->
<!--          this.$route.path === '/transactions' ? this.$router.replace('/gdt') : ''-->
<!--        })-->
<!--        .catch((error) => {-->
<!--          this.transactionGdtCount = -1-->
<!--          this.toastError(error.message)-->
<!--        })-->
<!--    },-->
<!--    updateTransactions(pagination) {-->
<!--      this.$emit('update-transactions', pagination)-->
<!--    },-->
<!--  },-->
<!--  created() {-->
<!--    if (this.gdt) {-->
<!--      this.updateGdt()-->
<!--    }-->
<!--  },-->
<!--  watch: {-->
<!--    currentPage() {-->
<!--      if (this.gdt) {-->
<!--        this.updateGdt()-->
<!--      }-->
<!--    },-->
<!--    gdt() {-->
<!--      if (this.gdt) {-->
<!--        this.updateGdt()-->
<!--      }-->
<!--    },-->
<!--  },-->
<!--}-->
<!--</script>-->
<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLazyQuery } from '@vue/apollo-composable'
import GddTransactionList from '@/components/GddTransactionList'
import GdtTransactionList from '@/components/GdtTransactionList'
import { listGDTEntriesQuery } from '@/graphql/queries'
import { useAppToast } from '../composables/useToast'

const props = defineProps({
  gdt: { type: Boolean, default: false },
  transactions: {
    default: () => [],
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
const tabIndex = ref(0)

const { toastError } = useAppToast()

const route = useRoute()
const router = useRouter()

const variables = ref({
  currentPage: currentPage.value,
  pageSize: pageSize.value,
})

const { load: loadGdt, onResult, onError } = useLazyQuery(listGDTEntriesQuery, variables, {
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
  background-color: rgba(204, 204, 204, 0.185);
}
.nav-tabs .nav-link.active {
  background-color: rgb(248 249 254);
}
</style>
