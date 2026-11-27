// AI-GENERATED — not an architecture reference

import m, { type ClassComponent } from 'mithril'
import * as v from 'valibot'
import { Pagination } from '@/components/bootstrap/Pagination'
import { CommunityVisualizeItem } from '@/components/federation/CommunityVisualizeItem'
import { toastError } from '@/components/Toasts'
import { allCommunitiesSchema, type Community } from '@/data/Community.schema'
import { allCommunities } from '@/graphql/allCommunities'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import { isPhone } from '@/viewport'
import refreshIcon from '~icons/bi/arrow-clockwise'

const PAGE_SIZE = 25

/** The communities this one knows, its own first, and how each is reached. */
export class FederationVisualize implements ClassComponent {
  private communities: Community[] = []
  private count = 0
  private page = 1

  oninit() {
    this.load()
  }

  private async load() {
    const answer = await graphqlRequest(allCommunities, {
      currentPage: this.page,
      pageSize: PAGE_SIZE,
    })
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    const { count, communities } = v.parse(allCommunitiesSchema, answer.value).allCommunities
    this.count = count
    this.communities = communities
  }

  view() {
    const phone = isPhone()
    return m('.federation-visualize', [
      m('.d-flex.justify-content-between.align-items-center.mb-3', [
        m('span.h2', t('federation.gradidoInstances')),
        // a symbol and nothing else: its name is all a screen reader has of it
        m(
          'button.btn.btn-md.btn-secondary',
          {
            type: 'button',
            'data-test': 'federation-communities-refresh-btn',
            title: t('refresh'),
            'aria-label': t('refresh'),
            onclick: () => this.load(),
          },
          m.trust(refreshIcon),
        ),
      ]),
      m('.list-group', [
        // the heads of the columns from 992px on; below, every community is a card
        m('.row.d-none.d-lg-flex', [
          m('.col-1.ms-1', t('federation.verified')),
          m('.col.ms-3', t('federation.url')),
          m('.col.ms-3', t('federation.name')),
          m('.col-2', t('federation.verifiedAt')),
          m('.col-2', t('federation.createdAt')),
        ]),
        this.communities.map((community) =>
          m(
            '.list-group-item',
            {
              key: community.publicKey,
              class: community.foreign ? 'list-group-item-warning' : 'list-group-item-primary',
            },
            m(CommunityVisualizeItem, { community }),
          ),
        ),
      ]),
      m(Pagination, {
        class: 'justify-content-center pagination-lg b-pagination-pills phone-pager mt-3',
        page: this.page,
        pages: Math.ceil(this.count / PAGE_SIZE),
        limit: phone ? 3 : 5,
        noEndButtons: phone,
        onpage: (page: number) => {
          this.page = page
          this.load()
        },
      }),
    ])
  }
}
