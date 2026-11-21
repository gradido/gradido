// AI-GENERATED — not an architecture reference

import m, { type ClassComponent } from 'mithril'
import * as v from 'valibot'
import { ConfirmModal } from '@/components/bootstrap/ConfirmModal'
import { toastError, toastSuccess } from '@/components/Toasts'
import { supportSwitchedSchema, supportSwitchSchema } from '@/data/SupportTicket.schema'
import { graphqlRequest } from '@/graphql/client'
import { adminSetSupportTicketsActive, supportTicketsMenu } from '@/graphql/supportTickets.graphql'
import { t } from '@/i18n'
import { askOpenSupportTickets } from '@/store/openSupportTickets.store'

/**
 * Einstellungen → Support, for administrators (routes.ts): whether members may file new requests
 * (K5, SUA-019), the one setting of the support so far. It stood above the support's list until
 * then; there a line still says while new requests are off, and leads an administrator here.
 *
 * Switching off asks first and names all requests still open -- also those waiting for a
 * resubmission, which the badges leave out (K4), and those beyond "Meine Gruppen" (MG2) --;
 * switching on asks nothing (only one way does harm). The box stands as the server says it holds.
 */
export class SupportSettings implements ClassComponent {
  // null while the server has not said, or could not say
  private active: boolean | null = null
  // the question before switching off, with how many requests are open (null: the count did not come)
  private switchingOff: { open: number | null } | null = null
  // a switch on its way: a second click sends nothing
  private switching = false
  // the count before the question on its way: the box waits for it, and a second click asks nothing,
  // so one click opens one question (coderabbit on #4316)
  private counting = false

  oninit() {
    this.ask()
  }

  private async ask() {
    const answer = await graphqlRequest(supportTicketsMenu)
    this.active = answer.success
      ? (v.parse(supportSwitchSchema, answer.value).supportTicketsMenu?.active ?? null)
      : null
    if (this.active === null) {
      toastError(t('support.failed'))
    }
  }

  private async toggle(active: boolean) {
    if (active) {
      await this.set(true)
      return
    }
    if (this.counting) {
      return
    }
    this.counting = true
    // an answer the admin cannot read throws (a server of another version): asked without a number
    // then, as where the count did not come -- and the box never stays waiting
    const counts = await askOpenSupportTickets().catch(() => null)
    this.counting = false
    this.switchingOff = {
      open: counts
        ? counts.forModeration +
          counts.forMember +
          counts.onResubmission +
          counts.elsewhere +
          counts.elsewhereOnResubmission
        : null,
    }
  }

  private async set(active: boolean) {
    if (this.switching) {
      return
    }
    this.switching = true
    const answer = await graphqlRequest(adminSetSupportTicketsActive, { active })
    this.switching = false
    if (!answer.success) {
      toastError(t('support.failed'))
      return
    }
    this.active = v.parse(supportSwitchedSchema, answer.value).adminSetSupportTicketsActive
    toastSuccess(t(this.active ? 'support.switch.on' : 'support.switch.off'))
  }

  view() {
    return m('.support-settings', [
      m('.h2.mb-3', t('navbar.support')),
      this.active === null
        ? null
        : // the word is the label of the box, so a tap on it ticks the box too
          m('.support-switch', [
            m('p.mb-0.d-flex.align-items-center', [
              m('input#support-tickets-active', {
                type: 'checkbox',
                checked: this.active,
                disabled: this.switching || this.counting,
                onchange: (event: Event) => this.toggle((event.target as HTMLInputElement).checked),
              }),
              m('label.ms-2', { for: 'support-tickets-active' }, t('support.switch.label')),
            ]),
            m('small.d-block.text-muted', t('support.switch.hint')),
          ]),
      this.switchingOff
        ? m(ConfirmModal, {
            title: t('support.switch.confirmTitle'),
            body: [
              t('support.switch.confirmBody'),
              this.switchingOff.open === null
                ? ''
                : t('support.switch.confirmOpen', { open: this.switchingOff.open }),
            ]
              .filter(Boolean)
              .join(' '),
            yes: t('support.switch.confirmYes'),
            variant: 'danger',
            onyes: () => this.set(false),
            onclose: () => {
              this.switchingOff = null
            },
          })
        : null,
    ])
  }
}
