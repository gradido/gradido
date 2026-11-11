// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { BButton, BCol, BContainer, BForm, BRow, type ButtonVariant } from 'bootstrap-vue-next'
import { useForm } from 'vee-validate'
import { computed, defineComponent, ref, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { InputEmail } from '@/components/Inputs/InputEmail'
import { Message } from '@/components/Message/Message'
import { useAppToast } from '@/composables/useToast'
import { forgotPassword } from '@/graphql/mutations'

/** The page that mails a link for a new password to the address typed in. */
export const ForgotPassword = defineComponent({
  name: 'ForgotPassword',
  setup(_props, { expose }) {
    const { toastError } = useAppToast()

    const showPageMessage = ref(false)
    const success = ref<boolean | null>(null)

    // ⚠️ The route object, not its parts. Both `/forgot-password` and
    // `/forgot-password/:comingFrom` render THIS component, so vue-router reuses the mounted
    // instance when one leads to the other - and a destructured `params` keeps pointing at the
    // object from the first navigation. Nothing takes that path today; the trap is left shut
    // rather than left standing. (coderabbit on #3816.)
    const route = useRoute()

    const { t } = useI18n()

    /**
     * Why the member is on this page. Whoever arrived from an expired reset link is told so,
     * everybody else gets the plain invitation.
     *
     * ⚠️ Resolved to TEXT here, not handed to `t` as a variable in the markup: the i18n lint
     * only counts keys it can read literally, and a `t(subtitle)` would report both of these as
     * unused. This also replaces a `subtitle` ref that no template ever rendered - the reason
     * was computed and thrown away, which is why pointing a link at `:comingFrom` looked like it
     * would fix nothing.
     */
    const subtitleText = computed(() =>
      route.params.comingFrom
        ? t('settings.password.resend_subtitle')
        : t('settings.password.subtitle'),
    )

    const { mutate } = useMutation(forgotPassword)

    const { meta: formMeta, values: formValues } = useForm()

    const enterData = computed(() => !showPageMessage.value)

    const onSubmit = async () => {
      try {
        await mutate({
          email: formValues.email,
        })
        showPageMessage.value = true
        success.value = true
      } catch {
        showPageMessage.value = true
        success.value = false
        toastError(t('error.email-already-sent'))
      }
    }

    expose({ success, showPageMessage })

    return () => (
      <div class='forgot-password'>
        {enterData.value ? (
          <BContainer>
            <div class='pb-3'>{t('site.forgotPassword.heading')}</div>
            <div class='pb-4' data-test='forgot-password-subtitle'>
              {subtitleText.value}
            </div>
            <BRow class='justify-content-center'>
              <BCol>
                <BForm role='form' onSubmit={withModifiers(onSubmit, ['prevent'])}>
                  <InputEmail name='email' class='mb-4' />
                  <BRow>
                    <BCol cols='12' lg='6'>
                      <BButton
                        type='submit'
                        variant={
                          (formMeta.value.valid ? 'gradido' : 'gradido-disable') as ButtonVariant
                        }
                        disabled={!formMeta.value.valid}
                      >
                        {t('settings.password.send_now')}
                      </BButton>
                    </BCol>
                  </BRow>
                </BForm>
              </BCol>
            </BRow>
          </BContainer>
        ) : (
          <BContainer>
            <Message
              headline={success.value ? t('message.title') : t('message.errorTitle')}
              subtitle={success.value ? t('message.email') : t('error.email-already-sent')}
              data-test={success.value ? 'forgot-password-success' : 'forgot-password-error'}
              buttonText={t('login')}
              linkTo='/login'
            />
          </BContainer>
        )}
      </div>
    )
  },
})
