// AI-GENERATED — not an architecture reference
import CONFIG from '@frontend/config'
import m from 'mithril'
import * as v from 'valibot'
import { emailField } from '@/components/form/emailField'
import { Form } from '@/components/form/Form'
import { PasswordField } from '@/components/form/PasswordField'
import { AuthTriads } from '@/components/layout/auth/AuthTriads'
import { authLink } from '@/components/layout/auth/authLink'
import { BusyButton } from '@/components/ui/BusyButton'
import { Message } from '@/components/ui/Message'
import { toastError } from '@/components/ui/Toasts'
import { emailFieldSchema, requiredFieldSchema } from '@/data/Form.schema'
import { memberSchema } from '@/data/Member.schema'
import { authenticateHumhubAutoLogin } from '@/graphql/account'
import { request } from '@/graphql/client'
import { login as loginDocument } from '@/graphql/member'
import { t } from '@/i18n'
import { knownProject } from '@/store/projectBranding'
import { session } from '@/store/Session'
import { signInAs } from '@/store/signIn'

// ⛔ One half of a contract with the backend, which cannot be imported here: what `login`
// (UserResolver) throws for an account that cannot sign in yet. Held on this side by
// tests/login.spec.ts, on the other by UserResolver.test.ts; the pair moves together.
const NO_PASSWORD_YET = {
  'The Users email is not validate yet': () => t('message.activateEmail'),
  'The User has not set a password yet': () => t('message.unsetPassword'),
}

/** The sign-in: address and password, and on to the page that was asked for. */
export class Login implements m.ClassComponent {
  // why this account cannot sign in yet: said in the form's place, with the way to a password,
  // in the language shown
  #noPasswordYet?: () => string

  async #signIn(email: string, password: string) {
    // the project of the address goes along once the server said it knows it
    const project = await knownProject()
    const answer = await request(
      loginDocument,
      { email, password, project },
      v.object({ login: memberSchema }),
    )
    if (!answer.success) {
      const { message } = answer.error
      const noPasswordYet = Object.entries(NO_PASSWORD_YET).find(([said]) => message.includes(said))
      if (noPasswordYet) {
        this.#noPasswordYet = noPasswordYet[1]
        toastError(t('error.no-account'))
      } else if (message.includes('No user with this credentials')) {
        toastError(t('error.no-user'))
      } else {
        toastError(`${t('error.unknown-error')} ${message}`)
      }
      return
    }
    await signInAs(answer.value.login)
    // Released before the page changes under it: the home-screen app of an iPhone kept
    // offering the saved password after every later tap.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    // The way back is taken once: left in place, the next sign-in on this device would lead
    // to the same address again.
    const back = session.state.redirectPath
    session.set({ ...session.state, redirectPath: '/overview' })
    if (project) {
      const handOver = await request(
        authenticateHumhubAutoLogin,
        { project },
        v.object({ authenticateHumhubAutoLogin: v.string() }),
      )
      if (handOver.success) {
        location.href = handOver.value.authenticateHumhubAutoLogin
      } else {
        toastError(`${t('error.unknown-error')} ${handOver.error.message}`)
      }
      return
    }
    const { code } = m.route.param()
    m.route.set(typeof code === 'string' ? `/redeem/${code}${location.search}` : back)
  }

  view() {
    if (this.#noPasswordYet) {
      return m(
        '.login-form',
        m(
          '.container',
          m(Message, {
            headline: t('message.errorTitle'),
            subtitle: this.#noPasswordYet(),
            buttonText: t('settings.password.reset'),
            linkTo: '/forgot-password',
          }),
        ),
      )
    }
    // built anew with every draw: the sentences name the field in the language shown
    const schema = v.object({
      email: emailFieldSchema(t('form.email')),
      password: requiredFieldSchema(t('form.password')),
    })
    return m(
      '.login-form',
      m(
        '.container',
        m(AuthTriads),
        m(
          Form<typeof schema>,
          {
            // a row, for the button: half the form wide on the desk
            class: 'row',
            schema,
            onsubmit: ({ email, password }) => this.#signIn(email, password),
            submitBusyButton: m(BusyButton, { class: 'btn-gradido w-100 fs-7' }, t('login')),
            submitPlaceClass: 'col-12 col-lg-6',
          },
          m(
            '.col-12',
            m(
              '.row',
              m('.col-sm-12.col-md-12.col-lg-6', emailField(schema.entries.email)),
              m(
                '.col-sm-12.col-md-12.col-lg-6',
                m(PasswordField<typeof schema.entries.password>, {
                  label: t('form.password'),
                  name: 'password',
                  schema: schema.entries.password,
                }),
              ),
            ),
            m(
              '.row',
              m(
                '.col.d-flex.justify-content-end.mb-4.mb-lg-0',
                m(
                  m.route.Link,
                  { href: '/forgot-password', 'data-test': 'forgot-password-link' },
                  t('settings.password.forgot_pwd'),
                ),
              ),
            ),
          ),
        ),
        m(
          '.row',
          m('.col.mt-3', t('missingGradidoAccount', { communityName: CONFIG.COMMUNITY_NAME })),
        ),
        m(
          '.row',
          m('.col.mt-1.auth-navbar', m(m.route.Link, { href: authLink('/register') }, t('signup'))),
        ),
      ),
    )
  }
}
