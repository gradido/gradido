// AI-GENERATED — not an architecture reference

import m from 'mithril'
import * as v from 'valibot'
import { Form } from '@/components/form/Form'
import { NewPasswordFields } from '@/components/form/NewPasswordFields'
import { authLink } from '@/components/layout/auth/authLink'
import { BusyButton } from '@/components/ui/BusyButton'
import { Message } from '@/components/ui/Message'
import { toastError } from '@/components/ui/Toasts'
import { queryOptInSchema, setPasswordSchema } from '@/data/Account.schema'
import { newPasswordSchema } from '@/data/Form.schema'
import { queryOptIn, setPassword } from '@/graphql/account'
import { request } from '@/graphql/client'
import { t } from '@/i18n'
import classes from './ResetPassword.module.css'

const schema = v.object({ newPassword: newPasswordSchema })
// where a link that is of no use any more leads: to a new mail, which says why
const NEW_MAIL = '/forgot-password/reset-password'

/**
 * The page the link of a mail opens to set a password: a new one (`/reset-password/<code>`),
 * or the first of a new account (`/checkEmail/<code>`, which may carry the code of a link to
 * redeem and its community on to the sign-in).
 */
export class ResetPassword implements m.ClassComponent {
  // what is said in the form's place once the password was sent
  #message?: m.Children
  // left before the server answered: what it says of the link is no longer this page's
  #left = false

  onremove() {
    this.#left = true
  }

  async oninit() {
    // a link the server does not know any more is told so before a password is typed
    const known = await request(queryOptIn, { optIn: m.route.param('optin') }, queryOptInSchema)
    if (!known.success && !this.#left) {
      toastError(known.error.message)
      m.route.set(NEW_MAIL)
    }
  }

  view() {
    if (this.#message) {
      return m('div', this.#message)
    }
    const { optin, codeCommunityUuid } = m.route.param()
    const first = m.route.get().startsWith('/checkEmail/')
    return m(
      '.resetpwd-form',
      { class: classes['resetpwd-form'] },
      m('.pb-5', t('site.resetPassword.heading')),
      m(
        Form<typeof schema>,
        {
          role: 'form',
          schema,
          onsubmit: async ({ newPassword }) => {
            const answer = await request(
              setPassword,
              { code: optin, password: newPassword },
              setPasswordSchema,
            )
            if (answer.success) {
              this.#message = m(Message, {
                headline: t('message.title'),
                subtitle: first ? t('message.checkEmail') : t('message.reset'),
                buttonText: t('login'),
                // the community of a link's code goes on as the sign-in reads it: in the query
                linkTo: authLink(
                  '/login',
                  typeof codeCommunityUuid === 'string' ? { codeCommunityUuid } : {},
                ),
              })
            } else {
              toastError(answer.error.message)
              this.#message = m(Message, {
                headline: t('message.errorTitle'),
                subtitle: answer.error.message,
                buttonText: t('settings.password.reset'),
                linkTo: NEW_MAIL,
              })
            }
          },
          submitBusyButton: m(
            BusyButton,
            { class: 'btn-gradido mt-4', 'data-test': 'submit-new-password-btn' },
            first ? t('settings.password.set') : t('settings.password.change-password'),
          ),
        },
        m(NewPasswordFields),
      ),
    )
  }
}
