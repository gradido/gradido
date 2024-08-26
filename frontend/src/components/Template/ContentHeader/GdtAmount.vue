<template>
  <div class="gdt-amount mt-3 mt-lg-0">
    <div class="text-center">
      <BBadge
        v-if="badgeShow"
        class="position-absolute mt--2 px-3 zindex1"
        :class="showStatus ? 'bg-gradido-gradient' : ''"
        :variant="showStatus ? '' : 'light'"
      >
        {{ $t('GDT') }}
      </BBadge>
    </div>
    <div
      class="wallet-amount bg-white app-box-shadow gradido-border-radius p-4"
      :class="showStatus ? 'gradido-global-border-color-accent' : 'border-light opacity-05'"
    >
      <BRow>
        <BCol class="h4">{{ $t('gdt.gdtKonto') }}</BCol>
      </BRow>
      <BRow>
        <BCol cols="9">
          <IBiLayers class="me-3 gradido-global-border-color-accent d-none d-lg-inline" />
          <span v-if="hideAmount" class="fw-bold gradido-global-color-accent">
            {{ t('asterisks') }}
          </span>
          <span v-else class="fw-bold gradido-global-color-accent">
            {{ n(gdtBalance, 'decimal') }} {{ t('GDT') }}
          </span>
        </BCol>
        <BCol cols="3" class="border-start border-dark">
          <button class="transparent-button" @click="updateHideAmountGDT">
            <IBiEyeSlash
              v-if="hideAmount"
              class="me-3 gradido-global-border-color-accent pointer hover-icon"
            />
            <IBiEye v-else class="me-3 gradido-global-border-color-accent pointer hover-icon" />
          </button>
        </BCol>
      </BRow>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useMutation } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { updateUserInfos } from '@/graphql/mutations'
import { useAppToast } from '../../../composables/useToast'

const props = defineProps({
  gdtBalance: { type: Number, required: true },
  badgeShow: { type: Boolean, default: true },
  showStatus: { type: Boolean, default: false },
})

const store = useStore()
const { mutate } = useMutation(updateUserInfos)
const { t, n } = useI18n()
const { toastSuccess, toastError } = useAppToast()

const hideAmount = computed(() => store.state.hideAmountGDT)

const updateHideAmountGDT = async () => {
  try {
    await mutate({
      hideAmountGDT: !hideAmount.value,
    })

    store.commit('hideAmountGDT', !hideAmount.value)

    if (!hideAmount.value) {
      toastSuccess(t('settings.showAmountGDT'))
    } else {
      toastSuccess(t('settings.hideAmountGDT'))
    }
  } catch (error) {
    toastError(error.message)
  }
}
</script>

<style lang="scss" scoped>
.wallet-amount {
  border: 1px solid;
}
</style>
