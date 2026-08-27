<template>
  <div class="rightside-last-transactions d-none d-lg-block">
    <BRow class="mb-3">
      <BCol class="h3">{{ $t('transaction.lastTransactions') }}</BCol>
    </BRow>

    <div v-for="row in rows" :key="row.transaction.id">
      <BRow align-v="center" class="mb-4">
        <BCol cols="auto">
          <div class="align-items-center">
            <!-- 64 rather than the 72 this used to be: the stored picture is 128 across, and
                 72 points on a 2x screen asks for 144 -- more than there is, so it was
                 visibly soft at the most prominent avatar in the wallet. At 64 the two match
                 exactly (AS-008). -->
            <app-avatar :size="64" :color="'#fff'" v-bind="row.avatar" />
          </div>
        </BCol>
        <BCol class="p-1">
          <BRow>
            <BCol>
              <div class="fw-bold">
                <name :linked-user="row.transaction.linkedUser" font-color="text-dark" />
              </div>
              <button
                class="transaction-details-link d-flex mt-3"
                role="link"
                :data-href="`/transactions#transaction-${row.transaction.id}`"
                @click="handleRedirect(row.transaction.id)"
              >
                <!-- ⛔ No currency here, unlike everywhere else in the wallet. This column
                     is three of twelve wide, and `− 45,00 GDD` broke over two lines as soon
                     as the window narrowed -- while every amount in this list is in GDD, so
                     the unit was saying nothing and costing exactly the width that made it
                     wrap.

                     ⛔ The sign stays, and it carries this ALONE in light mode. The first
                     version of this note said "together with the colour" -- but
                     `.received-amount` has exactly one rule in the whole project, under
                     `.dark-mode`, so in light mode there is no colour signal at all. Whoever
                     next thinks the plus is noise should know that removing it leaves
                     nothing. (Bernd, 27.08.2026) -->
                <span
                  class="small transaction-amount"
                  :class="{ 'received-amount': Number(row.transaction.amount) > 0 }"
                >
                  {{ $filters.signedAmount(row.transaction.amount) }}
                </span>
                <span class="small ms-3 text-end">
                  {{ $d(new Date(row.transaction.balanceDate), 'short') }}
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
import { memberAvatarProps } from '@/composables/useMemberAvatars'

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

// The avatar is worked out once per row, in a computed, rather than by calling helpers from
// the template. Two reasons, and both bit here before:
//
//   * the letters and the colour seed have to come from ONE call, or a later edit can leave
//     them describing different members. Calling the helper once per prop is exactly the
//     split it exists to prevent.
//   * `memberAvatarProps` reads the picture store, which is reactive. Called from the
//     template it makes the whole list re-render on every change to any member's picture and
//     rebuild eight ~11 KB data URIs; behind a computed, an unchanged value stops there.
//
// `linkedUser` may be null -- a booking whose counterparty the backend could not resolve --
// and everything downstream of here is written for that.
const rows = computed(() =>
  props.transactions
    .filter(
      (transaction) =>
        transaction.typeId !== 'DECAY' &&
        transaction.typeId !== 'LINK_SUMMARY' &&
        transaction.typeId !== 'CREATION',
    )
    .slice(0, 8)
    .map((transaction) => ({ transaction, avatar: memberAvatarProps(transaction.linkedUser) })),
)
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

/* The sign and the number are one word to the eye, and the space between them is a real
   space -- so the second guard against a break has to be here, not only in the shorter
   text. The date beside it may still wrap; that costs nothing. */
.transaction-amount {
  white-space: nowrap;
}
</style>
