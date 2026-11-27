// AI-GENERATED — not an architecture reference
import m from 'mithril'
import { MailLinkAction } from '@/components/layout/auth/MailLinkAction'
import { confirmEmailChangeSchema, revokeEmailChangeSchema } from '@/data/Account.schema'
import { confirmEmailChange, revokeEmailChange } from '@/graphql/account'
import { request } from '@/graphql/client'
import { t } from '@/i18n'

/**
 * The two links of a change of address: the new address confirms it
 * (`/email-change/<code>`), the old one takes it back (`/email-change/revoke/<code>`).
 */
export class EmailChange implements m.ClassComponent {
  view() {
    const changeCode: unknown = m.route.param('changeCode')
    const revoking = m.route.get().startsWith('/email-change/revoke/')
    return m(MailLinkAction, {
      name: 'email-change',
      ...(revoking
        ? {
            title: t('emailChange.revoke.title'),
            text: t('emailChange.revoke.text'),
            button: t('emailChange.revoke.button'),
            done: t('emailChange.revoke.done'),
          }
        : {
            title: t('emailChange.confirm.title'),
            text: t('emailChange.confirm.text'),
            button: t('emailChange.confirm.button'),
            done: t('emailChange.confirm.done'),
          }),
      act: () =>
        revoking
          ? request(revokeEmailChange, { vetoCode: changeCode }, revokeEmailChangeSchema)
          : request(confirmEmailChange, { code: changeCode }, confirmEmailChangeSchema),
      refused: (message) =>
        message.includes('Invalid or expired code')
          ? revoking
            ? t('emailChange.revoke.invalid')
            : t('emailChange.invalid')
          : message,
    })
  }
}
