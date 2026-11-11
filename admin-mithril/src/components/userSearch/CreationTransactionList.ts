// AI-GENERATED — not an architecture reference
import { adminListContributionsShort } from '@admin/graphql/adminListContributions.graphql'
import m, { type ClassComponent, type Vnode } from 'mithril'
import * as v from 'valibot'
import { Pagination } from '@/components/bootstrap/Pagination'
import { Table } from '@/components/bootstrap/Table'
import { toastError } from '@/components/Toasts'
import { type MemberContribution, memberContributionsSchema } from '@/data/MemberTabs.schema'
import { graphqlRequest } from '@/graphql/client'
import { d, t } from '@/i18n'
import { isPhone } from '@/viewport'

interface Attrs {
  userId: number
}

const PAGE_SIZE = 10

/** The contributions of a member, ten to a page, the newest first, and what their columns mean. */
export class CreationTransactionList implements ClassComponent<Attrs> {
  private contributions: MemberContribution[] = []
  private count = 0
  private page = 1
  private helpShown = false

  oninit({ attrs: { userId } }: Vnode<Attrs>) {
    this.load(userId)
  }

  private async load(userId: number) {
    const answer = await graphqlRequest(adminListContributionsShort, {
      filter: { userId },
      paginated: { currentPage: this.page, pageSize: PAGE_SIZE, order: 'DESC' },
    })
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    const { contributionCount, contributionList } = v.parse(
      memberContributionsSchema,
      answer.value,
    ).adminListContributions
    this.count = contributionCount
    this.contributions = contributionList
  }

  view({ attrs: { userId } }: Vnode<Attrs>) {
    const phone = isPhone()
    const help: [string, string][] = [
      ['transactionlist.submitted', 'help.transactionlist.submitted'],
      ['transactionlist.period', 'help.transactionlist.periods'],
      ['transactionlist.confirmed', 'help.transactionlist.confirmed'],
      ['transactionlist.status', 'help.transactionlist.status'],
    ]
    return m('.component-creation-transaction-list', [
      m('.h3', t('transactionlist.title')),
      m(Table<MemberContribution>, {
        class: 'table-hover b-table-stacked-lg table-striped',
        // on a phone each cell under the name of its column
        labelStacked: phone,
        rows: this.contributions,
        fields: [
          {
            key: 'createdAt',
            label: t('transactionlist.submitted'),
            cell: ({ createdAt }) => d(new Date(createdAt)),
          },
          {
            key: 'contributionDate',
            label: t('transactionlist.period'),
            cell: ({ contributionDate }) => [
              m('.font-weight-bold', d(new Date(contributionDate), 'month')),
              m('div', d(new Date(contributionDate))),
            ],
          },
          {
            key: 'confirmedAt',
            label: t('transactionlist.confirmed'),
            cell: ({ confirmedAt }) => (confirmedAt ? d(new Date(confirmedAt)) : ''),
          },
          { key: 'contributionStatus', label: t('transactionlist.status') },
          {
            key: 'amount',
            label: t('transactionlist.amount'),
            cell: ({ amount }) => `${amount} GDD`,
          },
          { key: 'memo', label: t('transactionlist.memo'), class: 'text-break' },
        ],
      }),
      m('div', [
        // as on the pages: three numbers on a phone, five places and « » at the desk
        m(Pagination, {
          class: 'justify-content-center pagination-lg b-pagination-pills phone-pager',
          page: this.page,
          pages: Math.ceil(this.count / PAGE_SIZE),
          limit: phone ? 3 : 5,
          noEndButtons: phone,
          onpage: (page: number) => {
            this.page = page
            this.load(userId)
          },
        }),
        m(
          'button.btn.btn-sm.btn-light',
          {
            type: 'button',
            class: this.helpShown ? '' : 'collapsed',
            'aria-controls': `creation-list-help-${userId}`,
            'aria-expanded': String(this.helpShown),
            onclick: () => {
              this.helpShown = !this.helpShown
            },
          },
          t('help.help'),
        ),
        this.helpShown
          ? m(
              '.collapse.show.mt-2',
              { id: `creation-list-help-${userId}` },
              help.map(([term, meaning]) =>
                m('div', `${t(term)} ${t('math.equals')} ${t(meaning)}`),
              ),
            )
          : null,
      ]),
    ])
  }
}
