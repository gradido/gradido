<template>
  <div class="transaction-slot-link" @click="showTransactionLinks()">
    <BRow class="align-items-center">
      <BCol cols="3" lg="2" md="2">
        <BAvatar icon="link" variant="light" :size="42"></BAvatar>
      </BCol>
      <BCol>
        <div>{{ $t('gdd_per_link.links_sum') }}</div>
        <div class="small">{{ transactionLinkCount }} {{ $t('gdd_per_link.links_sum') }}</div>
      </BCol>
      <BCol cols="8" lg="3" md="3" sm="8" offset="3" offset-md="0" offset-lg="0">
        <div class="small mb-2">{{ $t('send_per_link') }}</div>
        <div class="font-weight-bold">{{ $filters.GDD(amount) }}</div>
      </BCol>
      <BCol cols="12" md="1" lg="1" class="text-right">
        <collapse-icon class="text-right" :visible="visible" />
      </BCol>
    </BRow>
    <BCollapse :model-value="visible">
      <collapse-links-list
        v-model="currentPage"
        :pending="pending"
        :page-size="pageSize"
        :transaction-link-count="transactionLinkCount"
        :transaction-links="transactionLinks"
      />
    </BCollapse>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import CollapseIcon from '../TransactionRows/CollapseIcon'
import CollapseLinksList from '../DecayInformations/CollapseLinksList'
import { useAppToast } from '@/composables/useToast'
import { listTransactionLinks } from '@/graphql/queries'

const props = defineProps({
  amount: {
    type: String,
    required: true,
  },
  decay: {
    type: Object,
    required: true,
  },
  transactionLinkCount: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['update-transactions'])

const { toastError } = useAppToast()

const visible = ref(false)
const transactionLinks = ref([])
const currentPage = ref(1)
const pageSize = ref(5)
const pending = ref(false)

const { refetch, loading, error } = useQuery(listTransactionLinks, {
  currentPage: currentPage.value,
})

watch(currentPage, () => {
  updateListTransactionLinks()
})

function showTransactionLinks() {
  if (visible.value) {
    visible.value = false
  } else {
    transactionLinks.value = []
    if (currentPage.value === 1) {
      updateListTransactionLinks()
    } else {
      currentPage.value = 1
    }
    visible.value = true
  }
}

async function updateListTransactionLinks() {
  if (currentPage.value === 0) {
    transactionLinks.value = []
    currentPage.value = 1
  } else {
    pending.value = true
    try {
      const { data } = await refetch({
        currentPage: currentPage.value,
      })
      transactionLinks.value = [...transactionLinks.value, ...data.listTransactionLinks.links]
      emit('update-transactions')
    } catch (err) {
      toastError(err.message)
    } finally {
      pending.value = false
    }
  }
}
</script>
