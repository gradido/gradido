// AI-GENERATED — not an architecture reference
import { deleteUser } from '@admin/graphql/deleteUser'
import { unDeleteUser } from '@admin/graphql/unDeleteUser'
import m, { type ClassComponent, type Vnode } from 'mithril'
import * as v from 'valibot'
import { ConfirmModal } from '@/components/bootstrap/ConfirmModal'
import { toastError, toastSuccess } from '@/components/Toasts'
import { isTheModerator } from '@/data/Member.logic'
import type { SearchedMember } from '@/data/SearchedMember.schema'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import { adminStore } from '@/store/admin.store'

interface Attrs {
  /** the row of the member: what is deleted or brought back is written to it */
  member: SearchedMember
}

const deletedAtSchema = v.nullable(v.string())

/** Deleting a member, or bringing a deleted one back, after a question -- an administrator's. */
export class DeletedUserFormular implements ClassComponent<Attrs> {
  private asking = false

  private async change(member: SearchedMember) {
    const deleting = !member.deletedAt
    const answer = await graphqlRequest<Record<string, unknown>>(
      deleting ? deleteUser : unDeleteUser,
      { userId: member.userId },
    )
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    member.deletedAt = v.parse(
      deletedAtSchema,
      answer.value[deleting ? 'deleteUser' : 'unDeleteUser'],
    )
    // The pin goes with the account: the server gives a deleted member none. Brought back, the
    // row shows the arrow until the list is asked again.
    if (member.deletedAt) {
      member.findableOnMap = false
    }
    toastSuccess(t(member.deletedAt ? 'user_deleted' : 'user_recovered'))
  }

  view({ attrs: { member } }: Vnode<Attrs>) {
    if (isTheModerator(adminStore.moderator, member)) {
      return m('.deleted-user-formular', m('.mt-5.mb-5', t('removeNotSelf')))
    }
    const name = `${member.firstName} ${member.lastName}`
    const deleting = !member.deletedAt
    const overlay = deleting ? 'overlay.deleteUser' : 'overlay.undeleteUser'
    return m('.deleted-user-formular', [
      m(
        '.mt-5',
        m(
          '.mt-3.mb-5',
          m(
            'button.btn.btn-md',
            {
              type: 'button',
              class: deleting ? 'btn-danger' : 'btn-success',
              onclick: () => {
                this.asking = true
              },
            },
            t(deleting ? 'delete_user' : 'undelete_user'),
          ),
        ),
      ),
      this.asking
        ? m(ConfirmModal, {
            title: t(`${overlay}.title`),
            body: t(`${overlay}.question`, { username: name }),
            yes: t(`${overlay}.yes`),
            variant: deleting ? 'danger' : 'success',
            onyes: () => this.change(member),
            onclose: () => {
              this.asking = false
            },
          })
        : null,
    ])
  }
}
