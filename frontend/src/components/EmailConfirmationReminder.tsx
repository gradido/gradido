// AI-GENERATED — not an architecture reference
import { BButton, BModal, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useEmailConfirmation } from '@/composables/useEmailConfirmation'
import {
  firstLoginWindowOnScreen,
  setFirstLoginWindowWanted,
} from '@/composables/useFirstLoginWindow'
import { useWalletStore } from '@/store/useWalletStore'

export const EmailConfirmationReminder = defineComponent({
  name: 'EmailConfirmationReminder',
  setup() {
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const store = useWalletStore()
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
      set: () => {
        // Nothing to record: the member has no way to close this window (no header, neither the
        // backdrop nor Esc), and what BModal writes back when the getter goes false on its own --
        // while the conversation an address opened has the screen (`/contacts?with=…`,
        // useFirstLoginWindow) -- is not an answer. The setter is only there because `v-model`
        // writes back.
      },
    })

    const goToSettings = () => {
      router.push('/settings/account')
    }

    return () => (
      // The visible half of the EM-013 blockade, past the deadline: the modal has no way to
      // close and the server has already narrowed the account down (see the backend's
      // RESTRICTED_WHILE_UNCONFIRMED) — the modal is the explanation, not the enforcement.
      // The 24 hours before belong to the strip on the page (EmailConfirmationStrip, EM-014).
      // Two ways out stay open on purpose: resending the mail, and correcting the address
      // in the settings — which is why this modal never shows on /settings routes.
      <BModal
        id='modal-email-confirmation-reminder'
        modelValue={visible.value}
        onUpdate:modelValue={(value: boolean) => {
          visible.value = value
        }}
        centered
        noHeader
        noCloseOnBackdrop
        noCloseOnEsc
        data-test='email-confirmation-reminder'
        v-slots={{
          default: () => (
            <div class='text-center px-2 pt-3'>
              <p class='h5 mb-3'>{t('emailConfirmation.title')}</p>
              <p class='mb-2'>{t('emailConfirmation.mailSent')}</p>
              <p class='mb-0' data-test='email-confirmation-overdue'>
                {t('emailConfirmation.overdue')}
              </p>
              {resent.value ? (
                <p class='small text-success mt-3 mb-0' data-test='email-confirmation-resent'>
                  {t('emailConfirmation.resent')}
                </p>
              ) : null}
              {/* A third way, while the support is on (K5, SUA-016): an account whose address did
                  not arrive may ask. The page "Support" holds this window back while it stands
                  (useFirstLoginWindow) -- without this line it is out of reach at the desk, where
                  the window lies over every menu. */}
              {store.supportTicketsActive !== false ? (
                <p class='mt-3 mb-0'>
                  <RouterLink to='/support/write' data-test='email-confirmation-support'>
                    {t('emailConfirmation.writeSupport')}
                  </RouterLink>
                </p>
              ) : null}
            </div>
          ),
          footer: () => (
            <>
              <BButton
                variant='secondary'
                data-test='email-confirmation-change-address'
                onClick={goToSettings}
              >
                {t('emailConfirmation.changeAddress')}
              </BButton>
              <BButton
                variant={'gradido' as ButtonVariant}
                disabled={resending.value}
                data-test='email-confirmation-resend'
                onClick={resend}
              >
                {t('emailConfirmation.resend')}
              </BButton>
            </>
          ),
        }}
      />
    )
  },
})
