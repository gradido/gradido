// AI-GENERATED — not an architecture reference

import CONFIG from '@frontend/config'
import m from 'mithril'
import { copyText } from '@/browser/clipboard'
import { icon } from '@/components/ui/icon'
import { t } from '@/i18n'
import copyIcon from '~icons/bi/copy'
import classes from './GradidoAddressCopy.module.css'

type Attrs = {
  /** the user name of a member, or their Gradido ID */
  alias: string
}

/**
 * The Gradido address of a member (`host/u/name`), shown without its scheme and copied with
 * it: without one a phone does not offer to open it.
 */
export class GradidoAddressCopy implements m.ClassComponent<Attrs> {
  view({ attrs: { alias } }: m.Vnode<Attrs>) {
    const link = new URL(`/u/${encodeURIComponent(alias)}`, CONFIG.COMMUNITY_URL)
    return m(
      'button.copy-clipboard-button',
      {
        type: 'button',
        class: classes['copy-clipboard-button'],
        title: t('copy-to-clipboard'),
        'data-test': 'gradido-address-copy',
        onclick: () =>
          copyText(link.href, t('gradidoid-copied-to-clipboard'), t('gradidoid-not-copied')),
      },
      // Two parts that each stay whole: the community on one line, `/u/name` on the next
      // where both do not fit. The icon is in the second, and never stands alone.
      m('span.address-part', { 'data-test': 'gradido-address-host' }, link.host),
      m(
        'span.address-part',
        { 'data-test': 'gradido-address-path' },
        `/u/${alias} `,
        icon(copyIcon),
      ),
    )
  }
}
