<template>
  <div class="transaction-link-list">
    <div v-if="items.length > 0">
      <div class="h3">{{ t('transactionlink.name') }}</div>
      <BTable striped hover :fields="fields" :items="items"></BTable>
    </div>
    <BPagination
      pills
      v-model="currentPage"
      size="lg"
      :per-page="perPage"
      :total-rows="rows"
      align="center"
      :hide-ellipsis="true"
    />
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { BTable, BPagination } from 'bootstrap-vue-next'
import { listTransactionLinksAdmin } from '../graphql/listTransactionLinksAdmin.js'
import { useQuery } from '@vue/apollo-composable'
import { useAppToast } from '@/composables/useToast'

const props = defineProps({
  userId: { type: Number, required: true },
})

const { t, d } = useI18n()
const { toastError } = useAppToast()

const items = ref([])
const rows = ref(0)
const currentPage = ref(1)
const perPage = ref(5)

const fields = computed(() => [
  {
    key: 'createdAt',
    label: t('transactionlink.created'),
    formatter: (value) => d(new Date(value)),
  },
  {
    key: 'amount',
    label: t('transactionlist.amount'),
    formatter: (value) => `${value} GDD`,
  },
  { key: 'memo', label: t('transactionlist.memo'), class: 'text-break' },
  {
    key: 'validUntil',
    label: t('transactionlink.valid_until'),
    formatter: (value) => d(new Date(value)),
  },
  {
    key: 'status',
    label: 'status',
    formatter: (value, key, item) => {
      if (item.deletedAt) return `${t('deleted')}: ${d(new Date(item.deletedAt))}`
      if (item.redeemedAt) return `${t('redeemed')}: ${d(new Date(item.redeemedAt))}`
      if (new Date() > new Date(item.validUntil))
        return `${t('expired')}: ${d(new Date(item.validUntil))}`
      return t('open')
    },
  },
])

const { result, error, refetch } = useQuery(listTransactionLinksAdmin, () => ({
  currentPage: currentPage.value,
  pageSize: perPage.value,
  userId: props.userId,
}))

watch(result, (newResult) => {
  if (newResult && newResult.listTransactionLinksAdmin) {
    rows.value = newResult.listTransactionLinksAdmin.count
    items.value = newResult.listTransactionLinksAdmin.links
  }
})

watch(error, (err) => {
  if (err) {
    toastError(error.message)
  }
})

watch([currentPage, perPage], () => {
  refetch()
})
</script>
