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
        <!-- A creation has no face, because there is no person on the other side: the
             community is. The gift square is the booking list's own (GddTransaction), at
             the size every face in this column has. -->
        <BAvatar
          v-if="row.isCreation"
          :size="LIST_AVATAR_SIZE"
          rounded="lg"
          variant="success"
          data-test="creation-gift"
        >
          <variant-icon icon="gift" variant="white" />
        </BAvatar>
        <!-- The size every list of people in the wallet uses, the contacts in the other
             position of the switch above included. See the constant for why 48. -->
        <app-avatar v-else :size="LIST_AVATAR_SIZE" :color="'#fff'" v-bind="row.avatar" />
      </BCol>
      <BCol class="min-w-0 last-transactions-text">
        <!-- The name opens the contact window (KF-010), the same one the contact list
             opens -- it is not a way into the send form any more, here as little as
             anywhere else. The button under it still leads to the booking itself, so the
             two things this row can mean stay two controls. -->
        <div class="fw-bold last-transactions-name">
          <!-- ⛔ A creation's name is NOT handed to `Name`, and not because of the words it
               would print. `Name` makes itself a button wherever it is given a member with
               a gradidoID -- and the community's stand-in carries one
               (backend/src/util/communityUser.ts), so it would offer a contact window about
               "the community". The booking list keeps the two apart in the same way. -->
          <span v-if="row.isCreation" class="last-transactions-community">
            {{ row.communityName }}
          </span>
          <name
            v-else
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
        <!-- ⛔ The memo's first line, readable without leaving the overview -- the booking
             list has shown it in its rows since 11.09.2026, and this column is the same
             list in short. No heading over it: the italics and the muted colour say what it
             is. A tap leads to the booking, as the line above does, and there the whole
             memo stands.

             Never `v-html`: a memo is written by the OTHER side of the booking. `MemoText`
             cuts it into text and addresses and renders both through Vue, which escapes
             them (see utils/memoParts). A link inside it keeps its own click, so following
             it does not also navigate. -->
        <div
          v-if="row.transaction.memo"
          class="last-transactions-memo"
          data-test="last-transactions-memo"
          @click="handleRedirect(row.transaction.id)"
        >
          <memo-text :memo="row.transaction.memo" />
        </div>
      </BCol>
      <!-- The heart at the row's end (KF-005), where there is somebody to mark. A creation
           names the community's stand-in, which carries a gradidoID like any member -- so
           "has a counterparty" is worked out in `rows` below and not from that field. -->
      <BCol v-if="row.hasCounterparty" cols="auto">
        <favorite-heart :member="row.transaction.linkedUser" />
      </BCol>
    </BRow>

    <!-- ONE window for the whole column, as every other list has one. -->
    <contact-window v-model="windowOpen" :contact="selected" />
  </div>
