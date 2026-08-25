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
      <BCol>
        <div>
          <Name v-if="useNameComponent" v-bind="nameProps" />
          <div v-else :class="nameProps.class">
            {{ nameProps.creationLinkedUser }}
          </div>
        </div>
        <span class="small">{{ $d(new Date(props.transaction.balanceDate), 'short') }}</span>
        <span class="ms-4 small">{{ $d(new Date(props.transaction.balanceDate), 'time') }}</span>
      </BCol>
      <BCol cols="8" lg="3" md="3" sm="8" offset="3" offset-md="0" offset-lg="0">
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
      <BCol cols="12" md="1" lg="1" class="text-end">
        <collapse-icon class="text-end" :visible="visible" />
      </BCol>
    </BRow>
    <BCollapse :model-value="visible" class="pb-4 pt-lg-3">
      <decay-information
        :type-id="props.transaction.typeId"
        :decay="props.transaction.decay"
        :amount="props.transaction.amount"
        :memo="props.transaction.memo"
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
import DecayInformation from '../DecayInformations/DecayInformation'
import { BAvatar, BRow } from 'bootstrap-vue-next'
import AppAvatar from '@/components/AppAvatar.vue'
import { memberAvatarProps } from '@/composables/useMemberAvatars'

const props = defineProps({
  transaction: {
    type: Object,
    required: true,
  },
})

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
  if (isCreationType.value) {
    return {
      size: 42,
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
      color: '#fff',
      size: 42,
    }
  }
})

const useNameComponent = computed(() => {
  return !isCreationType.value
})

const nameProps = computed(() => {
  if (isCreationType.value) {
    return {
      class: 'fw-bold',
      // The moderator's alias (NU-020); the real name is no longer delivered here.
      creationLinkedUser: `${
        props.transaction.linkedUser.alias || props.transaction.linkedUser.gradidoID
      }`,
    }
  } else {
    return {
      class: 'fw-bold',
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
:deep(.b-avatar-custom > svg) {
  height: 2em;
  width: 2em;
}
</style>
