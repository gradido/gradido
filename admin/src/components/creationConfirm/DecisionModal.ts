// AI-GENERATED — not an architecture reference
import m, { type ClassComponent, type Vnode } from 'mithril'
import { Modal } from '@/components/bootstrap/Modal'
import type { ListedContribution } from '@/data/Contribution.schema'
import { d, t } from '@/i18n'

export type Decision = 'confirm' | 'deny' | 'delete'

const VARIANTS: Record<Decision, string> = {
  confirm: 'btn-success',
  deny: 'btn-warning',
  delete: 'btn-danger',
}

interface Attrs {
  contribution: ListedContribution
  decision: Decision
  onyes: () => void
  onclose: () => void
}

const line = (label: string, value: string, valueClass = '') =>
  m('.row.mb-2', [
    m('.col-4.text-body-secondary', label),
    m('.col-8', { class: valueClass }, value),
  ])

/**
 * The question before a contribution is confirmed, denied or deleted: what it is, whom it is from,
 * and the button that carries the decision out. The body scrolls where the window is short; the
 * decision stands first, on a phone above the way back, at the desk to the right of it.
 */
export class DecisionModal implements ClassComponent<Attrs> {
  view({ attrs: { contribution, decision, onyes, onclose } }: Vnode<Attrs>) {
    const { amount, contributionDate, memo, user } = contribution
    const date = new Date(contributionDate)
    return m(
      Modal,
      {
        title: t(`overlay.${decision}.title`),
        centered: true,
        scrollable: true,
        onclose,
        footer: m('.d-flex.flex-column.flex-sm-row-reverse.gap-2.align-items-stretch.w-100', [
          m(
            'button.btn.btn-md',
            { type: 'button', class: VARIANTS[decision], onclick: onyes },
            t(`overlay.${decision}.yes`),
          ),
          m(
            'button.btn.btn-md.btn-outline-secondary',
            { type: 'button', onclick: onclose },
            t('overlay.cancel'),
          ),
        ]),
      },
      [
        line(t('transactionlist.amount'), `${amount} ${t('GDD')}`, 'fs-5 fw-bold'),
        line(t('creation_for_month'), `${d(date, 'month')} ${d(date, 'year')}`, 'fs-5'),
        line(t('transactionlist.memo'), memo, 'text-break'),
        line(t('name'), user ? `${user.firstName} ${user.lastName}`.trim() : ''),
        line(t('e_mail'), user?.emailContact?.email ?? '', 'text-break'),
        m('hr'),
        m('p', t(`overlay.${decision}.text`)),
        m('p', t(`overlay.${decision}.question`)),
      ],
    )
  }
}
