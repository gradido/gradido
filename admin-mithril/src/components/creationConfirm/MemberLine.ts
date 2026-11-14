// AI-GENERATED — not an architecture reference
import { CONFIG } from '@admin/config'
import BootstrapTooltip from 'bootstrap/js/dist/tooltip'
import m, { type ClassComponent, type Vnode, type VnodeDOM } from 'mithril'
import { icon } from '@/components/icon'
import { MemberWalletLink } from '@/components/MemberWalletLink'
import { t } from '@/i18n'
import { closeRemark, openRemark, type RemarkCard } from '@/store/userRemarks.store'
import circlesIcon from '~icons/arcticons/circles'
import { RemarkEditor, remarkLine, remarkToggle } from './MemberRemark'

/** The member of an opened contribution or support request, as their line names them. */
export type LinedMember = {
  firstName: string
  lastName: string
  alias: string | null
  publicName: string | null
  userIdentifier: string | null
  gradidoID: string
  communityUuid: string
  findableOnMap: boolean | null
  deletedAt: string | null
}

interface Attrs {
  member: LinedMember
  email: string
  /** the moderation's remark on the member, attached by the card that shows the line */
  remark: RemarkCard
}

let lastId = 0

/**
 * The member line of an opened contribution or support request, the same in both: the name, into
 * the member search; the address; the username with the ways into the wallet and the remark's
 * button; the profile on HumHub -- and under it the moderation's remark, or the field in its place
 * while it is written. Rows of a `.list-group`.
 */
export class MemberLine implements ClassComponent<Attrs> {
  private readonly remarkFieldId = `remark-field-${++lastId}`
  private remarkToggle?: HTMLElement

  // "Fertig" or Escape: the field closes, and the keyboard goes back to the button that opened it
  private closeRemark(remark: RemarkCard) {
    closeRemark(remark)
    m.redraw.sync()
    this.remarkToggle?.focus()
  }

  view({ attrs: { member, email, remark } }: Vnode<Attrs>) {
    const name = member.alias || member.firstName
    // A support request can come from a member without an address in force: the search then
    // looks for the username, else the name, and there is no address to write to.
    const search = email || member.alias || `${member.firstName} ${member.lastName}`
    return [
      // side by side at the desk; on a phone each part wraps as a whole
      m('.list-group-item.d-flex.flex-wrap.align-items-center.column-gap-3.row-gap-1', [
        m(
          m.route.Link,
          { href: `/user?search=${search}`, title: t('goTo.userSearch') },
          `${member.firstName} ${member.lastName}`,
        ),
        email ? m('a.text-break', { href: `mailto:${email}` }, email) : null,
        m('span', [
          `${member.publicName ?? ''} `,
          // the remark's button behind the pin and the arrow, never alone on a line
          m('span.text-nowrap', [
            m(MemberWalletLink, { member, name }),
            remarkToggle(
              remark,
              name,
              this.remarkFieldId,
              () => (remark.open ? this.closeRemark(remark) : openRemark(remark)),
              ({ dom }: VnodeDOM) => {
                this.remarkToggle = dom as HTMLElement
              },
            ),
          ]),
        ]),
        m(
          'span',
          CONFIG.HUMHUB_ACTIVE === true
            ? m(
                'a',
                {
                  href: `${CONFIG.HUMHUB_API_URL.replace(/\/$/, '')}/u/${member.userIdentifier}`,
                  target: '_blank',
                  oncreate: ({ dom }: VnodeDOM) =>
                    new BootstrapTooltip(dom, { title: t('goTo.humhubProfile') }),
                  onremove: ({ dom }: VnodeDOM) => BootstrapTooltip.getInstance(dom)?.dispose(),
                },
                icon(circlesIcon, { class: 'svg-icon' }),
              )
            : null,
        ),
      ]),
      // the remark under the member line -- or, while it is written, the field in its place
      remark.open
        ? m(RemarkEditor, {
            card: remark,
            name,
            fieldId: this.remarkFieldId,
            ondone: () => this.closeRemark(remark),
          })
        : remarkLine(remark),
    ]
  }
}
