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
              :size="64"
              :color="'#fff'"
              :name="`${transaction.linkedUser.firstName} ${transaction.linkedUser.lastName}`"
              :initials="avatarFor(transaction.linkedUser).letters"
              :color-seed="avatarFor(transaction.linkedUser).colorSeed"
              :src="pictureFor(transaction.linkedUser)"
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
                <span class="small" :class="{ 'received-amount': Number(transaction.amount) > 0 }">
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
import { avatarLettering } from '@/utils/avatarLettering'
import { storedMemberAvatar } from '@/composables/useMemberAvatars'

// 64 rather than the 72 this used to be: the stored picture is 128 across, and 72 points
// on a 2x screen asks for 144 -- more than there is, so it was visibly soft at the most
// prominent avatar in the wallet. At 64 the two match exactly (AS-008).
const avatarFor = (linkedUser) => avatarLettering(linkedUser)

// Only what the wallet already holds. Fetching happens once for the whole list, in
// DashboardLayout, so this never triggers a request of its own.
const pictureFor = (linkedUser) => {
  const stored = storedMemberAvatar(linkedUser, linkedUser?.avatarUpdatedAt)
  return stored ? `data:image/jpeg;base64,${stored}` : ''
}
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
