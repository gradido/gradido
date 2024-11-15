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
          <component :is="nameComponent" v-bind="nameProps" />
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

const username = computed(() => ({
  username: `${props.transaction?.linkedUser?.firstName} ${props.transaction?.linkedUser?.lastName}`,
  initials: `${props.transaction?.linkedUser?.firstName[0]}${props.transaction.linkedUser?.lastName[0]}`,
}))

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
      username: username.value.username,
      initials: username.value.initials,
      color: '#fff',
      size: 42,
    }
  }
})

const nameComponent = computed(() => {
  return isCreationType.value ? 'div' : Name
})

const nameProps = computed(() => {
  if (isCreationType.value) {
    return {
      class: 'fw-bold',
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
