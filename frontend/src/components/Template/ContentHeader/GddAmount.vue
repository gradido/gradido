<template>
  <div class="gdd-amount translucent-color-opacity">
    <div class="text-center">
      <BBadge
        v-if="badgeShow"
        class="position-absolute mt--2 px-3 zindex1"
        :class="showStatus ? 'bg-gradido-gradient' : ''"
        :variant="showStatus ? '' : 'light'"
      >
        {{ $t('GDD') }}
      </BBadge>
    </div>
    <div
      class="wallet-amount bg-white app-box-shadow gradido-border-radius p-4"
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
          <IBiLayers class="me-3 gradido-global-border-color-accent d-none d-lg-inline" />
          <span v-if="hideAmount" class="fw-bold gradido-global-color-accent">
            {{ $t('asterisks') }}
          </span>
          <span v-else class="fw-bold gradido-global-color-accent">
            {{ $filters.GDD(balance) }}
          </span>
        </BCol>
        <BCol cols="3" class="border-start border-dark">
          <!-- ⛔ The button carries its own name and its own state. It is an icon and
               nothing else -- no text, no title, no label -- so before this it announced as
               a bare "button", and the balance it switches is a plain v-if pair outside any
               live region. The success toast was the only thing a screen reader ever heard
               here, and removing it laid that bare rather than causing it.
               `aria-pressed` is what makes the result audible: the label names the action
               and stays put, the state says whether it is on. (27.08.2026) -->
          <button
            class="transparent-button"
            :aria-label="$t('settings.hide-amount', { currency: $t('GDD') })"
            :aria-pressed="hideAmount"
            data-test="toggle-hide-amount-gdd"
            @click="updateHideAmountGDD"
          >
            <IBiEyeSlash
              v-if="hideAmount"
              class="me-3 gradido-global-border-color-accent eye-icon"
            />
            <IBiEye v-else class="me-3 gradido-global-border-color-accent eye-icon" />
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
const { toastError } = useAppToast()

const hideAmount = computed(() => store.state.hideAmountGDD)

const updateHideAmountGDD = async () => {
  try {
    await mutate({
      hideAmountGDD: !hideAmount.value,
    })

    store.commit('hideAmountGDD', !hideAmount.value)
    // ⛔ No toast either way. Hiding or showing the balance is a switch whose whole result
    // is on screen the moment it lands -- the number is there or it is not -- so a message
    // saying so afterwards only repeats what the eye has already seen. Switched quickly back
    // and forth they piled up on top of each other. (Bernd, 27.08.2026)
    //
    // ⚠️ The failure still speaks, and the reason is the opposite of what stood here at
    // first: `store.commit` above sits INSIDE the try, after the awaited mutation, so a
    // rejected save never reaches it and nothing changes on this device. The click simply
    // does nothing -- and a control that does nothing, silently, is the one case the eye
    // cannot report. That is what `toastError` is for.
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
