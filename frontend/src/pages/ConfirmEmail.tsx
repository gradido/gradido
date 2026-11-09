// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { BButton, type ButtonVariant } from 'bootstrap-vue-next'
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { Message } from '@/components/Message/Message'
import { confirmEmailMutation } from '@/graphql/mutations'

// The two ways the backend refuses a link that does not confirm (confirmEmail in the
// AssistedRegistrationResolver): an unknown code, and a code past its validity. Both come
// as English log text, and both mean what the prepared sentence says: invalid or expired,
// sign in and have a new mail sent. Anything else keeps its own words.
const LINK_REFUSALS = ['Could not confirm with this code', 'Email was sent more than']

export const ConfirmEmail = defineComponent({
  name: 'ConfirmEmail',
  emits: ['set-mobile-start'],
  setup(_props, { emit }) {
    const route = useRoute()
    const { t } = useI18n()

    const { mutate: confirm } = useMutation(confirmEmailMutation)

    const busy = ref(false)
    const finished = ref(false)
    const headline = ref('')
    const subtitle = ref('')

    const act = async () => {
      busy.value = true
      try {
        await confirm({ code: route.params.confirmationCode })
        headline.value = t('message.title')
        subtitle.value = t('assistedRegistration.confirm.done')
      } catch (error) {
        const { message } = error as Error
        headline.value = t('message.errorTitle')
        subtitle.value = LINK_REFUSALS.some((refusal) => message.includes(refusal))
          ? t('assistedRegistration.confirm.invalid')
          : message
      } finally {
        busy.value = false
        finished.value = true
      }
    }

    emit('set-mobile-start', false)

    // Nothing happens on opening the page. A link that acts when it is merely opened is
    // "clicked" by every mail scanner that prefetches links — hence the button. Same
    // pattern as the e-mail change page.
    return () =>
      !finished.value ? (
        <div class='confirm-email'>
          <div class='h3 pb-3'>{t('assistedRegistration.confirm.title')}</div>
          <p class='pb-4'>{t('assistedRegistration.confirm.text')}</p>
          <BButton
            // no prop of BButton: it lands on the element as the empty attribute it was
            {...({ block: '' } as object)}
            variant={'gradido' as ButtonVariant}
            disabled={busy.value}
            data-test='confirm-email-action'
            onClick={act}
          >
            {t('assistedRegistration.confirm.button')}
          </BButton>
        </div>
      ) : (
        <Message
          headline={headline.value}
          subtitle={subtitle.value}
          buttonText={t('login')}
          linkTo={{ name: 'Login' }}
        />
      )
  },
})
