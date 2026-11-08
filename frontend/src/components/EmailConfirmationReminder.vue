<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The visible half of the EM-013 blockade, past the deadline: the modal has no way to
       close and the server has already narrowed the account down (see the backend's
       RESTRICTED_WHILE_UNCONFIRMED) — the modal is the explanation, not the enforcement.
       The 24 hours before belong to the strip on the page (EmailConfirmationStrip, EM-014).
       Two ways out stay open on purpose: resending the mail, and correcting the address
       in the settings — which is why this modal never shows on /settings routes. -->
  <BModal
    id="modal-email-confirmation-reminder"
    v-model="visible"
    centered
    no-header
    no-close-on-backdrop
    no-close-on-esc
    data-test="email-confirmation-reminder"
  >
    <div class="text-center px-2 pt-3">
      <p class="h5 mb-3">{{ $t('emailConfirmation.title') }}</p>
      <p class="mb-2">{{ $t('emailConfirmation.mailSent') }}</p>
      <p class="mb-0" data-test="email-confirmation-overdue">
        {{ $t('emailConfirmation.overdue') }}
      </p>
      <p v-if="resent" class="small text-success mt-3 mb-0" data-test="email-confirmation-resent">
        {{ $t('emailConfirmation.resent') }}
      </p>
    </div>

    <template #footer>
      <BButton
        variant="secondary"
        data-test="email-confirmation-change-address"
        @click="goToSettings"
      >
        {{ $t('emailConfirmation.changeAddress') }}
      </BButton>
      <BButton
        variant="gradido"
        :disabled="resending"
        data-test="email-confirmation-resend"
        @click="resend"
      >
        {{ $t('emailConfirmation.resend') }}
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { computed, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BButton, BModal } from 'bootstrap-vue-next'
import { useEmailConfirmation } from '@/composables/useEmailConfirmation'
import {
  firstLoginWindowOnScreen,
  setFirstLoginWindowWanted,
} from '@/composables/useFirstLoginWindow'

const route = useRoute()
const router = useRouter()
const { unconfirmed, overdue, resend, resending, resent } = useEmailConfirmation()

// Whether this window has something to say -- not the same as being on screen. It is FIRST
// of the first-login windows (ES-003, useFirstLoginWindow), and only past the deadline: inside
// the grace period the strip on the page tells the member about the clock, and this window
// stays away (EM-014). Past it, it returns on every route change — coming back from the
// settings without having corrected anything must not leave the account silently narrowed
// down with no explanation in sight.
const wants = computed(
  () =>
    unconfirmed.value &&
    overdue.value &&
    // Never in the settings: correcting the address lives there, and an unclosable
    // modal on top of it would wall off its own way out.
    !route.path.startsWith('/settings'),
)
watch(wants, (value) => setFirstLoginWindowWanted('email', value), { immediate: true })
onUnmounted(() => setFirstLoginWindowWanted('email', false))

const onScreen = firstLoginWindowOnScreen('email')
const visible = computed({
  get: () => onScreen.value,
  // Nothing to record: the member has no way to close this window (no header, neither the
  // backdrop nor Esc), and what BModal writes back when the getter goes false on its own --
  // while the conversation an address opened has the screen (`/contacts?with=…`,
  // useFirstLoginWindow) -- is not an answer. The setter is only there because `v-model`
  // writes back.
  set: () => {},
})

const goToSettings = () => {
  router.push('/settings/account')
}
</script>
