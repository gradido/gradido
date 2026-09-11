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
    <BRow
      v-for="row in rows"
      :key="row.transaction.id"
      align-v="center"
      class="g-0 last-transactions-row"
    >
      <BCol cols="auto">
        <!-- The same size as the faces in the contacts, the other position of the switch
             above: 50, the middle of this column's old 64 and their 36. See the constant for
             why that is still sharp (AS-008). -->
        <app-avatar :size="RIGHT_COLUMN_AVATAR_SIZE" :color="'#fff'" v-bind="row.avatar" />
      </BCol>
      <BCol class="min-w-0">
        <!-- The name opens the contact window (KF-010), the same one the contact list
             opens -- it is not a way into the send form any more, here as little as
             anywhere else. The button under it still leads to the booking itself, so the
             two things this row can mean stay two controls. -->
        <div class="fw-bold last-transactions-name">
          <name
            :linked-user="row.transaction.linkedUser"
            font-color="text-dark"
            @open="openMember"
          />
        </div>
        <button
          class="transaction-details-link d-flex"
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
            class="transaction-amount"
            :class="{ 'received-amount': Number(row.transaction.amount) > 0 }"
          >
            {{ $filters.signedAmount(row.transaction.amount) }}
          </span>
          <!-- ⚠️ The gap to the amount is a `column-gap` on the button, not a margin here:
               where this line has to wrap, a margin would leave the date indented under
               nothing. -->
          <span class="text-end">
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
import { LAST_TRANSACTIONS_ROWS, RIGHT_COLUMN_AVATAR_SIZE } from '@/constants'

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
/* ⛔ Drawn to the measure of the contacts beside it (`ContactsPanel`, `.contacts-panel-row`),
   because the two are the two positions of one column: flicking the switch above them should
   change the people, not the type size, the spacing or the lines. The bookings were set
   larger and roomier, and Bernd wanted the contacts' measure for both (11.09.2026).
   `LastTransactions.spec` holds this file's numbers against that one's.

   `g-0` on the row takes Bootstrap's gutters out: with them the row runs 12 points past the
   column on both sides, and so would the line between two bookings. `column-gap` then puts
   back the contacts' 8 points between face, text and heart. */
.last-transactions-row {
  column-gap: 0.5rem;
  padding: 0.4rem 0;
}

/* The line BETWEEN two bookings, as between two contacts -- none above the first, none under
   the last. */
.last-transactions-row + .last-transactions-row {
  border-top: 1px solid var(--bs-border-color, #dee2e6);
}

.last-transactions-name {
  font-size: 0.85rem;
}

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
   under the amount, never over the heart.

   The type is the contacts' second line (0.72rem), set here once rather than as `.small` on
   each half; `padding: 0` takes away the browser's own button padding, which set this line
   6 points in from the name above it. */
.transaction-details-link {
  color: var(--bs-body-color) !important;
  border: none;
  background-color: transparent;
  border-bottom: 1px solid transparent;
  transition: border-bottom-color 0.15s ease-in-out;
  max-width: 100%;
  flex-wrap: wrap;
  column-gap: 1rem;
  padding: 0;
  font-size: 0.72rem;
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
