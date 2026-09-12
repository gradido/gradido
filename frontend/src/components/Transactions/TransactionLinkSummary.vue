<template>
  <div class="transaction-slot-link" @click="showTransactionLinks">
    <BRow class="align-items-center">
      <BCol id="transaction-link-summary-avatar" cols="3" lg="2" md="2">
        <!-- It stands where the bookings around it have a face, so at their size. -->
        <BAvatar icon="link" variant="light" :size="LIST_AVATAR_SIZE">
          <variant-icon icon="link" />
        </BAvatar>
      </BCol>
      <BCol>
        <div>{{ $t('gdd_per_link.links_sum') }}</div>
        <div class="small">{{ $t('gdd_per_link.links_open', { n: openLinkCount }) }}</div>
      </BCol>
      <!-- On the phone the amount and the arrow start a line of their own, together -- this
           break is what makes them one line rather than two. From `md` on it is gone and
           everything stands in one line, as before. Taken from the booking row, which was
           given the same treatment on 11.09.2026 for the same fault: on `cols=12` the arrow
           dropped onto a line of its own at the bottom, where nobody looks for it. -->
      <div class="w-100 d-md-none" />
      <!-- ⛔ `col` has to be SAID. bootstrap-vue-next adds the plain `col` class only to a
           column that has no breakpoint sizes at all; with `md`/`lg` given, the phone would
           get no width class and Bootstrap's `.row > *` would make the amount 100% wide
           beside its 25% offset -- past the row's right edge. -->
      <BCol col offset="3" md="3" lg="3" offset-md="0" offset-lg="0">
        <!-- No heading over the amount. The one that stood here was the label of the send
             button, which describes no sum, and it went wrong unnoticed the moment that
             button was renamed. The amount carries its own sign and unit. -->
        <div class="fw-bold">{{ $filters.GDD(amount) }}</div>
      </BCol>
      <BCol cols="auto" class="d-flex justify-content-end align-items-center">
        <collapse-icon class="text-end" :visible="visible" />
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
import { LIST_AVATAR_SIZE } from '@/constants'

const props = defineProps({
  amount: {
    type: String,
    required: true,
  },
  decay: {
    type: Object,
    required: true,
  },
  // Every link that has not been redeemed, expired ones included - the list below shows
  // them all, so this is what its paging counts against.
  transactionLinkCount: {
    type: Number,
    required: true,
  },
  // Only the links that can still be redeemed. Fewer, and the number worth telling.
  openLinkCount: {
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

function showTransactionLinks(evt) {
  const targetClassNames = [...evt.target.classList]
  if (targetClassNames.includes('link-menu-opener') || targetClassNames.includes('btn-secondary')) {
    return
  }
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

<style lang="scss" scoped>
:deep(.b-avatar-custom > svg) {
  height: 2em;
  width: 2em;
}
</style>
