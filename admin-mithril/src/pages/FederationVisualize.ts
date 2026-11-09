// AI-GENERATED — not an architecture reference
import { allCommunities } from '@admin/graphql/allCommunities'
import m, { type ClassComponent } from 'mithril'
import * as v from 'valibot'
import { CommunityVisualizeItem } from '@/components/federation/CommunityVisualizeItem'
import { toastError } from '@/components/Toasts'
import { allCommunitiesSchema, type Community } from '@/data/Community.schema'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import refreshIcon from '~icons/bi/arrow-clockwise'

/** The communities this one knows, its own first, and how each is reached. */
export class FederationVisualize implements ClassComponent {
  private communities: Community[] = []

  oninit() {
    this.load()
  }

  private async load() {
    const answer = await graphqlRequest(allCommunities)
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    this.communities = v.parse(allCommunitiesSchema, answer.value).allCommunities
  }

  view() {
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
          m('.col-2', t('federation.lastAnnouncedAt')),
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
    ])
  }
}
