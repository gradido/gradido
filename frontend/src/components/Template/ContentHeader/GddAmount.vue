<template>
  <div class="gdd-amount translucent-color-opacity">
    <div class="text-center">
      <BBadge
        v-if="badgeShow"
        class="position-absolute mt--2 ml--4 px-3 zindex1"
        :class="showStatus ? 'bg-gradient' : ''"
        :variant="showStatus ? '' : 'light'"
      >
        {{ $t('GDD') }}
      </BBadge>
    </div>
    <div
      class="wallet-amount bg-white app-box-shadow gradido-border-radius p-4 border"
      :class="
        showStatus || path === '/overview'
          ? 'gradido-global-border-color-accent'
          : 'border-light opacity-05'
      "
    >
      <BRow>
        <BCol class="h4">{{ $t('gddKonto') }}</BCol>
      </BRow>

      <BRow>
        <BCol cols="9">
          <!--          <b-icon-->
          <!--            icon="layers"-->
          <!--            class="mr-3 gradido-global-border-color-accent d-none d-lg-inline"-->
          <!--          ></b-icon>-->
          <IBiLayers class="mr-3 gradido-global-border-color-accent" />
          <span v-if="hideAmount" class="font-weight-bold gradido-global-color-accent">
            {{ $t('asterisks') }}
          </span>
          <span v-else class="font-weight-bold gradido-global-color-accent">
            {{ $filters.GDD(balance) }}
          </span>
        </BCol>
        <BCol cols="3" class="border-left border-light">
          <button class="transparent-button" @click="updateHideAmountGDD">
            <IBiEyeSlash v-if="hideAmount" class="mr-3 gradido-global-border-color-accent" />
            <IBiEye v-else class="mr-3 gradido-global-border-color-accent" />
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
import { useAppToast } from '@/composables/useToast'

const props = defineProps({
  path: { type: String, required: false, default: '' },
  balance: { type: Number, required: true },
  badgeShow: { type: Boolean, default: true },
  showStatus: { type: Boolean, default: false },
})

const store = useStore()
const { mutate } = useMutation(updateUserInfos)
const { t } = useI18n()
const { toastSuccess, toastError } = useAppToast()

const hideAmount = computed(() => store.state.hideAmountGDD)

const updateHideAmountGDD = async () => {
  try {
    await mutate({
      hideAmountGDD: !hideAmount.value,
    })

    store.commit('hideAmountGDD', !hideAmount.value)

    if (!hideAmount.value) {
      toastSuccess(t('settings.showAmountGDD'))
    } else {
      toastSuccess(t('settings.hideAmountGDD'))
    }
  } catch (error) {
    toastError(error.message)
  }
}
</script>
