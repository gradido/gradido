// AI-GENERATED — not an architecture reference
import { useLazyQuery, useMutation } from '@vue/apollo-composable'
import { BButton, BCol, BForm, BRow, type ButtonVariant } from 'bootstrap-vue-next'
import { useForm } from 'vee-validate'
import { computed, defineComponent, ref, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { type RouteLocationRaw, useRoute, useRouter } from 'vue-router'
import { InputPasswordConfirmation } from '@/components/Inputs/InputPasswordConfirmation'
import { Message } from '@/components/Message/Message'
import { useAuthLinks } from '@/composables/useAuthLinks'
import { useAppToast } from '@/composables/useToast'
import { setPassword } from '@/graphql/mutations'
import { queryOptIn } from '@/graphql/queries'
import classes from './ResetPassword.module.css'

interface DisplaySetup {
  title: string
  text: string
  button: string
  linkTo: RouteLocationRaw
}

export const ResetPassword = defineComponent({
  name: 'ResetPassword',
  emits: ['set-mobile-start'],
  setup(_props, { emit }) {
    const { routeWithParamsAndQuery } = useAuthLinks()

    // `routeWithParamsAndQuery` on purpose, never a plain `{ name: 'Login' }`: after a registration
    // over a transaction or contribution link the confirmation mail points at
    // `/checkEmail/:optin/:code?`, and that `code` IS the redeem code. It has to travel on to
    // `/login/:code?`, because the login page redeems it right after signing in. The collision
    // PR #3798 repaired has nothing to do with this page. Pinned by `ResetPassword.spec.js`.
    // A link of another community names its community in the mail's address as well
    // (`/checkEmail/:optin/:code?/:codeCommunityUuid?`); from here on it travels as the query the
    // redeem page reads.
    const { codeCommunityUuid } = useRoute().params
    const linkTo: RouteLocationRaw = routeWithParamsAndQuery(
      'Login',
      codeCommunityUuid ? { query: { codeCommunityUuid } } : {},
    )

    const textFields: Record<'reset' | 'checkEmail', DisplaySetup> = {
      reset: {
        title: 'settings.password.change-password',
        text: 'settings.password.reset-password.text',
        button: 'settings.password.change-password',
        linkTo,
      },
      checkEmail: {
        title: 'settings.password.set',
        text: 'settings.password.set-password.text',
        button: 'settings.password.set',
        linkTo,
      },
    }

    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()

    const form = ref({
      password: '',
      passwordRepeat: '',
    })

    const displaySetup = ref<Partial<DisplaySetup>>({})
    const showPageMessage = ref(false)
    const messageHeadline = ref<string | null>(null)
    const messageSubtitle = ref<string | null>(null)
    const messageButtonText = ref<string | null>(null)
    const messageButtonLinkTo = ref<RouteLocationRaw | null>(null)

    const enterData = computed(() => !showPageMessage.value)

    const { mutate: setPasswordMutation } = useMutation(setPassword)
    const { load: queryOptInQuery } = useLazyQuery(queryOptIn)

    const { toastError } = useAppToast()

    const { meta: formMeta, values: formValues, setFieldValue } = useForm()

    const onSubmit = async () => {
      try {
        await setPasswordMutation({
          code: route.params.optin,
          password: formValues.newPassword,
        })

        setFieldValue('newPassword', '')
        setFieldValue('newPasswordRepeat', '')

        showPageMessage.value = true
        messageHeadline.value = t('message.title')
        messageSubtitle.value = route.path.includes('checkEmail')
          ? t('message.checkEmail')
          : t('message.reset')
        messageButtonText.value = t('login')
        messageButtonLinkTo.value = linkTo
      } catch (error) {
        const errorMessage = (error as Error).message.match(
          /email was sent more than ([0-9]+ hours)?( and )?([0-9]+ minutes)? ago/,
        )
          ? (error as Error).message
          : (error as Error).message

        showPageMessage.value = true
        messageHeadline.value = t('message.errorTitle')
        messageSubtitle.value = errorMessage
        messageButtonText.value = t('settings.password.reset')
        // `ForgotPassword` has no parameters at all - vue-router discarded `comingFrom` here
        // and the page never learned why somebody had landed on it. The route that carries the
        // reason is a different one, and until now nothing pointed at it.
        messageButtonLinkTo.value = {
          name: 'ForgotPasswordComingFrom',
          params: { comingFrom: 'reset-password' },
        }
        toastError(errorMessage)
      }
    }

    const checkOptInCode = async () => {
      try {
        await queryOptInQuery(queryOptIn, {
          optIn: route.params.optin,
        })
      } catch (error) {
        toastError((error as Error).message)
        await router.push({
          name: 'ForgotPasswordComingFrom',
          params: { comingFrom: 'reset-password' },
        })
      }
    }

    const setDisplaySetup = () => {
      checkOptInCode()
      if (route.path.includes('checkEmail')) {
        displaySetup.value = textFields.checkEmail
      }
      if (route.path.includes('reset-password')) {
        displaySetup.value = textFields.reset
      }
    }

    emit('set-mobile-start', false)
    setDisplaySetup()

    // `block` is no prop of BButton: it lands on the button as the empty attribute it was.
    const block = { block: '' } as object

    return () =>
      enterData.value ? (
        <div class={['resetpwd-form', classes['resetpwd-form']]}>
          <div class='pb-5'>{t('site.resetPassword.heading')}</div>
          <BForm role='form' onSubmit={withModifiers(onSubmit, ['prevent'])}>
            {/* The template also wrote `@update:modelValue="form"`: the object itself where a
                handler belongs, on a component that emits nothing. It never did anything and is
                not carried over. */}
            <InputPasswordConfirmation modelValue={form.value} register />
            <BRow>
              <BCol cols='12' lg='6'>
                <BButton
                  {...block}
                  type='submit'
                  variant={(formMeta.value.valid ? 'gradido' : 'gradido-disable') as ButtonVariant}
                  class='mt-4'
                  data-test='submit-new-password-btn'
                  disabled={!formMeta.value.valid}
                >
                  {/* eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys */}
                  {t(displaySetup.value.button as string)}
                </BButton>
              </BCol>
            </BRow>
          </BForm>
        </div>
      ) : (
        <div>
          {/* All four are set before the message is shown. */}
          <Message
            headline={messageHeadline.value as string}
            subtitle={messageSubtitle.value as string}
            buttonText={messageButtonText.value as string}
            linkTo={messageButtonLinkTo.value as RouteLocationRaw}
          />
        </div>
      )
  },
})
