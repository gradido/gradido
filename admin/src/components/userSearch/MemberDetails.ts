// AI-GENERATED — not an architecture reference
import m, { type ClassComponent, type Vnode } from 'mithril'
import { Tabs } from '@/components/bootstrap/Tabs'
import type { SearchedMember } from '@/data/SearchedMember.schema'
import { t } from '@/i18n'
import { adminStore } from '@/store/admin.store'
import { ChangeUserRoleFormular } from './ChangeUserRoleFormular'
import { ConfirmRegisterMailFormular } from './ConfirmRegisterMailFormular'
import { CreationFormular } from './CreationFormular'
import { CreationTransactionList } from './CreationTransactionList'
import { DeletedUserFormular } from './DeletedUserFormular'
import { TransactionLinkList } from './TransactionLinkList'

interface Attrs {
  member: SearchedMember
}

// the tab of the role: the first a deleted member can open
const ROLE_TAB = 4

/**
 * What an open row of the member search shows: a tab for each thing to do with the member. A tab
 * asks for what it shows once it is opened; what a deleted member cannot have is closed.
 */
export class MemberDetails implements ClassComponent<Attrs> {
  private active = 0

  oninit({ attrs: { member } }: Vnode<Attrs>) {
    this.active = member.deletedAt ? ROLE_TAB : 0
  }

  view({ attrs: { member } }: Vnode<Attrs>) {
    const deleted = member.deletedAt !== null
    return m(
      '.card.shadow-lg.ps-3.pe-3.mb-5.rounded.row-details-card',
      m(
        '.card-body',
        m(Tabs, {
          lazy: true,
          contentClass: 'mt-3',
          active: this.active,
          onchange: (index: number) => {
            this.active = index
          },
          tabs: [
            { title: t('creation'), disabled: deleted, content: m(CreationFormular, { member }) },
            {
              title: t('e_mail'),
              disabled: deleted,
              content: m(ConfirmRegisterMailFormular, { member }),
            },
            {
              title: t('creationList'),
              disabled: deleted,
              content: m(CreationTransactionList, { userId: member.userId }),
            },
            {
              title: t('transactionlink.name'),
              disabled: deleted,
              content: m(TransactionLinkList, { userId: member.userId }),
            },
            { title: t('userRole.tabTitle'), content: m(ChangeUserRoleFormular, { member }) },
            ...(adminStore.moderator?.role === 'ADMIN'
              ? [{ title: t('delete_user'), content: m(DeletedUserFormular, { member }) }]
              : []),
          ],
        }),
      ),
    )
  }
}
