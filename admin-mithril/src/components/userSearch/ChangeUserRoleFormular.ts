// AI-GENERATED — not an architecture reference
import {
  creationGroups,
  moderatorCreationGroupScope,
  setModeratorCreationGroupScope,
  setUserCreationGroups,
  userCreationGroups,
} from '@admin/graphql/creationGroups.graphql'
import { setCreationAllowed } from '@admin/graphql/setCreationAllowed'
import { setUserRole } from '@admin/graphql/setUserRole'
import { creationGroupOption } from '@admin/utils/creationGroupLabel'
import m, { type ClassComponent, type Vnode } from 'mithril'
import * as v from 'valibot'
import { ConfirmModal } from '@/components/bootstrap/ConfirmModal'
import { type Option, ThemedSelect } from '@/components/ThemedSelect'
import { toastError, toastSuccess } from '@/components/Toasts'
import { creationGroupNameSchema } from '@/data/CreationGroup.schema'
import { isTheModerator } from '@/data/Member.logic'
import type { SearchedMember } from '@/data/SearchedMember.schema'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import { adminStore } from '@/store/admin.store'
// after ThemedSelect's sheet: the width of `role-select` wins over its full width
import '@admin/components/ChangeUserRoleFormular.css'

interface Attrs {
  /** the row of the member: a new role and the switch are written to it */
  member: SearchedMember
}

const ROLES = [
  ['USER', 'userRole.selectRoles.user'],
  ['MODERATOR', 'userRole.selectRoles.moderator'],
  ['MODERATOR_AI', 'userRole.selectRoles.moderatorAi'],
  ['ADMIN', 'userRole.selectRoles.admin'],
] as const

const groupsSchema = v.array(creationGroupNameSchema)
const scopeSchema = v.array(v.string())

/**
 * The role of a member, their main creation group, the groups a moderator sees, and whether the
 * account may create. All of it an administrator's to change; a moderator sees where the switch
 * stands, and nobody changes their own role.
 */
export class ChangeUserRoleFormular implements ClassComponent<Attrs> {
  private role = 'USER'
  private selected = 'USER'
  private asking = false
  private groups: Option[] = []
  private mainTag = ''
  private scope: string[] = []
  private creationAllowed = true
  // one switch at a time: an older answer must not win over a newer flip
  private savingCreationAllowed = false

  oninit({ attrs: { member } }: Vnode<Attrs>) {
    this.role = member.role ?? 'USER'
    this.selected = this.role
    this.creationAllowed = member.creationAllowed
    if (this.formShown(member)) {
      this.loadGroups(member.userId)
      if (this.scopeShown()) {
        this.loadScope(member.userId)
      }
    }
  }

  private formShown(member: SearchedMember) {
    return adminStore.moderator?.role === 'ADMIN' && !isTheModerator(adminStore.moderator, member)
  }

  // both moderator kinds see a scope: a KI-Moderator is a moderator who may also use Crea
  private scopeShown() {
    return this.selected === 'MODERATOR' || this.selected === 'MODERATOR_AI'
  }

  private async loadGroups(userId: number) {
    const [all, theirs] = await Promise.all([
      graphqlRequest<{ creationGroups: unknown }>(creationGroups),
      graphqlRequest<{ userCreationGroups: unknown }>(userCreationGroups, { userId }),
    ])
    if (all.success) {
      this.groups = v.parse(groupsSchema, all.value.creationGroups).map(creationGroupOption)
    }
    if (theirs.success) {
      this.mainTag = v.parse(groupsSchema, theirs.value.userCreationGroups)[0]?.tag ?? ''
    }
  }

  // Only an administrator may read a scope, and only a moderator has one: asked where it shows.
  private async loadScope(userId: number) {
    const answer = await graphqlRequest<{ moderatorCreationGroupScope: unknown }>(
      moderatorCreationGroupScope,
      { userId },
    )
    if (answer.success) {
      this.scope = v.parse(scopeSchema, answer.value.moderatorCreationGroupScope)
    }
  }

  private selectRole(role: string, userId: number) {
    const scopeBefore = this.scopeShown()
    this.selected = role
    if (!scopeBefore && this.scopeShown()) {
      this.loadScope(userId)
    }
  }

  private async saveRole(member: SearchedMember) {
    const role = this.selected
    // a usual member has no role: USER is the absence of one, null on the wire
    const value = role === 'USER' ? null : role
    const answer = await graphqlRequest(setUserRole, { userId: member.userId, role: value })
    if (!answer.success) {
      this.selected = this.role
      toastError(answer.error.message)
      return
    }
    this.role = role
    member.role = value
    const text = ROLES.find(([key]) => key === role)?.[1] ?? ''
    toastSuccess(t('userRole.successfullyChangedTo', { role: t(text) }))
  }

  private async saveMainTag(userId: number, tag: string) {
    this.mainTag = tag
    const answer = await graphqlRequest<{ setUserCreationGroups: unknown }>(setUserCreationGroups, {
      userId,
      tags: tag ? [tag] : [],
    })
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    this.mainTag = v.parse(groupsSchema, answer.value.setUserCreationGroups)[0]?.tag ?? ''
    toastSuccess(t('userRole.savedCreationGroups'))
  }

  private async saveScope(userId: number, scope: string[]) {
    this.scope = scope
    const answer = await graphqlRequest<{ setModeratorCreationGroupScope: unknown }>(
      setModeratorCreationGroupScope,
      { userId, scope },
    )
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    this.scope = v.parse(scopeSchema, answer.value.setModeratorCreationGroupScope)
    toastSuccess(t('userRole.savedScope'))
  }

