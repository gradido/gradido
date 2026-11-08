// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { BButton, BCol, BContainer, BLink, BRow, type ButtonVariant } from 'bootstrap-vue-next'
import { useForm } from 'vee-validate'
import { computed, defineComponent, ref, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { type RouteLocationRaw, RouterLink, useRoute, useRouter } from 'vue-router'
import { AuthTriads } from '@/components/Auth/AuthTriads'
import { InputEmail } from '@/components/Inputs/InputEmail'
import { InputPassword } from '@/components/Inputs/InputPassword'
import { Message } from '@/components/Message/Message'
import { useAuthLinks } from '@/composables/useAuthLinks'
import { useEntryDraft } from '@/composables/useEntryDraft'
import { useSignIn } from '@/composables/useSignIn'
import { useAppToast } from '@/composables/useToast'
import CONFIG from '@/config'
import { authenticateHumhubAutoLoginProject } from '@/graphql/mutations'
import { useWalletStore } from '@/store/useWalletStore'
import { eventMatchingEntryDraft, keptEventMatchingEntry } from '@/utils/eventMatchingLink'

export const Login = defineComponent({
  name: 'Login',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const store = useWalletStore()
    const { t } = useI18n()
    // The steps of signing in are shared with the page where a thank-you is accepted.
    const { signIn } = useSignIn()
    const entryDraft = useEntryDraft()
    const { mutate: mutateHumhubAutoLogin } = useMutation(authenticateHumhubAutoLoginProject)
    // TODO a loading overlay on the submit button (vue-loading-overlay) needs to be updated, but
    // there is some sort of an issue that breaks the app.
    const { toastError } = useAppToast()
    const { routeWithParamsAndQuery } = useAuthLinks()

    const { handleSubmit, meta } = useForm({
      initialValues: {
        email: '',
        password: '',
      },
    })

    const showPageMessage = ref(false)
    const errorSubtitle = ref('')
    const errorLinkTo = ref<RouteLocationRaw>('')

    const onSubmit = handleSubmit(async (values) => {
      try {
        await signIn({ email: values.email, password: values.password })
        // The way back is taken ONCE. The guard writes it for somebody who arrives signed out
        // (routes/guards.js), and it used to stay after it had served: only a sign-out put it
        // back. A wallet that later starts on this page with its session run out signs nobody
        // out, so the next sign-in led to that same address again -- into the conversation a
        // mail had linked to weeks before, instead of the overview (measured in the built
        // wallet, 11.10.2026). Taken here, after the sign-in has succeeded: a failed attempt
        // keeps it for the next one.
        const back = store.redirectPath
        store.setRedirectPath('/overview')
        // What an event link offered in this browser before anybody was signed in (`/project?…`,
        // routes/guards.js) is taken ONCE as well, by the sign-in that follows the link: used
        // below, or let go. Nobody was signed in when it was kept, so nothing says whose it is --
        // left in the store, it would be made for whoever signs in here next. And only if
        // it was kept within the hour (keptEventMatchingEntry).
        const offered = keptEventMatchingEntry(store.eventMatchingEntry)
        store.setEventMatchingEntry(null)
        if (store.project) {
          const result = await mutateHumhubAutoLogin({
            project: store.project,
          })
          if (!result) {
            throw new Error('authenticateHumhubAutoLogin: no answer')
          }
          window.location.href = result.data.authenticateHumhubAutoLogin
          return
        }

        if (route.params.code) {
          await router.push(routeWithParamsAndQuery('Redeem'))
          return
        }
        // The event link's entry now has a member to offer it to: on to their entries, where it is
        // made at once, or nothing happens where the member has it already (KA-014).
        //
        // ⛔ Only where no page is waiting. Of the two wishes kept for after a sign-in the
        // younger one counts: opening an event link puts the way back to the overview
        // (guards.js), so a way back that leads anywhere else was written AFTER the link -- the
        // reply button of a mail pressed since leads into its conversation, and the entry is let
        // go. A project and a redeem code went first, above, for the same reason: they have a
        // place of their own to lead to.
        //
        // The overview by its record, not by the letters of the address: `/overview/` typed with
        // a slash is the overview all the same.
        //
        // `replace`: the sign-in form is done with, and the back button should not offer it to
        // somebody who has just signed in.
        if (offered && router.resolve(back).matched.at(-1)?.path === '/overview') {
          entryDraft.put(eventMatchingEntryDraft(offered))
          await router.replace('/matching/entries')
          return
        }
        await router.push(back)
      } catch (error) {
        const { message } = error as Error
        // ⛔ These two literals are one half of a contract with the backend, and the backend
        // cannot be imported here. Both were wrong - a word order apart from what `login`
        // actually throws - so neither branch had ever fired. A member without a password saw
        // the raw English sentence in an "unknown error" toast instead of the page that tells
        // them what to do. Pinned on this side by `Login.spec.js`, on the other by
        // `UserResolver.test.ts`; move one and the pair has to move together.
        if (message.includes('The Users email is not validate yet')) {
          showPageMessage.value = true
          errorSubtitle.value = t('message.activateEmail')
          errorLinkTo.value = { name: 'ForgotPassword' }
          toastError(t('error.no-account'))
        } else if (message.includes('The User has not set a password yet')) {
          showPageMessage.value = true
          errorSubtitle.value = t('message.unsetPassword')
          // Not `ResetPassword`: that route needs an `:optin` code, and a login page has none -
          // `router.push` threw `Missing required param "optin"` straight out of the click
          // handler. The road to a password is the one the branch above already takes.
          errorLinkTo.value = { name: 'ForgotPassword' }
          toastError(t('error.no-account'))
        } else if (message.includes('No user with this credentials')) {
          toastError(t('error.no-user'))
        } else {
          toastError(t('error.unknown-error') + message)
        }
      }
    })

    const enterData = computed(() => !showPageMessage.value)

    return () => (
      <div class='login-form'>
        {enterData.value ? (
          <BContainer>
            <AuthTriads />
            <form onSubmit={withModifiers(onSubmit, ['prevent'])}>
              <BRow>
                <BCol sm='12' md='12' lg='6'>
                  <InputEmail />
                </BCol>
                <BCol sm='12' md='12' lg='6'>
                  <InputPassword />
                </BCol>
              </BRow>
              <BRow>
                <BCol class='d-flex justify-content-end mb-4 mb-lg-0'>
                  <RouterLink to={{ name: 'ForgotPassword' }} data-test='forgot-password-link'>
                    {t('settings.password.forgot_pwd')}
                  </RouterLink>
                </BCol>
              </BRow>
              <BRow>
                <BCol class='col-lg-6 col-12'>
                  <BButton
                    type='submit'
                    class='w-100 fs-7'
                    // `gradido` and `gradido-disable` are the wallet's own variants
                    // (gradido-template.scss)
                    variant={(meta.value.valid ? 'gradido' : 'gradido-disable') as ButtonVariant}
                    // no prop of BButton: it lands on the element as the empty attribute it was
                    {...({ block: '' } as object)}
                    disabled={!meta.value.valid}
                  >
                    {t('login')}
                  </BButton>
                </BCol>
              </BRow>
              <BRow>
                <BCol class='mt-3'>
                  {t('missingGradidoAccount', { communityName: CONFIG.COMMUNITY_NAME })}
                </BCol>
              </BRow>
              <BRow>
                <BCol class='mt-1 auth-navbar'>
                  <BLink to={routeWithParamsAndQuery('Register')}>{t('signup')}</BLink>
                </BCol>
              </BRow>
            </form>
          </BContainer>
        ) : (
          <BContainer>
            <Message
              headline={t('message.errorTitle')}
              subtitle={errorSubtitle.value}
              buttonText={t('settings.password.reset')}
              linkTo={errorLinkTo.value}
            />
          </BContainer>
        )}
      </div>
    )
  },
})
