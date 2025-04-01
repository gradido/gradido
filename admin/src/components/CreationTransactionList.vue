<template>
  <div class="component-creation-transaction-list">
    <div class="h3">{{ $t('transactionlist.title') }}</div>
    <BTable striped hover :fields="fields" :items="items">
      <template #cell(contributionDate)="data">
        <div class="font-weight-bold">
          {{ $d(new Date(data.item.contributionDate), 'month') }}
        </div>
        <div>{{ $d(new Date(data.item.contributionDate)) }}</div>
      </template>
    </BTable>
    <div>
      <BPagination
        v-model="currentPage"
        pills
        size="lg"
        :per-page="perPage"
        :total-rows="rows"
        align="center"
        :hide-ellipsis="true"
      />
      <BButton v-b-toggle="'collapse-1'" variant="light" size="sm">{{ t('help.help') }}</BButton>
      <BCollapse id="collapse-1" class="mt-2">
        <div>
          {{ t('transactionlist.submitted') }} {{ t('math.equals') }}
          {{ t('help.transactionlist.submitted') }}
        </div>
        <div>
          {{ t('transactionlist.period') }} {{ t('math.equals') }}
          {{ t('help.transactionlist.periods') }}
        </div>
        <div>
          {{ t('transactionlist.confirmed') }} {{ t('math.equals') }}
          {{ t('help.transactionlist.confirmed') }}
        </div>
        <div>
          {{ t('transactionlist.status') }} {{ t('math.equals') }}
          {{ t('help.transactionlist.status') }}
        </div>
      </BCollapse>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { adminListContributionsShort } from '../graphql/adminListContributions.graphql'
import { BTable, BPagination, BButton, BCollapse, vBToggle } from 'bootstrap-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  userId: { type: Number, required: true },
})

const items = ref([])
const rows = ref(0)
const currentPage = ref(1)
const perPage = ref(10)

const fields = [
  {
    key: 'createdAt',
    label: t('transactionlist.submitted'),
    formatter: (value) => {
      return new Date(value).toLocaleDateString()
    },
  },
  {
    key: 'contributionDate',
    label: t('transactionlist.period'),
  },
  {
    key: 'confirmedAt',
    label: t('transactionlist.confirmed'),
    formatter: (value) => {
      return value ? new Date(value).toLocaleDateString() : null
    },
  },
  {
    key: 'status',
    label: t('transactionlist.status'),
  },
  {
    key: 'amount',
    label: t('transactionlist.amount'),
    formatter: (value) => {
      return `${value} GDD`
    },
  },
  { key: 'memo', label: t('transactionlist.memo'), class: 'text-break' },
]

const { result, refetch } = useQuery(adminListContributionsShort, {
  filter: {
    userId: props.userId,
  },
  paginated: {
    currentPage: currentPage.value,
    pageSize: perPage.value,
    order: 'DESC',
  },
})

watch(result, (newResult) => {
  if (newResult && newResult.adminListContributions) {
    rows.value = newResult.adminListContributions.contributionCount
    items.value = newResult.adminListContributions.contributionList
  }
})

watch(currentPage, () => {
  refetch()
})
</script>
