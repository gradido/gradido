<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The visible half of the EM-013 blockade. Inside the grace period the modal can be
       waved away ("Später") and only reminds; past the deadline it loses every way to
       close and the server has already narrowed the account down (see the backend's
       RESTRICTED_WHILE_UNCONFIRMED) — the modal is the explanation, not the enforcement.
       Two ways out stay open on purpose: resending the mail, and correcting the address
       in the settings — which is why this modal never shows on /settings routes. -->
  <BModal
    id="modal-email-confirmation-reminder"
    v-model="visible"
    centered
    hide-header
    :no-close-on-backdrop="overdue"
    :no-close-on-esc="overdue"
    data-test="email-confirmation-reminder"
  >
    <div class="text-center px-2 pt-3">
      <p class="h5 mb-3">{{ $t('emailConfirmation.title') }}</p>
      <p class="mb-2">{{ $t('emailConfirmation.mailSent') }}</p>
      <p v-if="!overdue" class="mb-0" data-test="email-confirmation-grace">
        {{ $t('emailConfirmation.grace', { deadline: deadlineText }) }}
      </p>
      <p v-else class="mb-0" data-test="email-confirmation-overdue">
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
      <BButton
        v-if="!overdue"
        variant="gradido"
        data-test="email-confirmation-later"
        @click="visible = false"
      >
        {{ $t('emailConfirmation.later') }}
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { useMutation } from '@vue/apollo-composable'
import { BButton, BModal } from 'bootstrap-vue-next'
import { resendConfirmationEmail } from '@/graphql/mutations'
import { useAppToast } from '@/composables/useToast'

// ⚠️ Mirrors CONFIRMATION_GRACE_PERIOD_HOURS in the backend
// (backend/src/data/EmailConfirmation.logic.ts). The server enforces its own copy;
// this one only decides what the modal says and whether it can be waved away —
// change one, change both.
const CONFIRMATION_GRACE_HOURS = 24

const store = useStore()
const route = useRoute()
const router = useRouter()
const { toastError } = useAppToast()

const dismissed = ref(false)
const resent = ref(false)
const resending = ref(false)

const deadline = computed(() =>
  store.state.accountCreatedAt
    ? new Date(
        new Date(store.state.accountCreatedAt).getTime() +
          CONFIRMATION_GRACE_HOURS * 60 * 60 * 1000,
      )
    : null,
)

const overdue = computed(() => !!deadline.value && Date.now() > deadline.value.getTime())

const deadlineText = computed(() =>
  deadline.value
    ? deadline.value.toLocaleString(store.state.language || undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '',
)

const visible = computed({
  // `overdue` overrides `dismissed`: past the deadline the modal returns on every
  // route change — coming back from the settings without having corrected anything
  // must not leave the account silently narrowed down with no explanation in sight.
  get: () =>
    store.state.emailChecked === false &&
    (overdue.value || !dismissed.value) &&
    // Never in the settings: correcting the address lives there, and an unclosable
    // modal on top of it would wall off its own way out.
    !route.path.startsWith('/settings'),
  set: (value) => {
    if (!value) {
      dismissed.value = true
    }
  },
})

const { mutate: resendMutation } = useMutation(resendConfirmationEmail)

const resend = async () => {
  resending.value = true
  try {
    await resendMutation()
    resent.value = true
  } catch (error) {
    toastError(error.message)
  } finally {
    resending.value = false
  }
}

const goToSettings = () => {
  dismissed.value = true
  router.push('/settings/account')
}
</script>
