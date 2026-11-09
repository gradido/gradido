// AI-GENERATED — not an architecture reference
import m, { type ClassComponent, type Vnode } from 'mithril'
import { Tooltip } from '@/components/bootstrap/Tooltip'
import { VariantIcon } from '@/components/VariantIcon'
import type { Community } from '@/data/Community.schema'
import { distanceToNow, t } from '@/i18n'
import { FederationVisualizeItem } from './FederationVisualizeItem'
import { HomeCommunity } from './HomeCommunity'
import { phoneLabel } from './phoneLabel'

interface Attrs {
  community: Community
}

// the last time any of its federations announced itself, in words; nothing where none did
const lastAnnounced = ({ federatedCommunities }: Community) => {
  const dates = federatedCommunities.flatMap(({ lastAnnouncedAt }) =>
    lastAnnouncedAt ? [new Date(lastAnnouncedAt).getTime()] : [],
  )
  return dates.length > 0 ? distanceToNow(new Date(Math.max(...dates))) : ''
}

/** A community in the list: one row, and its details below it once the row is clicked. */
export class CommunityVisualizeItem implements ClassComponent<Attrs> {
  private details = false

  private detailsOf(community: Community) {
    const variant = community.foreign ? 'warning' : 'primary'
    return m(
      '.row.details',
      m(
        '.col',
        m('.list-group', [
          community.uuid
            ? m('.list-group-item.text-break', `${t('federation.communityUuid')} ${community.uuid}`)
            : null,
          community.authenticatedAt
            ? m(
                '.list-group-item',
                `${t('federation.authenticatedAt')} ${community.authenticatedAt}`,
              )
            : null,
          // the public key is 64 characters without a break
          m('.list-group-item.text-break', `${t('federation.publicKey')} ${community.publicKey}`),
          community.hieroTopicId && community.foreign
            ? m(
                '.list-group-item.text-break',
                `${t('federation.hieroTopicId')} ${community.hieroTopicId}`,
              )
            : null,
          community.foreign ? null : m('.list-group-item', m(HomeCommunity, { community })),
          m(
            '.list-group-item',
            m('.list-group', [
              m('.row.d-none.d-lg-flex', [
                m('.col.ms-1', t('federation.verified')),
                m('.col', t('federation.apiVersion')),
                m('.col', t('federation.createdAt')),
                m('.col', t('federation.lastAnnouncedAt')),
                m('.col', t('federation.verifiedAt')),
                m('.col', t('federation.lastErrorAt')),
              ]),
              community.federatedCommunities.map((federation) =>
                m(
                  '.list-group-item',
                  { key: federation.id, class: `list-group-item-${variant}` },
                  m(FederationVisualizeItem, { federation }),
                ),
              ),
            ]),
          ),
        ]),
      ),
    )
  }

  view({ attrs: { community } }: Vnode<Attrs>) {
    // verified where one of its federations was verified after it was last announced
    const verified = community.federatedCommunities.some(
      ({ verifiedAt, lastAnnouncedAt }) =>
        new Date(verifiedAt as string) >= new Date(lastAnnouncedAt as string),
    )
    return m('.community-visualize-item', [
      m(
        '.row',
        {
          onclick: () => {
            this.details = !this.details
          },
        },
        [
          m('.col-12.col-lg-1', [
            phoneLabel(t('federation.verified')),
            m(
              VariantIcon,
              verified
                ? { icon: 'check', variant: 'success' }
                : { icon: 'x-circle', variant: 'danger' },
            ),
          ]),
          // an address and a key are one word each: they break anywhere rather than reach past
          // the window
          m('.col-12.col-lg.text-break', [
            phoneLabel(t('federation.url')),
            m('div', m('a', { href: community.url, target: '_blank' }, community.url)),
            m('small', `${community.publicKey.substring(0, 26)}…`),
          ]),
          m('.col-12.col-lg', [
            phoneLabel(t('federation.name')),
            m(Tooltip, { title: `${community.description}` }, community.name),
          ]),
          m('.col-12.col-lg-2', [
            phoneLabel(t('federation.lastAnnouncedAt')),
            lastAnnounced(community),
          ]),
          m('.col-12.col-lg-2', [
            phoneLabel(t('federation.createdAt')),
            community.createdAt ? distanceToNow(new Date(community.createdAt)) : '',
          ]),
        ],
      ),
      this.details ? this.detailsOf(community) : null,
    ])
  }
}
