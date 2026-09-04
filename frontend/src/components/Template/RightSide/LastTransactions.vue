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

    <!-- ⛔ ONE row per booking, three columns: face, text, heart. It used to be a row inside
         a row, with the heart in the inner one -- and that nesting is both halves of what
         was reported on 04.09.2026. A nested `.row` carries its own negative margins, so
         the heart sat 7 points OUTSIDE this column's right edge whenever it did stay up;
         and being in a second row is what let it wrap away from the booking it belongs to.
         (Measured in a browser on this component's own rendered markup against the built
         Bootstrap, at column widths from 220 to 340 points.) -->
    <BRow v-for="row in rows" :key="row.transaction.id" align-v="center" class="mb-4">
      <BCol cols="auto">
        <!-- 64 rather than the 72 this used to be: the stored picture is 128 across, and
             72 points on a 2x screen asks for 144 -- more than there is, so it was visibly
             soft at the most prominent avatar in the wallet. At 64 the two match exactly
             (AS-008). -->
        <app-avatar :size="64" :color="'#fff'" v-bind="row.avatar" />
      </BCol>
      <BCol class="min-w-0">
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
          <!-- ⚠️ The gap to the amount is a `column-gap` on the button, not a margin here:
               where this line has to wrap, a margin would leave the date indented under
               nothing. -->
          <span class="small text-end">
            {{ $d(new Date(row.transaction.balanceDate), 'short') }}
          </span>
        </button>
      </BCol>
      <!-- The heart at the row's end (KF-005); every row here has a counterparty,
           creations are filtered out of `rows` below. -->
      <BCol v-if="row.transaction.linkedUser?.gradidoID" cols="auto">
        <favorite-heart :member="row.transaction.linkedUser" />
      </BCol>
    </BRow>
  </div>
</template>
<script setup>
import Name from '@/components/TransactionRows/Name'
import FavoriteHeart from '@/components/FavoriteHeart.vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { computed } from 'vue'
import AppAvatar from '@/components/AppAvatar.vue'
import { avatarZoomBindings } from '@/composables/useAvatarZoom'
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
/* ⛔ The column that grows has to be allowed to SHRINK, or the heart beside it drops onto a
   line of its own. A Bootstrap `.col` is `flex: 1 0 0%` with the default `min-width: auto`,
   so its floor is its widest unbreakable content -- the name, and the amount-and-date line
   under it. Once that floor exceeds the space, `.row`'s `flex-wrap: wrap` pushes the
   `col-auto` holding the heart down, and it did so at a DIFFERENT width for every booking,
   because each one's floor is its own text. That is why it read as random: measured at a
   column 260 points wide, three bookings of the same list disagreed -- two had dropped
   their heart, the third still had it beside the name, and the only difference between
   them was the width of their own amount.

   `min-width: 0` lets the text clip instead -- which is what `Name` is already written for,
   it clips with an ellipsis. Same fix and same class name as `ContactRow`, which is why the
   contacts column beside this one never had the fault. */
.min-w-0 {
  min-width: 0;
}

/* ⛔ `max-width` and `flex-wrap` are not decoration: a `button` never stretches. Its
   `width: auto` is shrink-to-fit even as a flex container, so this line keeps its full
   width as the column narrows and simply hangs over the heart. `max-width: 100%` is what
   makes that impossible rather than unlikely -- it binds the button to the column it sits
   in, and the heart is in a column of its own beside that one, so there is no width at
   which the two can meet. `flex-wrap` then decides what gives instead: the date drops
   under the amount (measured on the rendered markup: one line at a 300-point column, two
   lines at 260). At the narrowest desktop the column can be -- a quarter of a 992-point
   window -- it is the two-line form. */
.transaction-details-link {
  color: var(--bs-body-color) !important;
  border: none;
  background-color: transparent;
  border-bottom: 1px solid transparent;
  transition: border-bottom-color 0.15s ease-in-out;
  max-width: 100%;
  flex-wrap: wrap;
  column-gap: 1rem;
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
