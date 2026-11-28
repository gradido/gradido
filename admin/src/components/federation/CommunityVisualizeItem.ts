// AI-GENERATED — not an architecture reference
import m, { type ClassComponent, type Vnode } from 'mithril'
import { FEDERATION_AUTHENTICATION_TIMEOUT_MS } from 'shared/browser'
import { Tooltip } from '@/components/bootstrap/Tooltip'
import { VariantIcon } from '@/components/VariantIcon'
import type { Community } from '@/data/Community.schema'
import { distanceToNow, t } from '@/i18n'
import { HomeCommunity } from './HomeCommunity'
import { phoneLabel } from './phoneLabel'

interface Attrs {
  community: Community
}

// how long ago, with the date itself on it; nothing where there is none
const dateWithTooltip = (date: string | null) =>
  date ? m(Tooltip, { title: date }, distanceToNow(new Date(date))) : ''

// the own community is always reached; a foreign one while it answered correctly lately
const isVerified = ({ foreign, verifiedAt }: Community) =>
  !foreign ||
  (verifiedAt !== null &&
    Date.now() - new Date(verifiedAt).getTime() < FEDERATION_AUTHENTICATION_TIMEOUT_MS)

/** A community in the list: one row, and its details below it once the row is clicked. */
export class CommunityVisualizeItem implements ClassComponent<Attrs> {
  private details = false

  private detailsOf(community: Community) {
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
        ]),
      ),
    )
  }

  view({ attrs: { community } }: Vnode<Attrs>) {
    const verified = isVerified(community)
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
            phoneLabel(t('federation.verifiedAt')),
            dateWithTooltip(community.verifiedAt),
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
