<template>
  <div
    :id="`transaction-${props.transaction.id}`"
    ref="gddTransaction"
    :class="`transaction-slot-${props.transaction.type}`"
    :data-transaction-id="`transaction-${props.transaction.id}`"
    @click="toggleVisible"
  >
    <BRow class="align-items-center">
      <BCol cols="3" lg="2" md="2">
        <component :is="avatarComponent" v-bind="avatarProps">
          <variant-icon v-if="isCreationType" icon="gift" variant="white" />
        </component>
      </BCol>
      <!-- ⛔ `min-w-0`, because the name below is `nowrap` and would otherwise set this
           column's floor to its own full width -- pushing the amount and the arrow out of
           the row. Same guard, same class name, as `ContactRow` and the bookings column. -->
      <BCol class="min-w-0">
        <!-- ⛔ The heart stands HERE, beside the name, and not at the row's end where it
             used to. Next to the collapse arrow it read as a mark on the BOOKING; it is a
             mark on the PERSON, and a booking cannot be a favourite. (Bernd, 04.09.2026.)
             Beside the name it says what it means without a word.

             The name is its own control (KF-010): it opens the contact window for this
             counterparty, while a tap anywhere else on the row still opens the booking's
             details. What it hands up is the member it was given -- `Name` sends back the
             `linkedUser` it was drawing, so no second expression here can name somebody
             else. The LIST owns the window, one per list rather than one per row.

             ⚠️ The heart swallows its own click (`@click.stop.prevent` in the component),
             so it does not open the booking underneath it -- which is why it can sit
             inside this row at all. -->
        <div class="d-flex align-items-center gap-2">
          <Name v-if="useNameComponent" v-bind="nameProps" @open="emit('open-member', $event)" />
          <div v-else :class="nameProps.class">
            {{ nameProps.creationLinkedUser }}
          </div>
          <favorite-heart v-if="hasCounterparty" :member="props.transaction.linkedUser" />
        </div>
        <span class="small">{{ $d(new Date(props.transaction.balanceDate), 'short') }}</span>
        <span class="ms-4 small">{{ $d(new Date(props.transaction.balanceDate), 'time') }}</span>
      </BCol>
      <!-- On the phone the amount and the arrow start a line of their own, together -- this
           break is what makes them one line rather than two. From `md` on it is gone and
           everything stands in one line, as before. -->
      <div class="w-100 d-md-none" />
      <!-- ⛔ `col` has to be SAID here. bootstrap-vue-next adds the plain `col` class only to a
           column that has no breakpoint sizes at all; with `md`/`lg` given, the phone got no
           width class, so Bootstrap's `.row > *` made the amount 100% wide beside its 25%
           offset -- past the row's right edge -- and the arrow wrapped onto a line of its own,
           at the left. Measured at 390 points against the served stylesheet: with `col` the
           amount takes what the arrow leaves, and the page is exactly as wide as the screen. -->
      <BCol col offset="3" md="3" lg="3" offset-md="0" offset-lg="0">
        <div class="small mb-2">
          {{ $t(`decay.types.${props.transaction.typeId.toLowerCase()}`) }}
        </div>
        <div
          :class="[
            'fw-bold',
            {
              'gradido-global-color-accent': props.transaction.typeId === 'RECEIVE',
              'text-140': props.transaction.typeId === 'SEND',
            },
          ]"
          data-test="transaction-amount"
        >
          {{ $filters.GDD(props.transaction.amount) }}
        </div>
        <div v-if="props.transaction.linkId" class="small">
          {{ $t('via_link') }}
          <variant-icon icon="link45deg" variant="muted" class="m-mb-1" />
        </div>
        <!--
          ★ One rule, in all three of these rows, and no component decides who may see what:
          if a name came with the booking, it is shown; if not, only that a card was used.

          What makes that safe is the BACKEND. It fills the name on a SEND row alone — the
          payer's own row, where the card is theirs and answers "which of my cards was that?"
          for somebody who has had several. The till's row arrives without one: they held the
          card for a moment, but in their own history somebody else's word for it is none of
          their business. A rule that lives in one place cannot drift apart in three.
        -->
        <div
          v-else-if="props.transaction.thankYouCardLabel"
          class="small"
          data-test="transaction-via-card"
        >
          {{ props.transaction.thankYouCardLabel }}
          <variant-icon icon="cards" variant="muted" class="m-mb-1" />
        </div>
        <div
          v-else-if="props.transaction.viaThankYouCard"
          class="small"
          data-test="transaction-via-card"
        >
          {{ $t('via_card') }}
          <variant-icon icon="cards" variant="muted" class="m-mb-1" />
        </div>
      </BCol>
      <!-- The arrow alone now; the heart moved up beside the name. `auto` at EVERY width,
           beside the amount: on the phone it used to take a line of its own (`cols="12"`)
           under everything else, where nobody looks for it -- on the desk it always stood at
           the amount's height, and now it does there too (Bernd, 11.09.2026). -->
      <BCol cols="auto" class="d-flex justify-content-end align-items-center">
        <collapse-icon class="text-end" :visible="visible" />
      </BCol>
      <!-- ⛔ The memo belongs to the row, not to the opened part: its first line is readable
           without opening the booking, and opening it shows the whole memo in the same place
           rather than a second copy further down (Bernd, 11.09.2026). No heading over it --
           italics and the muted colour say what it is.

           Opened, a click on it does nothing, as it did in the old place: somebody selecting
           the text to copy it should not close the booking under their hand. Closed, it is
           part of the row like everything else, and a click opens it. -->
      <BCol v-if="props.transaction.memo" cols="9" offset="3" md="10" offset-md="2" class="mt-1">
        <div
          class="transaction-memo"
          :class="{ 'transaction-memo-clamped': !visible }"
          data-test="transaction-memo"
          @click="visible && $event.stopPropagation()"
        >
          <memo-text :memo="props.transaction.memo" />
        </div>
      </BCol>
    </BRow>
    <BCollapse :model-value="visible" class="pb-4 pt-3">
      <decay-information
        :type-id="props.transaction.typeId"
        :decay="props.transaction.decay"
        :amount="props.transaction.amount"
        :balance="props.transaction.balance"
        :previous-balance="props.transaction.previousBalance"
      />
    </BCollapse>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import CollapseIcon from '../TransactionRows/CollapseIcon'
