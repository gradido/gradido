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
          <!-- ⛔ The button carries its own name and its own state. It is an icon and
               nothing else -- no text, no title, no label -- so before this it announced as
               a bare "button", and the balance it switches is a plain v-if pair outside any
               live region. The success toast was the only thing a screen reader ever heard
               here, and removing it laid that bare rather than causing it.
               `aria-pressed` is what makes the result audible: the label names the action
               and stays put, the state says whether it is on. (27.08.2026) -->
          <button
            class="transparent-button"
            :aria-label="$t('settings.hide-amount', { currency: $t('GDT') })"
            :aria-pressed="hideAmount"
            data-test="toggle-hide-amount-gdt"
            @click="updateHideAmountGDT"
          >
            <IBiEyeSlash
              v-if="hideAmount"
              class="me-3 gradido-global-border-color-accent pointer hover-icon eye-icon"
            />
            <IBiEye
              v-else
              class="me-3 gradido-global-border-color-accent pointer hover-icon eye-icon"
            />
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
const { toastError } = useAppToast()

const hideAmount = computed(() => store.state.hideAmountGDT)

const updateHideAmountGDT = async () => {
  // ⛔ Read ONCE, before the waiting. `hideAmount` is a computed on the store, so asking it
  // again after the await asks a different question: two quick clicks -- the very thing this
  // switch invites -- both read "visible" and both send "hide", and then the two commits run
  // in turn and land on visible again. The server holds hidden, the device shows the number,
  // and nothing says so until the next login. One value, used for both halves. (27.08.2026)
  const hidden = !hideAmount.value
  try {
    await mutate({
      hideAmountGDT: hidden,
    })

    store.commit('hideAmountGDT', hidden)
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
