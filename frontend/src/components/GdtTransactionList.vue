<template>
  <div class="gdt-transaction-list">
    <div class="list-group">
      <div v-if="transactionGdtCount === 0" class="text-center">
        {{ $t('gdt.no-transactions') }}
        <hr />
        <BButton class="gdt-funding" :href="link" target="_blank">
          {{ $t('gdt.funding') }}
        </BButton>
      </div>
      <div v-else-if="transactionGdtCount === -1" class="text-center">
        {{ $t('gdt.not-reachable') }}
      </div>
      <div
        v-for="{ id, amount, date, comment, gdtEntryType, factor, gdt } in transactionsGdt"
        v-else
        :key="id"
      >
        <transaction
          :id="id"
          :amount="amount"
          :date="date"
          :comment="comment"
          :gdt-entry-type="gdtEntryType"
          :factor="factor"
          :gdt="gdt"
        />
      </div>
    </div>
    <BPagination
      v-if="transactionGdtCount > pageSize"
      v-model="currentPage"
      class="mt-3 flex-wrap"
      pills
      size="lg"
      :per-page="pageSize"
      :total-rows="transactionGdtCount"
      align="center"
      :no-ellipsis="true"
      :limit="pagerLimit"
      :no-goto-end-buttons="pagerNoEnds"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useStore } from 'vuex'
import Transaction from '@/components/Transaction'
import { usePagerFit } from '@/composables/usePagerFit'

const props = defineProps({
  transactionsGdt: {
    type: Array,
    required: true,
  },
  transactionGdtCount: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  modelValue: { type: Number, required: true },
})
const emit = defineEmits(['update:modelValue'])

const store = useStore()
const { pagerLimit, pagerNoEnds } = usePagerFit()

const currentPage = ref(props.modelValue)
const link = 'https://gradido.net/' + store.state.language + '/memberships/'

watch(
  () => props.modelValue,
  (newValue) => {
    currentPage.value = newValue
  },
)
watch(currentPage, (newValue) => {
  if (props.modelValue !== newValue) emit('update:modelValue', newValue)
})
</script>

<style>
.el-table .cell {
  padding-left: 0;
  padding-right: 0;
}

.nav-tabs .nav-link.active,
.nav-tabs .nav-item.show .nav-link {
  background-color: #f8f9fe38;
}

.gdt-transaction-list-item {
  outline: none !important;
}
</style>
