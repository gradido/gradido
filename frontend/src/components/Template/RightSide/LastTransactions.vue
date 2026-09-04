<template>
  <div class="rightside-last-transactions d-none d-lg-block">
    <!-- ⛔ The column's name, for a screen reader only. The switch above carries it on
         screen, but a group of pressed buttons is not a heading: the "next heading" jump
         has nothing to land on, so the column had no title to navigate to.

         ⚠️ It is not a heading that was lost here -- the markup this replaced was
         `<BCol class="h3">`, and `h3` is a Bootstrap STYLING class on a div
         (`tag: { default: 'div' }`), so the jump never found it either. This adds what was
         never there, rather than restoring something. (coderabbit, PR #3837.)

         ⚠️ `visually-hidden` is Bootstrap's own and ships in the stylesheet (verified in
         the built CSS); it clips the element instead of hiding it, so the text stays
         readable to assistive technology. `d-none` would take it away from that too. -->
    <h2 class="visually-hidden">{{ $t('transaction.lastTransactions') }}</h2>

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
              <!-- The name opens the contact window (KF-010), the same one the contact
                   list opens -- it is not a way into the send form any more, here as
                   little as anywhere else. The button under it still leads to the booking
                   itself, so the two things this row can mean stay two controls. -->
              <div class="fw-bold">
                <name
                  :linked-user="row.transaction.linkedUser"
                  font-color="text-dark"
                  @open="openMember"
                />
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
            <!-- The heart at the row's end (KF-005); every row here has a counterparty,
                 creations are filtered out of `rows` below. -->
            <BCol v-if="row.transaction.linkedUser?.gradidoID" cols="auto" class="p-1">
              <favorite-heart :member="row.transaction.linkedUser" />
            </BCol>
          </BRow>
        </BCol>
      </BRow>
    </div>

    <!-- ONE window for the whole column, as every other list has one. -->
    <contact-window v-model="windowOpen" :contact="selected" />
  </div>
</template>
<script setup>
import Name from '@/components/TransactionRows/Name'
import ContactWindow from '@/components/Contacts/ContactWindow.vue'
import FavoriteHeart from '@/components/FavoriteHeart.vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { computed } from 'vue'
import { useApolloClient } from '@vue/apollo-composable'
import AppAvatar from '@/components/AppAvatar.vue'
import { avatarZoomBindings } from '@/composables/useAvatarZoom'
import { useContactWindow } from '@/composables/useContactWindow'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { LAST_TRANSACTIONS_ROWS } from '@/constants'

const props = defineProps({
  transactions: {
    default: () => [],
    type: Array,
  },
})

const router = useRouter()
const route = useRoute()
const store = useStore()
const { client: apolloClient } = useApolloClient()

/**
 * The contact window this column opens, and the lookup that fills in its three figures.
 *
 * A booking row names a member; how many bookings there were with them, and since when, is
 * a grouping over all of them -- see useContactWindow.openMember.
 */
const { windowOpen, selected, openMember } = useContactWindow(apolloClient)

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
    // ⚠️ The fetch that feeds this is sized in `constants.js` for exactly this cut, and it
    // is deliberately larger: three kinds of row are dropped above and never reach the
    // count. Change the number here and the fetch has to grow with it, or the column simply
    // shows fewer rows than it asks for.
    .slice(0, LAST_TRANSACTIONS_ROWS)
    .map((transaction) => {
      const avatar = memberAvatarProps(transaction.linkedUser)
      return {
        transaction,
        // Spread into one object, so the template still binds a single `row.avatar`. The
        // zoom half is empty for a member without a picture, which leaves that circle
        // exactly as it was (AS-018).
        avatar: { ...avatar, ...avatarZoomBindings(transaction.linkedUser, avatar) },
      }
    }),
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
