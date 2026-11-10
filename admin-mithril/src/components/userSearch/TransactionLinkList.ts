// AI-GENERATED — not an architecture reference
import { listTransactionLinksAdmin } from '@admin/graphql/listTransactionLinksAdmin'
import m, { type ClassComponent, type Vnode } from 'mithril'
import * as v from 'valibot'
import { Pagination } from '@/components/bootstrap/Pagination'
import { Table } from '@/components/bootstrap/Table'
import { toastError } from '@/components/Toasts'
import { type MemberTransactionLink, memberTransactionLinksSchema } from '@/data/MemberTabs.schema'
import { linkState } from '@/data/TransactionLink.logic'
import { graphqlRequest } from '@/graphql/client'
import { d, t } from '@/i18n'
import { isPhone } from '@/viewport'

interface Attrs {
  userId: number
}

const PAGE_SIZE = 5

/** The transaction links a member made, five to a page, with what became of each. */
export class TransactionLinkList implements ClassComponent<Attrs> {
  private links: MemberTransactionLink[] = []
  private count = 0
  private page = 1

  oninit({ attrs: { userId } }: Vnode<Attrs>) {
    this.load(userId)
  }

  private async load(userId: number) {
    const answer = await graphqlRequest(listTransactionLinksAdmin, {
      currentPage: this.page,
      pageSize: PAGE_SIZE,
      userId,
    })
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    const { count, links } = v.parse(
      memberTransactionLinksSchema,
      answer.value,
    ).listTransactionLinksAdmin
    this.count = count
    this.links = links
  }

  view({ attrs: { userId } }: Vnode<Attrs>) {
    const phone = isPhone()
    return m('.transaction-link-list', [
      this.links.length > 0
        ? m('div', [
            m('.h3', t('transactionlink.name')),
            m(Table<MemberTransactionLink>, {
              class: 'table-hover b-table-stacked-lg table-striped',
              // on a phone each cell under the name of its column
              labelStacked: phone,
              rows: this.links,
              fields: [
                {
                  key: 'createdAt',
                  label: t('transactionlink.created'),
                  cell: ({ createdAt }) => d(new Date(createdAt)),
                },
                {
                  key: 'amount',
                  label: t('transactionlist.amount'),
                  cell: ({ amount }) => `${amount} GDD`,
                },
                { key: 'memo', label: t('transactionlist.memo'), class: 'text-break' },
                {
                  key: 'validUntil',
                  label: t('transactionlink.valid_until'),
                  cell: ({ validUntil }) => d(new Date(validUntil)),
                },
                {
                  key: 'contributionStatus',
                  label: t('transactionlist.status'),
                  cell: (link) => linkState(link),
                },
              ],
            }),
          ])
        : null,
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
    ])
  }
}
