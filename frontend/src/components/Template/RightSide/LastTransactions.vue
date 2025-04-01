<template>
  <div class="rightside-last-transactions d-none d-lg-block">
    <BRow class="mb-3">
      <BCol class="h3">{{ $t('transaction.lastTransactions') }}</BCol>
    </BRow>

    <div v-for="transaction in filteredTransactions" :key="transaction.id">
      <BRow align-v="center" class="mb-4">
        <BCol cols="auto">
          <div class="align-items-center">
            <!--            <avatar-->
            <!--              class="vue3-avatar"-->
            <!--              :size="72"-->
            <!--              :color="'#fff'"-->
            <!--              :name="`${transaction.linkedUser.firstName} ${transaction.linkedUser.lastName}`"-->
            <!--              :initials="`${transaction.linkedUser.firstName[0]}${transaction.linkedUser.lastName[0]}`"-->
            <!--              :border="false"-->
            <!--            />-->
            <app-avatar
              :size="72"
              :color="'#fff'"
              :name="`${transaction.linkedUser.firstName} ${transaction.linkedUser.lastName}`"
              :initials="`${transaction.linkedUser.firstName[0]}${transaction.linkedUser.lastName[0]}`"
            />
          </div>
        </BCol>
        <BCol class="p-1">
          <BRow>
            <BCol>
              <div class="fw-bold">
                <name :linked-user="transaction.linkedUser" font-color="text-dark" />
              </div>
              <button
                class="transaction-details-link d-flex mt-3"
                role="link"
                :data-href="`/transactions#transaction-${transaction.id}`"
                @click="handleRedirect(transaction.id)"
              >
                <span class="small">
                  {{ $filters.GDD(transaction.amount) }}
                </span>
                <span class="small ms-3 text-end">
                  {{ $d(new Date(transaction.balanceDate), 'short') }}
                </span>
              </button>
            </BCol>
          </BRow>
        </BCol>
      </BRow>
    </div>
  </div>
</template>
<script setup>
import Name from '@/components/TransactionRows/Name'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { computed } from 'vue'
import AppAvatar from '@/components/AppAvatar.vue'
const props = defineProps({
  transactions: {
    default: () => [],
    type: Array,
  },
})

const router = useRouter()
const route = useRoute()
const store = useStore()

const handleRedirect = (id) => {
  store.dispatch('changeTransactionToHighlightId', id)
  if (route.name !== 'Transactions') router.replace({ name: 'Transactions' })
}

const filteredTransactions = computed(() => {
  return props.transactions
    .filter(
      (transaction) =>
        transaction.typeId !== 'DECAY' &&
        transaction.typeId !== 'LINK_SUMMARY' &&
        transaction.typeId !== 'CREATION',
    )
    .slice(0, 8)
})
</script>

<style scoped lang="scss">
.transaction-details-link {
  color: var(--bs-body-color) !important;
  border: none;
  background-color: transparent;
  border-bottom: 1px solid transparent;
  transition: border-bottom-color 0.15s ease-in-out;
}

.transaction-details-link:hover {
  border-color: #383838;
}
</style>
