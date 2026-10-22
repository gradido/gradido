// AI-GENERATED — not an architecture reference
import { useMutation, useQuery } from '@vue/apollo-composable'
import { BButton, BFormInput, BInputGroup } from 'bootstrap-vue-next'
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { adminEmailStatus } from '../graphql/adminEmailStatus'
import { adminReplaceUnconfirmedEmail } from '../graphql/adminReplaceUnconfirmedEmail'
import { sendActivationEmail } from '../graphql/sendActivationEmail'
import './ConfirmRegisterMailFormular.css'

type EmailStatus = {
  gdtEmail: string
  currentConfirmed: boolean
  elopageBuysOnCurrent: boolean
  pendingEmail: string | null
  pendingSince: string | null
}

export const ConfirmRegisterMailFormular = defineComponent({
  name: 'ConfirmRegisterMailFormular',
  props: {
    checked: {
      type: Boolean,
    },
    email: {
      type: String,
    },
    dateLastSend: {
      type: String,
    },
    userId: {
      type: Number,
      default: null,
    },
  },
  emits: ['email-replaced'],
  setup(props, { emit }) {
    const { t, d } = useI18n()
    const { toastError, toastSuccess } = useAppToast()

    const email = ref(props.email)
    const replacement = ref('')
    const replacing = ref(false)

    const { mutate: activateEmail } = useMutation(sendActivationEmail)
    const { mutate: replaceMutation } = useMutation(adminReplaceUnconfirmedEmail)

    // Keyed by the member, so every row of the table has a cache entry of its own.
    const { result: statusResult, refetch: refetchStatus } = useQuery(
      adminEmailStatus,
      () => ({ userId: props.userId }),
      () => ({ enabled: props.userId !== null, fetchPolicy: 'cache-and-network' }),
    )
    const status = computed<EmailStatus | null>(() => statusResult.value?.adminEmailStatus ?? null)

    const sendRegisterMail = async () => {
      try {
        await activateEmail({
          email: email.value,
        })
        toastSuccess(t('unregister_mail.success', { email: email.value }))
      } catch (error) {
        toastError(t('unregister_mail.error', { message: (error as Error).message }))
      }
    }

    // The correction's refusals in this page's words. The server's wording is what
    // `adminReplaceUnconfirmedEmail` in the backend's EmailChangeResolver throws, and the spec
    // holds it; any other answer is shown as the server gave it.
    const replaceRefusal = (message: string, typed: string): string => {
      switch (message) {
        case 'Email address already in use':
          return t('unregister_mail.replace.taken', { email: typed })
        case 'The address is confirmed - only the member can change it':
          return t('unregister_mail.replace.confirmed', { email: typed })
        case 'Invalid email address':
          return t('unregister_mail.replace.invalid', { email: typed })
        default:
          return t('unregister_mail.replace.error', { message })
      }
    }

    const replaceEmail = async () => {
      const typed = replacement.value
      // Locks the button until the answer is in: a second click would send the correction again
      // while the first one is still being saved.
      replacing.value = true
      let corrected: string
      try {
        // No answer (null) throws here and ends in the toast below, as it did
        const { data } = (await replaceMutation({
          userId: props.userId,
          email: typed,
        })) as { data: { adminReplaceUnconfirmedEmail: string } }
        corrected = data.adminReplaceUnconfirmedEmail
      } catch (error) {
        toastError(replaceRefusal((error as Error).message, typed))
        return
      } finally {
        replacing.value = false
      }
      email.value = corrected
      // Cleared only if it still holds what was sent: whatever was typed meanwhile stays.
      if (replacement.value === typed) {
        replacement.value = ''
      }
      emit('email-replaced', corrected)
      toastSuccess(t('unregister_mail.replace.success', { email: corrected }))
      // The correction stands; a status that could not be fetched again does not make it a
      // failed one.
      await refetchStatus()?.catch(() => undefined)
    }

    return () => (
      <div class='component-confirm-register-mail'>
        <div class='shadow p-3 mb-5 bg-white rounded'>
          {props.checked ? (
            <div>{t('unregister_mail.text_true')}</div>
          ) : (
            <div>
              {props.dateLastSend === ''
                ? t('unregister_mail.never_sent', { email: email.value })
                : t('unregister_mail.text_false', {
                    date: props.dateLastSend,
                    email: email.value,
                  })}{' '}
              <BInputGroup prepend={t('unregister_mail.info')} class='mt-3'>
                <BFormInput v-model={email.value} readonly />
                <BButton
                  variant='outline-success'
                  // ⚠️ No prop of BButton: it lands on the button as an attribute, as it did
                  {...{ append: '' }}
                  class='test-button'
                  onClick={sendRegisterMail}
                >
                  {t('unregister_mail.button')}
                </BButton>
              </BInputGroup>
              {/* The other way out when the mail never arrives: a typo at registration. Only
                  while the address was never confirmed - a confirmed address is the member's
                  own to change, from their settings. The row is corrected in place, not
                  historised: a mistyped address was never anybody's key. The fetched status
                  decides, not the table row, which may be older than the confirmation. */}
              {!status.value || !status.value.currentConfirmed ? (
                <div class='mt-4' data-test='email-replace'>
                  <div class='fw-bold'>{t('unregister_mail.replace.title')}</div>
                  <div class='small text-muted mb-2'>{t('unregister_mail.replace.hint')}</div>
                  {status.value?.elopageBuysOnCurrent ? (
                    <div class='alert alert-warning small' data-test='email-replace-warning'>
                      {t('unregister_mail.replace.elopage_warning', { email: email.value })}
                    </div>
                  ) : null}
                  <BInputGroup>
                    <BFormInput
                      v-model={replacement.value}
                      type='email'
                      placeholder={t('unregister_mail.replace.placeholder')}
                      data-test='email-replace-input'
                    />
                    <BButton
                      variant='outline-danger'
                      disabled={!replacement.value || replacing.value}
                      data-test='email-replace-button'
                      onClick={replaceEmail}
                    >
                      {t('unregister_mail.replace.button')}
                    </BButton>
                  </BInputGroup>
                </div>
              ) : null}
            </div>
          )}

          {/* What the support needs beside the current address: the address the GDT server is
              asked with, and a change that is under way. Shown only when it says something
              the current address does not. */}
          {status.value ? (
            <div class='mt-3 small' data-test='email-status'>
              {status.value.gdtEmail !== email.value ? (
                <div data-test='email-gdt'>
                  {t('unregister_mail.gdt_email', { email: status.value.gdtEmail })}
                </div>
              ) : null}
              {status.value.pendingEmail ? (
                <div data-test='email-pending'>
                  {t('unregister_mail.pending', {
                    email: status.value.pendingEmail,
                    date: status.value.pendingSince
                      ? d(new Date(status.value.pendingSince), 'long')
                      : '',
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    )
  },
})