</template>
<script setup>
import Name from '@/components/TransactionRows/Name'
import MemoText from '@/components/TransactionRows/MemoText'
// ⚠️ Imported, although the build auto-imports both (unplugin-vue-components) and the rows
// around them get `BRow`/`BCol` that way. Under vitest there is no such plugin: a component
// that arrives only through it renders as an unknown element, and a stub cannot stand in for
// a name that was never resolved. The gift square is measured at the real `BAvatar`, so it
// has to be the real one that the test mounts.
import { BAvatar } from 'bootstrap-vue-next'
import VariantIcon from '@/components/VariantIcon.vue'
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
import { memberAlias } from '@/utils/gradidoAddress'
import { LAST_TRANSACTIONS_ROWS, LIST_AVATAR_SIZE } from '@/constants'

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
    // The two rows the backend puts on top of page one and this column does not show: the
    // decay of the member's own balance, and the summary of their open links. Both are
    // about the whole account rather than a booking, and neither has a memo.
    //
    // ⛔ Creations DO stand here, since 12.09.2026. They are bookings like any other, and
    // dropping them made "the newest bookings" a list with holes in it -- a member who had
    // just been given a creation found it missing from the column beside the overview.
    .filter(
      (transaction) => transaction.typeId !== 'DECAY' && transaction.typeId !== 'LINK_SUMMARY',
    )
    // ⚠️ The fetch that feeds this is sized in `constants.js` for exactly this cut. Change
    // the number here and the fetch has to grow with it, or the column simply shows fewer
    // rows than it asks for.
    .slice(0, LAST_TRANSACTIONS_ROWS)
    .map((transaction) => {
      const isCreation = transaction.typeId === 'CREATION'
      const avatar = isCreation ? null : memberAvatarProps(transaction.linkedUser)
      return {
        transaction,
        isCreation,
        // ⛔ Worked out here, once per row, rather than from `linkedUser.gradidoID` in the
        // template: a creation is linked to the community's STAND-IN, and that stand-in
        // carries a gradidoID like any member. Asking the field would put a heart beside
        // every creation and let a member mark the community as a favourite. Same
        // condition, same reason, as `hasCounterparty` in the booking list.
        hasCounterparty: !isCreation && Boolean(transaction.linkedUser?.gradidoID),
        // The COMMUNITY's name (NU-020) -- a creation is approved by a moderator, but it
        // is the community that gives, and the backend swaps its stand-in in for exactly
        // that reason. `memberAlias` falls back to the gradidoID, as everywhere else.
        communityName: isCreation
          ? memberAlias(transaction.linkedUser?.alias, transaction.linkedUser?.gradidoID)
          : '',
        // Spread into one object, so the template still binds a single `row.avatar`. The
        // zoom half is empty for a member without a picture, which leaves that circle
        // exactly as it was (AS-018). A creation has no face at all, so nothing is worked
        // out for it -- not even the letters of the community's name.
        avatar: isCreation
          ? null
          : { ...avatar, ...avatarZoomBindings(transaction.linkedUser, avatar) },
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

/* ⛔ The three lines are set tighter than the wallet's 1.5, and that is a rule about the
   ROW, not about the type: together they have to stay under the 48-point face beside them,
   because the face is what decides how tall a row is. At 1.5 the memo's line pushed the
   text block past the face and the bookings grew taller than the contacts in the other
   position of the switch -- the one thing H was built to make the same (Bernd, 12.09.2026,
   asked and answered before this was written).

   The type sizes are untouched, so the two positions still agree on those; what differs is
   the space BETWEEN the lines of one row. */
.last-transactions-text {
  line-height: 1.2;
}

/* The community's name on a creation row, where a member's name stands otherwise. Clipped
   the same way `Name` clips (a community may be called anything), and `contain` for the
   reason the memo below gives. */
.last-transactions-community {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  contain: inline-size;
}

/* The memo, marked as somebody else's words by italics and the muted colour -- no heading
   over it, exactly as in the booking list. `--bs-secondary-color` is defined in both modes.
   The size is Bernd's (12.09.2026): a step under the amount and date above it, because the
   memo is the third thing this row says, not the second. `cursor` because the line leads to
   the booking; a link inside it keeps its own click (MemoText). */
.last-transactions-memo {
  font-size: 0.65rem;
  font-style: italic;
  color: var(--bs-secondary-color, #6c757d);
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  /* The guard that belongs to `white-space: nowrap`, not to this place: a line that cannot
     break counts with its FULL length as the least width of every parent that works its own
     out, and that is what pushed the page apart when the booking list got this memo (#3886).

     ⚠️ Measured here, in the dashboard's own three columns at 1250 and 1440 points, with
     the longest memo in the fixture: taking it away changed NOTHING -- page 1262 points
     either way, column 319 either way. This column is a fixed share of the row (col-3), so
     its width is not worked out from its content the way the content column's is. It stays
     because the guard travels with the `nowrap` line: whoever moves this row somewhere that
     does size to content would otherwise meet #3886 again, and would have no reason to look
     here for the cause. */
  contain: inline-size;
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
