<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div id="user-email">
    <BFormGroup :label="$t('form.email')" :description="$t('settings.emailInfo')">
      <BFormInput :model-value="currentEmail" readonly data-test="email-current" />
    </BFormGroup>

    <!-- A change is under way: the old address stays in force until the link in the mail
         is clicked. Resending is throttled by the server; the button says so instead of
         letting somebody click into an error. -->
    <div v-if="pending" class="alert gradido-border-radius mt-2" data-test="email-pending">
      <p class="mb-2">{{ $t('settings.email.pending', { email: pending.email }) }}</p>
      <div class="d-flex flex-wrap gap-2">
        <BButton
          size="sm"
          variant="outline-secondary"
          :disabled="!canResend || busy"
          data-test="email-resend"
          @click="resend"
        >
          {{
            canResend
              ? $t('settings.email.resend')
              : $t('settings.email.resend-wait', { minutes: minutesUntilResend })
          }}
        </BButton>
        <BButton
          size="sm"
          variant="outline-danger"
          :disabled="busy"
          data-test="email-cancel"
          @click="cancel"
        >
          {{ $t('settings.email.cancel') }}
        </BButton>
      </div>
    </div>

    <div v-else>
      <BButton
        v-if="!editing"
        variant="outline-secondary"
        size="sm"
        data-test="email-change-open"
        @click="editing = true"
      >
        {{ $t('settings.email.change') }}
      </BButton>
      <BForm v-else data-test="email-change-form" @submit.prevent="submit">
        <BFormGroup :label="$t('settings.email.new')" class="mt-2">
          <BFormInput
            v-model="newEmail"
            type="email"
            required
            autocomplete="email"
            data-test="email-new"
          />
        </BFormGroup>
        <!-- The password is the security model, not a formality: a session on an unlocked
             phone must not be enough to move the account to somebody else's mailbox. -->
        <BFormGroup
          :label="$t('settings.email.password')"
          :description="$t('settings.email.password-why')"
        >
          <BFormInput
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            data-test="email-password"
          />
        </BFormGroup>
        <div class="d-flex flex-wrap gap-2">
          <BButton
            type="submit"
            variant="gradido"
            :disabled="!newEmail || !password || busy"
            data-test="email-submit"
          >
            {{ $t('settings.email.send') }}
          </BButton>
          <BButton variant="secondary" data-test="email-abort" @click="abort">
            {{ $t('form.cancel') }}
          </BButton>
        </div>
      </BForm>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { BButton, BForm, BFormGroup, BFormInput } from 'bootstrap-vue-next'
import { cancelEmailChange, requestEmailChange, resendEmailChange } from '@/graphql/mutations'
import { pendingEmailChange } from '@/graphql/queries'
import { useAppToast } from '@/composables/useToast'

const store = useStore()
const { t } = useI18n()
const { toastError, toastSuccess } = useAppToast()

const currentEmail = computed(() => store.state.email || '')

// `cache-and-network`: this query takes no variables and therefore lives under one cache
// key for everybody. The cache is emptied on logout, which is the real fix; this is the
// second lock, for every way a member can change without that action running.
const { result, refetch } = useQuery(pendingEmailChange, null, {
  fetchPolicy: 'cache-and-network',
})
const pending = computed(() => result.value?.pendingEmailChange ?? null)

const { mutate: request } = useMutation(requestEmailChange)
const { mutate: resendMutation } = useMutation(resendEmailChange)
const { mutate: cancelMutation } = useMutation(cancelEmailChange)

const editing = ref(false)
const newEmail = ref('')
const password = ref('')
const busy = ref(false)

// The resend button counts down from the moment the server named. A half-minute tick is
// plenty for a number of minutes.
const now = ref(Date.now())
const ticker = setInterval(() => {
  now.value = Date.now()
}, 30000)
onUnmounted(() => clearInterval(ticker))

const resendAllowedAt = computed(() =>
  pending.value ? new Date(pending.value.resendAllowedAt).getTime() : 0,
)
const canResend = computed(() => now.value >= resendAllowedAt.value)
const minutesUntilResend = computed(() =>
  Math.max(1, Math.ceil((resendAllowedAt.value - now.value) / 60000)),
)

// The server answers in English; the few answers a member can provoke get a sentence in
// their language, anything else is shown as it came.
const errorText = (message) => {
  if (message.includes('Password is invalid')) return t('settings.email.error-password')
  if (message.includes('already in use')) return t('settings.email.error-taken')
  if (message.includes('already sent less than')) return t('settings.email.error-wait')
  if (message.includes('already the email address')) return t('settings.email.error-same')
  if (message.includes('Invalid email address')) return t('settings.email.error-invalid')
  return message
}

const abort = () => {
  editing.value = false
  newEmail.value = ''
  password.value = ''
}

const submit = async () => {
  busy.value = true
  try {
    const { data } = await request({ email: newEmail.value, password: password.value })
    toastSuccess(t('settings.email.sent', { email: data.requestEmailChange.email }))
    abort()
    await refetch()
  } catch (error) {
    toastError(errorText(error.message))
  } finally {
    busy.value = false
  }
}

const resend = async () => {
  busy.value = true
  try {
    const { data } = await resendMutation()
    toastSuccess(t('settings.email.sent', { email: data.resendEmailChange.email }))
    await refetch()
  } catch (error) {
    toastError(errorText(error.message))
  } finally {
    busy.value = false
  }
}

const cancel = async () => {
  busy.value = true
  try {
    await cancelMutation()
    toastSuccess(t('settings.email.cancelled'))
    await refetch()
  } catch (error) {
    toastError(error.message)
  } finally {
    busy.value = false
  }
}
</script>
