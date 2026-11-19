// AI-GENERATED — not an architecture reference
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useEmailConfirmation } from '@/composables/useEmailConfirmation'
import classes from './EmailConfirmationStrip.module.scss'

export const EmailConfirmationStrip = defineComponent({
  name: 'EmailConfirmationStrip',
  setup() {
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const { unconfirmed, overdue, deadlineText, resend, resending, resent } = useEmailConfirmation()

    // Never in the settings: correcting the address lives there, as for the window.
    const shown = computed(
      () => unconfirmed.value && !overdue.value && !route.path.startsWith('/settings'),
    )

    const goToSettings = () => {
      router.push('/settings/account')
    }

    return () =>
      // EM-014: inside the 24 hours of EM-013 the address reminder is this strip at the top of
      // every page of the wallet but the settings, and not a window. It says what there is to do
      // and takes nothing away. No "Später" and no cross: the clock runs, and the strip stays until
      // the address is confirmed. Past the deadline the window that cannot be closed takes over
      // (EmailConfirmationReminder) -- both read the same clock (useEmailConfirmation), so in the
      // minute this goes, the window comes.
      //
      // Not one of the first-login windows (useFirstLoginWindow): it covers nothing, so it waits
      // for nothing and holds nothing back.
      //
      // ⚠️ A named region, and the live part is only the line that comes after a press. A status
      // role on the whole strip would read all of it again, button labels included, for that one
      // line: `status` is atomic.
      shown.value ? (
        <section
          class={['email-confirmation-strip', classes['email-confirmation-strip']]}
          aria-labelledby='email-confirmation-strip-title'
          data-test='email-confirmation-strip'
        >
          <div class='email-confirmation-strip-text'>
            <p id='email-confirmation-strip-title' class='email-confirmation-strip-title'>
              {t('emailConfirmation.title')}
            </p>
            <p
              class='email-confirmation-strip-sentence'
              data-test='email-confirmation-strip-sentence'
            >
              {t('emailConfirmation.strip', { deadline: deadlineText.value })}
            </p>
            {/* In the DOM before there is anything to say, or a screen reader may miss what is
                put into it. Empty, it takes no room. */}
            <p role='status' class='email-confirmation-strip-status'>
              {resent.value ? (
                <span data-test='email-confirmation-strip-resent'>
                  {t('emailConfirmation.resent')}
                </span>
              ) : null}
            </p>
          </div>
          <div class='email-confirmation-strip-actions'>
            <button
              type='button'
              class='email-confirmation-strip-action'
              disabled={resending.value}
              data-test='email-confirmation-strip-resend'
              onClick={resend}
            >
              {t('emailConfirmation.resend')}
            </button>
            <button
              type='button'
              class='email-confirmation-strip-action'
              data-test='email-confirmation-strip-change-address'
              onClick={goToSettings}
            >
              {t('emailConfirmation.changeAddress')}
            </button>
          </div>
        </section>
      ) : null
  },
})
