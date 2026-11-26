// AI-GENERATED — not an architecture reference
import CONFIG from '@frontend/config'
import m from 'mithril'
import { aliasSchema } from 'shared/browser'
import * as v from 'valibot'
import { emailField } from '@/components/form/emailField'
import { Field } from '@/components/form/Field'
import { Form } from '@/components/form/Form'
import { NewPasswordFields } from '@/components/form/NewPasswordFields'
import { RequiredCheckbox } from '@/components/form/RequiredCheckbox'
import { AuthTriads } from '@/components/layout/auth/AuthTriads'
import { authLink } from '@/components/layout/auth/authLink'
import { BusyButton } from '@/components/ui/BusyButton'
import { Message } from '@/components/ui/Message'
import { toastError } from '@/components/ui/Toasts'
import { emailFieldSchema, nameFieldSchema, newPasswordSchema } from '@/data/Form.schema'
import { guarantorCodeState } from '@/data/Guarantor.logic'
import { createUser } from '@/graphql/account'
import { request } from '@/graphql/client'
import { locale, t } from '@/i18n'
import { projectBranding } from '@/store/projectBranding'
import classes from './Register.module.css'

/**
 * The registration: name, address and consent. Where a member vouches for the account (a
 * guarantor code in the address, while it runs) the guest chooses the password right here,
 * and the account can be used at once.
 */
export class Register implements m.ClassComponent {
  #done = false
  // what the server said to the guarantor code: said beside the button, not in a toast
  #guarantorRefusal?: 'failed' | 'limit'

  view() {
    const { code, codeCommunityUuid, referrer, guarantor } = m.route.param()
    // Who showed Gradido (`/u/<name>`, "create account"): shown and sent only where it is
    // written as a user name -- it is somebody's own input, read back.
    const referrerAlias = v.is(aliasSchema, referrer) ? referrer : undefined
    const guarantorState = guarantorCodeState(guarantor, Date.now())
    const vouched = guarantorState === 'active'
    if (this.#done) {
      return m(
        '#registerform',
        { class: classes.registerForm },
        m(
          '.container',
          vouched
            ? m(Message, {
                headline: t('message.title'),
                subtitle: t('message.registerGuarantor'),
                buttonText: t('login'),
                linkTo: '/login',
              })
            : m(Message, { headline: t('message.title'), subtitle: t('message.register') }),
        ),
      )
    }
    const notice = (text: string, test: string, role?: string) =>
      m('p.alert.gradido-border-radius', { role, 'data-test': test }, text)
    // built anew with every draw: the sentences name the field in the language shown
    const schema = v.object({
      firstname: nameFieldSchema(t('form.firstname'), 3),
      lastname: nameFieldSchema(t('form.lastname'), 2),
      email: emailFieldSchema(t('form.email')),
      // asked for only where a member vouches
      newPassword: v.optional(newPasswordSchema),
    })
    return m(
      '#registerform',
      { class: classes.registerForm },
      m(
        '.container',
        m(AuthTriads),
        referrerAlias
          ? notice(t('site.signup.shownBy', { name: referrerAlias }), 'register-shown-by')
          : undefined,
        guarantorState === 'expired'
          ? notice(t('site.signup.guarantorExpired'), 'register-guarantor-expired')
          : undefined,
        m(
          Form<typeof schema>,
          {
            role: 'form',
            schema,
            onsubmit: async ({ firstname, lastname, email, newPassword }) => {
              this.#guarantorRefusal = undefined
              const answer = await request(
                createUser,
                {
                  firstName: firstname,
                  lastName: lastname,
                  email,
                  language: locale,
                  redeemCode: typeof code === 'string' ? code : null,
                  redeemCodeCommunityUuid:
                    typeof codeCommunityUuid === 'string' ? codeCommunityUuid : null,
                  project: projectBranding.project ?? null,
                  referrerAlias: referrerAlias ?? null,
                  guarantorCode: vouched ? guarantor : null,
                  password: newPassword ?? null,
                },
                v.unknown(),
              )
              if (answer.success) {
                this.#done = true
              } else if (
                vouched &&
                answer.error.message.includes('Guarantor code invalid or expired')
              ) {
                this.#guarantorRefusal = 'failed'
              } else if (vouched && answer.error.message.includes('Vouching limit reached')) {
                this.#guarantorRefusal = 'limit'
              } else {
                toastError(`${t('error.unknown-error')} ${answer.error.message}`)
              }
            },
            submitBusyButton: m(BusyButton, { class: 'btn-gradido' }, t('signup')),
          },
          m(
            '.row',
            m(
              '.col-sm-12.col-md-6.mb-3',
              m(Field<typeof schema.entries.firstname>, {
                label: t('form.firstname'),
                name: 'firstname',
                id: 'registerFirstname',
                schema: schema.entries.firstname,
                placeholder: t('form.firstname'),
              }),
            ),
            m(
              '.col-sm-12.col-md-6.mb-3',
              m(Field<typeof schema.entries.lastname>, {
                label: t('form.lastname'),
                name: 'lastname',
                id: 'registerLastname',
                schema: schema.entries.lastname,
                placeholder: t('form.lastname'),
              }),
            ),
          ),
          m('.row', m('.col', emailField(schema.entries.email))),
          vouched
            ? [
                m(NewPasswordFields),
                m(
                  'p.text-muted.account-fields-hint',
                  { 'data-test': 'register-guarantor-hint' },
                  referrerAlias
                    ? t('site.signup.guarantorHint', { name: referrerAlias })
                    : t('site.signup.guarantorHintAnonymous'),
                ),
              ]
            : undefined,
          m(
            '.row',
            m(
              '.col-12.my-4',
              m(
                RequiredCheckbox,
                { id: 'registerCheckbox', name: 'agree', class: classes.agree },
                // a text of the wallet's own, with the link to the privacy policy in it
                m('span.text-muted', m.trust(t('site.signup.agree'))),
              ),
            ),
          ),
          this.#guarantorRefusal === 'failed'
            ? notice(t('site.signup.guarantorFailed'), 'register-guarantor-failed', 'alert')
            : undefined,
          this.#guarantorRefusal === 'limit'
            ? notice(
                referrerAlias
                  ? t('site.signup.guarantorLimit', { name: referrerAlias })
                  : t('site.signup.guarantorLimitAnonymous'),
                'register-guarantor-limit',
                'alert',
              )
            : undefined,
        ),
        m(
          '.row',
          m('.col.mt-3', t('existingGradidoAccount', { communityName: CONFIG.COMMUNITY_NAME })),
        ),
        m(
          '.row',
          m('.col.mt-1.auth-navbar', m(m.route.Link, { href: authLink('/login') }, t('signin'))),
        ),
      ),
    )
  }
}
