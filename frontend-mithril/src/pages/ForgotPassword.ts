// AI-GENERATED — not an architecture reference
import m from 'mithril'
import * as v from 'valibot'
import { emailField } from '@/components/form/emailField'
import { Form } from '@/components/form/Form'
import { BusyButton } from '@/components/ui/BusyButton'
import { Message } from '@/components/ui/Message'
import { toastError } from '@/components/ui/Toasts'
import { forgotPasswordSchema } from '@/data/Account.schema'
import { emailFieldSchema } from '@/data/Form.schema'
import { forgotPassword } from '@/graphql/account'
import { request } from '@/graphql/client'
import { t } from '@/i18n'

/**
 * Asks for the mail with the link to a new password. Also where a link that ran out leads
 * (`/forgot-password/<where from>`), and says so then.
 */
export class ForgotPassword implements m.ClassComponent {
  #sent?: boolean

  view() {
    if (this.#sent !== undefined) {
      return m(
        '.forgot-password',
        m(
          '.container',
          m(Message, {
            headline: this.#sent ? t('message.title') : t('message.errorTitle'),
            subtitle: this.#sent ? t('message.email') : t('error.email-already-sent'),
            'data-test': this.#sent ? 'forgot-password-success' : 'forgot-password-error',
            buttonText: t('login'),
            linkTo: '/login',
          }),
        ),
      )
    }
    // built anew with every draw: the sentences name the field in the language shown
    const schema = v.object({ email: emailFieldSchema(t('form.email')) })
    return m(
      '.forgot-password',
      m(
        '.container',
        m('.pb-3', t('site.forgotPassword.heading')),
        m(
          '.pb-4',
          { 'data-test': 'forgot-password-subtitle' },
          m.route.param('comingFrom')
            ? t('settings.password.resend_subtitle')
            : t('settings.password.subtitle'),
        ),
        m(
          Form<typeof schema>,
          {
            role: 'form',
            schema,
            onsubmit: async ({ email }) => {
              const answer = await request(forgotPassword, { email }, forgotPasswordSchema)
              if (answer.success) {
                this.#sent = true
              } else if (/email already sent/i.test(answer.error.message)) {
                // the mail of a few minutes ago is still the one to use
                this.#sent = false
                toastError(t('error.email-already-sent'))
              } else {
                // the form stays: it can be sent again
                toastError(`${t('error.unknown-error')} ${answer.error.message}`)
              }
            },
            submitBusyButton: m(
              BusyButton,
              { class: 'btn-gradido' },
              t('settings.password.send_now'),
            ),
          },
          m('.mb-4', emailField(schema.entries.email)),
        ),
      ),
    )
  }
}
