// AI-GENERATED — not an architecture reference
import m, { type ClassComponent, type Vnode } from 'mithril'
import { Tooltip } from '@/components/bootstrap/Tooltip'
import { VariantIcon } from '@/components/VariantIcon'
import type { FederatedCommunity } from '@/data/Community.schema'
import { distanceToNow, t } from '@/i18n'
import { phoneLabel } from './phoneLabel'

interface Attrs {
  federation: FederatedCommunity
}

// how long ago, with the date itself on it ("null" where there is none, as before)
const dateWithTooltip = (date: string | null) =>
  m(Tooltip, { title: `${date}` }, date ? distanceToNow(new Date(date)) : '')

/** One way a community is reached: its API version, whether it is verified, and its dates. */
export class FederationVisualizeItem implements ClassComponent<Attrs> {
  view({ attrs: { federation } }: Vnode<Attrs>) {
    const { verifiedAt, lastAnnouncedAt } = federation
    // verified after it was last announced; a missing date reads as 1970, as before
    const verified = new Date(verifiedAt as string) >= new Date(lastAnnouncedAt as string)
    const cell = (label: string, content: m.Children, extra = '') =>
      m('.col-12.col-lg', { class: extra }, [phoneLabel(label), content])
    return m(
      '.federation-visualize-item',
      m('.row', [
        cell(
          t('federation.verified'),
          m(
            VariantIcon,
            verified
              ? { icon: 'check', variant: 'success' }
              : { icon: 'x-circle', variant: 'danger' },
          ),
        ),
        cell(t('federation.apiVersion'), federation.apiVersion, 'ml-1'),
        cell(t('federation.createdAt'), dateWithTooltip(federation.createdAt)),
        cell(t('federation.lastAnnouncedAt'), dateWithTooltip(lastAnnouncedAt)),
        cell(t('federation.verifiedAt'), dateWithTooltip(verifiedAt)),
        cell(t('federation.lastErrorAt'), dateWithTooltip(federation.lastErrorAt)),
      ]),
    )
  }
}
