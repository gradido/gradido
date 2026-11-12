// AI-GENERATED — not an architecture reference
import '@admin/components/ConfirmRegisterMailFormular.css'
import { adminEmailStatus } from '@admin/graphql/adminEmailStatus'
import { adminReplaceUnconfirmedEmail } from '@admin/graphql/adminReplaceUnconfirmedEmail'
import { sendActivationEmail } from '@admin/graphql/sendActivationEmail'
import m, { type ClassComponent, type Vnode } from 'mithril'
import * as v from 'valibot'
import { toastError, toastSuccess } from '@/components/Toasts'
import { type EmailStatus, emailStatusSchema } from '@/data/MemberTabs.schema'
import type { SearchedMember } from '@/data/SearchedMember.schema'
import { graphqlRequest } from '@/graphql/client'
import { d, t } from '@/i18n'

interface Attrs {
  /** the row of the member: a corrected address is written to it */
  member: SearchedMember
}

// The correction's refusals in this page's words, by what the backend throws before anything is
// saved (EmailChangeResolver). Any other answer may follow a saved address, or the answer was
// lost on the way: it is shown as the server gave it, under a heading that claims no outcome.
const REFUSALS: Record<string, string> = {
  'Email address already in use': 'unregister_mail.replace.taken',
  'The address is confirmed - only the member can change it': 'unregister_mail.replace.confirmed',
  'Invalid email address': 'unregister_mail.replace.invalid',
}

/**
 * The address of a member: the confirmation mail sent again, a never confirmed address corrected,
 * and what the support needs beside it -- the address the GDT server asks with, a change under
 * way.
 */
export class ConfirmRegisterMailFormular implements ClassComponent<Attrs> {
  private status: EmailStatus | null = null
  private replacement = ''
  // the button stays locked until the answer is in: a second press would send it again
  private replacing = false

  oninit({ attrs: { member } }: Vnode<Attrs>) {
    this.loadStatus(member.userId)
  }

  private async loadStatus(userId: number) {
    const answer = await graphqlRequest(adminEmailStatus, { userId })
    if (answer.success) {
      this.status = v.parse(emailStatusSchema, answer.value).adminEmailStatus
    }
  }

  private async sendMail(email: string) {
    const answer = await graphqlRequest(sendActivationEmail, { email })
    if (answer.success) {
      toastSuccess(t('unregister_mail.success', { email }))
    } else {
      toastError(t('unregister_mail.error', { message: answer.error.message }))
    }
  }

  private async replace(member: SearchedMember) {
    const typed = this.replacement
    this.replacing = true
    const answer = await graphqlRequest<{ adminReplaceUnconfirmedEmail: string }>(
      adminReplaceUnconfirmedEmail,
      { userId: member.userId, email: typed },
    )
    this.replacing = false
    if (!answer.success) {
      const { message } = answer.error
      toastError(
        message in REFUSALS
          ? t(REFUSALS[message], { email: typed })
          : t('unregister_mail.replace.error', { message }),
      )
      return
    }
    member.email = answer.value.adminReplaceUnconfirmedEmail
    // cleared only where it still holds what was sent: what was typed meanwhile stays
    if (this.replacement === typed) {
      this.replacement = ''
    }
    toastSuccess(t('unregister_mail.replace.success', { email: member.email ?? '' }))
    // what the server now knows of the addresses, which the correction does not answer
    this.loadStatus(member.userId)
  }

  // The other way out when the mail never arrives: a typo at registration. Only while the address
  // was never confirmed -- the fetched status decides, not the row, which may be older.
  private replaceForm(member: SearchedMember) {
    const { status } = this
    if (status?.currentConfirmed) {
      return null
    }
    return m('.mt-4', { 'data-test': 'email-replace' }, [
      m('.fw-bold', t('unregister_mail.replace.title')),
      m('.small.text-muted.mb-2', t('unregister_mail.replace.hint')),
      status?.elopageBuysOnCurrent
        ? m(
            '.alert.alert-warning.small',
            { 'data-test': 'email-replace-warning' },
            t('unregister_mail.replace.elopage_warning', { email: member.email ?? '' }),
          )
        : null,
      m('.input-group', { role: 'group' }, [
        m('input.form-control', {
          type: 'email',
          placeholder: t('unregister_mail.replace.placeholder'),
          'aria-label': t('unregister_mail.replace.placeholder'),
          'data-test': 'email-replace-input',
          value: this.replacement,
          oninput: (event: Event) => {
            this.replacement = (event.target as HTMLInputElement).value
          },
        }),
        m(
          'button.btn.btn-md.btn-outline-danger',
          {
            type: 'button',
            'data-test': 'email-replace-button',
            disabled: !this.replacement || this.replacing,
            onclick: () => this.replace(member),
          },
          t('unregister_mail.replace.button'),
        ),
      ]),
    ])
  }

  view({ attrs: { member } }: Vnode<Attrs>) {
    const { status } = this
    const { emailConfirmationSend } = member
    // a member without an address has none to show or to write to
    const email = member.email ?? ''
    // half the padding below 992px: a phone has no room to spare inside the card
    return m(
      '.component-confirm-register-mail',
      m('.shadow.p-2.p-lg-3.mb-5.rounded', [
        member.emailChecked
          ? m('div', t('unregister_mail.text_true'))
          : m('div', [
              emailConfirmationSend
                ? t('unregister_mail.text_false', {
                    date: d(new Date(emailConfirmationSend), 'long'),
                    email,
                  })
                : t('unregister_mail.never_sent', { email }),
              ' ',
              m('.input-group.mt-3', { role: 'group' }, [
                m('span.input-group-text', m('span', t('unregister_mail.info'))),
                m('input.form-control', {
                  type: 'text',
                  readonly: true,
                  value: email,
                  'aria-label': t('unregister_mail.info'),
                }),
                m(
                  'button.btn.btn-md.btn-outline-success.test-button',
                  { type: 'button', onclick: () => this.sendMail(email) },
                  t('unregister_mail.button'),
                ),
              ]),
              this.replaceForm(member),
            ]),
        // shown only where it says something the current address does not
        status
          ? m('.mt-3.small', { 'data-test': 'email-status' }, [
              status.gdtEmail !== member.email
                ? m(
                    'div',
                    { 'data-test': 'email-gdt' },
                    t('unregister_mail.gdt_email', { email: status.gdtEmail ?? '' }),
                  )
                : null,
              status.pendingEmail
                ? m(
                    'div',
                    { 'data-test': 'email-pending' },
                    t('unregister_mail.pending', {
                      email: status.pendingEmail,
                      date: status.pendingSince ? d(new Date(status.pendingSince), 'long') : '',
                    }),
                  )
                : null,
            ])
          : null,
      ]),
    )
  }
}
