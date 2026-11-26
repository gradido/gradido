// AI-GENERATED — not an architecture reference
import m from 'mithril'
import * as v from 'valibot'
import { MailLinkAction } from '@/components/layout/auth/MailLinkAction'
import { confirmEmail } from '@/graphql/account'
import { request } from '@/graphql/client'
import { t } from '@/i18n'

// what `confirmEmail` (UserResolver) says of a link that is of no use any more
const LINK_REFUSALS = ['Could not confirm with this code', 'Email was sent more than']

/** Confirms the address of an account a member vouched for, by the link of its mail. */
export class ConfirmEmail implements m.ClassComponent {
  view() {
    return m(MailLinkAction, {
      name: 'confirm-email',
      title: t('assistedRegistration.confirm.title'),
      text: t('assistedRegistration.confirm.text'),
      button: t('assistedRegistration.confirm.button'),
      act: () => request(confirmEmail, { code: m.route.param('confirmationCode') }, v.unknown()),
      done: t('assistedRegistration.confirm.done'),
      refused: (message) =>
        LINK_REFUSALS.some((refusal) => message.includes(refusal))
          ? t('assistedRegistration.confirm.invalid')
          : message,
    })
  }
}
