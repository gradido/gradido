// AI-GENERATED — not an architecture reference
import { useMutation, useQuery } from '@vue/apollo-composable'
import { BButton, BForm, BFormGroup, BFormInput, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, onUnmounted, ref, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { cancelEmailChange, requestEmailChange, resendEmailChange } from '@/graphql/mutations'
import { pendingEmailChange } from '@/graphql/queries'
import { useWalletStore } from '@/store/useWalletStore'

export const UserEmail = defineComponent({
  name: 'UserEmail',
  setup() {
    const store = useWalletStore()
    const { t } = useI18n()
    const { toastError, toastSuccess } = useAppToast()

    const currentEmail = computed<string>(() => store.email || '')

    // `cache-and-network`: this query takes no variables and therefore lives under one cache
    // key for everybody. The cache is emptied on logout, which is the real fix; this is the
    // second lock, for every way a member can change without that action running.
    const { result, refetch } = useQuery(pendingEmailChange, null, {
      fetchPolicy: 'cache-and-network',
    })
    const pending = computed<{ email: string; resendAllowedAt: string } | null>(
      () => result.value?.pendingEmailChange ?? null,
    )

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
    const errorText = (message: string) => {
      if (message.includes('Password is invalid')) {
        return t('settings.email.error-password')
      }
      if (message.includes('already in use')) {
        return t('settings.email.error-taken')
      }
      if (message.includes('already sent less than')) {
        return t('settings.email.error-wait')
      }
      if (message.includes('already the email address')) {
        return t('settings.email.error-same')
      }
      if (message.includes('Invalid email address')) {
        return t('settings.email.error-invalid')
      }
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
        const answer = await request({ email: newEmail.value, password: password.value })
        toastSuccess(t('settings.email.sent', { email: answer?.data.requestEmailChange.email }))
        abort()
        await refetch()
      } catch (error) {
        toastError(errorText((error as Error).message))
      } finally {
        busy.value = false
      }
    }

    const resend = async () => {
      busy.value = true
      try {
        const answer = await resendMutation()
        toastSuccess(t('settings.email.sent', { email: answer?.data.resendEmailChange.email }))
        await refetch()
      } catch (error) {
        toastError(errorText((error as Error).message))
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
        toastError((error as Error).message)
      } finally {
        busy.value = false
      }
    }

    return () => (
      <div id='user-email'>
        <BFormGroup label={t('form.email')} description={t('settings.emailInfo')}>
          <BFormInput modelValue={currentEmail.value} readonly data-test='email-current' />
        </BFormGroup>

        {/* A change is under way: the old address stays in force until the link in the mail
            is clicked. Resending is throttled by the server; the button says so instead of
            letting somebody click into an error. */}
        {pending.value ? (
          <div class='alert gradido-border-radius mt-2' data-test='email-pending'>
            <p class='mb-2'>{t('settings.email.pending', { email: pending.value.email })}</p>
            <div class='d-flex flex-wrap gap-2'>
              <BButton
                size='sm'
                variant='outline-secondary'
                disabled={!canResend.value || busy.value}
                data-test='email-resend'
                onClick={resend}
              >
                {canResend.value
                  ? t('settings.email.resend')
                  : t('settings.email.resend-wait', { minutes: minutesUntilResend.value })}
              </BButton>
              <BButton
                size='sm'
                variant='outline-danger'
                disabled={busy.value}
                data-test='email-cancel'
                onClick={cancel}
              >
                {t('settings.email.cancel')}
              </BButton>
            </div>
          </div>
        ) : (
          <div>
            {!editing.value ? (
              <BButton
                variant='outline-secondary'
                size='sm'
                data-test='email-change-open'
                onClick={() => {
                  editing.value = true
                }}
              >
                {t('settings.email.change')}
              </BButton>
            ) : (
              <BForm data-test='email-change-form' onSubmit={withModifiers(submit, ['prevent'])}>
                <BFormGroup label={t('settings.email.new')} class='mt-2'>
                  <BFormInput
                    modelValue={newEmail.value}
                    type='email'
                    required
                    autocomplete='email'
                    data-test='email-new'
                    onUpdate:modelValue={(entered) => {
                      newEmail.value = String(entered ?? '')
                    }}
                  />
                </BFormGroup>
                {/* The password is the security model, not a formality: a session on an unlocked
                    phone must not be enough to move the account to somebody else's mailbox. */}
                <BFormGroup
                  label={t('settings.email.password')}
                  description={t('settings.email.password-why')}
                >
                  <BFormInput
                    modelValue={password.value}
                    type='password'
                    required
                    autocomplete='current-password'
                    data-test='email-password'
                    onUpdate:modelValue={(entered) => {
                      password.value = String(entered ?? '')
                    }}
                  />
                </BFormGroup>
                <div class='d-flex flex-wrap gap-2'>
                  <BButton
                    type='submit'
                    variant={'gradido' as ButtonVariant}
                    disabled={!newEmail.value || !password.value || busy.value}
                    data-test='email-submit'
                  >
                    {t('settings.email.send')}
                  </BButton>
                  <BButton variant='secondary' data-test='email-abort' onClick={abort}>
                    {t('form.cancel')}
                  </BButton>
                </div>
              </BForm>
            )}
          </div>
        )}
      </div>
    )
  },
})