  private async saveCreationAllowed(member: SearchedMember, allowed: boolean) {
    this.creationAllowed = allowed
    this.savingCreationAllowed = true
    const answer = await graphqlRequest<{ setCreationAllowed: boolean | null }>(
      setCreationAllowed,
      { userId: member.userId, allowed },
    )
    this.savingCreationAllowed = false
    if (!answer.success) {
      // the switch shows the row, not the wish
      this.creationAllowed = !allowed
      toastError(answer.error.message)
      return
    }
    this.creationAllowed = answer.value.setCreationAllowed ?? allowed
    member.creationAllowed = this.creationAllowed
    toastSuccess(
      t(
        this.creationAllowed
          ? 'userRole.creationAllowed.switchedOn'
          : 'userRole.creationAllowed.switchedOff',
      ),
    )
  }

  private roleForm(member: SearchedMember) {
    if (adminStore.moderator?.role !== 'ADMIN') {
      return m('.m-3.mb-4')
    }
    if (isTheModerator(adminStore.moderator, member)) {
      return m('.m-3.mb-4', t('userRole.notChangeYourSelf'))
    }
    const { userId } = member
    const roleId = `role-${userId}`
    const scopeId = `scope-${userId}`
    return m('.m-3', [
      m('label.me-3', { for: roleId }, t('userRole.selectLabel')),
      m(
        'select.form-select.role-select',
        {
          id: roleId,
          onchange: (event: Event) =>
            this.selectRole((event.target as HTMLSelectElement).value, userId),
        },
        ROLES.map(([value, text]) =>
          m('option', { value, selected: value === this.selected }, t(text)),
        ),
      ),
      m(
        '.mt-3.mb-5',
        m(
          'button.btn.btn-md.btn-danger',
          {
            type: 'button',
            onclick: () => {
              this.asking = true
            },
          },
          t('change_user_role'),
        ),
      ),
      m('hr'),
      m('.mb-3', [
        m('label.d-block.mb-1', t('userRole.creationGroups.label')),
        m(ThemedSelect, {
          class: 'role-select',
          'data-test': 'user-main-tag',
          value: this.mainTag,
          options: [{ value: '', text: t('userRole.creationGroups.none') }, ...this.groups],
          onchange: (tag: string) => this.saveMainTag(userId, tag),
        }),
        m('small.d-block.text-muted.mt-1', t('userRole.creationGroups.help')),
      ]),
      this.scopeShown()
        ? m('.mb-3', [
            m('label.d-block.mb-1', { for: scopeId }, t('userRole.scope.label')),
            m(
              'select.form-select.role-select',
              {
                id: scopeId,
                multiple: true,
                size: 5,
                'data-test': 'moderator-scope',
                onchange: (event: Event) =>
                  this.saveScope(
                    userId,
                    [...(event.target as HTMLSelectElement).selectedOptions].map(
                      (option) => option.value,
                    ),
                  ),
              },
              [
                { value: '*all', text: t('userRole.scope.all') },
                { value: '*untagged', text: t('userRole.scope.untagged') },
                ...this.groups,
              ].map(({ value, text }) =>
                m('option', { value, selected: this.scope.includes(value) }, text),
              ),
            ),
            m('small.d-block.text-muted.mt-1', t('userRole.scope.help')),
          ])
        : null,
      this.asking
        ? m(ConfirmModal, {
            title: t('overlay.changeUserRole.title'),
            body: t('overlay.changeUserRole.question', {
              username: `${member.firstName} ${member.lastName}`,
              newRole: t(ROLES.find(([key]) => key === this.selected)?.[1] ?? ''),
            }),
            yes: t('overlay.changeUserRole.yes'),
            variant: 'danger',
            onyes: () => this.saveRole(member),
            onclose: () => {
              this.asking = false
            },
          })
        : null,
    ])
  }

  view({ attrs: { member } }: Vnode<Attrs>) {
    const isAdmin = adminStore.moderator?.role === 'ADMIN'
    const switchId = `creation-allowed-${member.userId}`
    // half the padding below 992px: a phone has no room to spare inside the card
    return m(
      '.change-user-role-formular',
      m('.shadow.p-2.p-lg-3.mb-5.rounded', [
        this.roleForm(member),
        // "may create" next to the roles, because it is a right, but not a role -- an
        // administrator may flip it on their own account as well
        m('hr'),
        m('.m-3', { 'data-test': 'creation-allowed' }, [
          isAdmin
            ? m('.form-check.form-switch', [
                m('input.form-check-input', {
                  id: switchId,
                  type: 'checkbox',
                  role: 'switch',
                  'data-test': 'creation-allowed-switch',
                  checked: this.creationAllowed,
                  disabled: this.savingCreationAllowed,
                  onchange: (event: Event) =>
                    this.saveCreationAllowed(member, (event.target as HTMLInputElement).checked),
                }),
                m('label.form-check-label', { for: switchId }, t('userRole.creationAllowed.label')),
              ])
            : m(
                'div',
                { 'data-test': 'creation-allowed-readonly' },
                `${t('userRole.creationAllowed.label')}: ${t(
                  this.creationAllowed
                    ? 'userRole.creationAllowed.yes'
                    : 'userRole.creationAllowed.no',
                )}`,
              ),
          m('small.d-block.text-muted.mt-1', t('userRole.creationAllowed.help')),
        ]),
      ]),
    )
  }
}