import Name from '../TransactionRows/Name'
import FavoriteHeart from '@/components/FavoriteHeart.vue'
import DecayInformation from '../DecayInformations/DecayInformation'
import MemoText from '@/components/TransactionRows/MemoText'
import { BAvatar, BRow } from 'bootstrap-vue-next'
import AppAvatar from '@/components/AppAvatar.vue'
import { avatarZoomBindings } from '@/composables/useAvatarZoom'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { memberAlias } from '@/utils/gradidoAddress'
import { LIST_AVATAR_SIZE } from '@/constants'

const props = defineProps({
  transaction: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['open-member'])

const gddTransaction = ref(null)

const store = useStore()
const visible = ref(false)

const toggleVisible = () => {
  visible.value = !visible.value
}

// What the circle says, what colours it, and the picture if the wallet already holds one --
// from one call, so the parts cannot come to describe different members (AS-010). The
// letters follow the alias, because the line right beside this circle shows the alias; the
// colour keeps following the real initials, so nobody's colour moves and the printed card
// still agrees with the screen.
//
// Reading only, never fetching: the request for the whole list happens once, in
// DashboardLayout. `linkedUser` may be null, and this is written for that.
const memberAvatar = computed(() => memberAvatarProps(props.transaction?.linkedUser))

const isCreationType = computed(() => {
  return props.transaction.typeId === 'CREATION'
})

const avatarComponent = computed(() => {
  return isCreationType.value ? BAvatar : AppAvatar
})

const avatarProps = computed(() => {
  // Both kinds of row stand in one list, so the gift takes the size the faces take
  // (LIST_AVATAR_SIZE -- see the constant for why 48).
  if (isCreationType.value) {
    return {
      size: LIST_AVATAR_SIZE,
      rounded: 'lg',
      variant: 'success',
    }
  } else {
    return {
      // Spread, not four hand-copied lines: `name`, `initials`, `colorSeed` and `src`
      // belong together, and the one time this house let a call site assemble such a set
      // itself, it wrote `username` -- a prop AppAvatar does not have, dropped in silence,
      // and the fallback it was meant to feed never arrived.
      ...memberAvatar.value,
      // Opens the picture at full size on a tap (AS-018). Empty for a member who has no
      // picture, so those circles stay exactly as unclickable as they were -- the helper
      // decides that, not this template.
      //
      // ⚠️ AFTER the spread on purpose. Both objects are built for this one avatar, so
      // nothing collides today; put first, a later key of the same name in
      // `memberAvatarProps` would silently take the zoom away and no test would say so.
      //
      // The label is NOT assembled here. It was, at both call sites, until a review pointed
      // out that the helper already holds the member -- and that two call-site expressions
      // are exactly how the button and the overlay come to name different people.
      ...avatarZoomBindings(props.transaction?.linkedUser, memberAvatar.value),
      color: '#fff',
      size: LIST_AVATAR_SIZE,
    }
  }
})

const useNameComponent = computed(() => {
  return !isCreationType.value
})

// Same condition Name.vue uses to make the name a link -- and the one this row uses for
// the heart. Held in one place so the two cannot drift apart.
const hasCounterparty = computed(
  () => !isCreationType.value && Boolean(props.transaction.linkedUser?.gradidoID),
)

const nameProps = computed(() => {
  if (isCreationType.value) {
    return {
      // ⛔ `min-w-0` travels with the name, not with its container: inside the flex line
      // it shares with the heart it is the item that has to be allowed to shrink, or a
      // long name pushes the heart out of the row instead of clipping.
      class: 'fw-bold min-w-0',
      // The COMMUNITY's name (NU-020). A creation booking is linked to the community
      // stand-in, not to the moderator who approved it -- the backend swaps that user in
      // unconditionally -- so `alias` carries the configured community name and this line
      // names the community, as it always did. No real name is delivered here any more.
      creationLinkedUser: memberAlias(
        props.transaction.linkedUser.alias,
        props.transaction.linkedUser.gradidoID,
      ),
    }
  } else {
    return {
      class: 'fw-bold min-w-0',
      amount: props.transaction.amount,
      linkedUser: props.transaction.linkedUser,
      linkId: props.transaction.linkId,
    }
  }
})

const handleOpenAfterScroll = (scrollY) => {
  const handleScrollEnd = () => {
    window.removeEventListener('scrollend', handleScrollEnd)
  }

  window.addEventListener('scrollend', handleScrollEnd)
  window.scrollTo(0, scrollY)
}

const transactionToHighlightId = computed(() => store.state.transactionToHighlightId)

watch(
  transactionToHighlightId,
  async (newValue) => {
    if (parseInt(newValue) === props.transaction.id) {
      visible.value = true
      setTimeout(() => {
        const element = document.getElementById(`transaction-${props.transaction.id}`)
        const yVal = element.getBoundingClientRect().top + window.pageYOffset - 16
        handleOpenAfterScroll(yVal)
      }, 300)
      await store.dispatch('changeTransactionToHighlightId', '')
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
/* The memo, marked as something somebody wrote by italics and the muted colour of the row's
   other secondary lines -- the heading "Nachricht" that used to stand over it is gone
   (Bernd, 11.09.2026: variant a of three). `--bs-secondary-color` is defined in both modes. */
.transaction-memo {
  font-style: italic;
  color: var(--bs-secondary-color, #6c757d);
  overflow-wrap: anywhere;
}

/* Closed, the first line and an ellipsis; the arrow opens the rest. The column is a fixed
   share of the row, so the line can be cut where it ends. */
.transaction-memo-clamped {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.b-avatar-custom > svg) {
  height: 2em;
  width: 2em;
}

/* See the note at the column: a Bootstrap `.col` floors at its own widest unbreakable
   content, and the name is one unbreakable run. Without this the name decides how wide the
   row has to be, and everything to its right is pushed off the line. */
.min-w-0 {
  min-width: 0;
}
</style>
