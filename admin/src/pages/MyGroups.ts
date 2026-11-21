// AI-GENERATED — not an architecture reference

import m, { type ClassComponent } from 'mithril'
import * as v from 'valibot'
import { toastError, toastSuccess } from '@/components/Toasts'
import { UserQuery } from '@/components/UserQuery'
import {
  creationGroupsAndHandledSchema,
  handledCreationGroupsSchema,
  type NumberedCreationGroup,
} from '@/data/CreationGroup.schema'
import { supportIsTheirs } from '@/data/Moderator.logic'
import { graphqlRequest } from '@/graphql/client'
import {
  creationGroupsAndHandled,
  setHandledCreationGroups,
} from '@/graphql/creationGroups.graphql'
import { currentLocale, t } from '@/i18n'
import classes from '@/pages/MyGroups.module.css'
import {
  adminStore,
  askingHandledCreationGroups,
  keepHandledCreationGroups,
} from '@/store/admin.store'
import { askOpenCreations } from '@/store/openCreations.store'
import { askOpenSupportTickets } from '@/store/openSupportTickets.store'
import { creationGroupLabel } from '@/utils/creationGroupLabel'

const savedSchema = v.object({ setHandledCreationGroups: handledCreationGroupsSchema })

/**
 * "Meine Gruppen" (MG1): the moderator ticks the creation groups they handle themself, and "no
 * group"; the start page, the numbers at "Schöpfung" and "Support" and the group filters of both
 * pages follow it (MG2). For one who sees every group (mayChooseGroups, routes.ts). The page edits
 * the server's state, asked anew at every opening, never the one the admin keeps.
 */
export class MyGroups implements ClassComponent {
  // null while the first answer is on its way: nothing to tick, nothing to save
  private groups: NumberedCreationGroup[] | null = null
  private readonly ticked = new Set<number>()
  private untagged = false
  private search = ''
  private saving = false

  oninit() {
    this.load()
  }

  private async load() {
    const of = adminStore.moderator?.gradidoID
    const choiceAsked = askingHandledCreationGroups()
    const answer = await graphqlRequest(creationGroupsAndHandled)
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    const { creationGroups, handledCreationGroups } = v.parse(
      creationGroupsAndHandledSchema,
      answer.value,
    )
    keepHandledCreationGroups(of, handledCreationGroups, choiceAsked)
    for (const id of handledCreationGroups.groupIds) {
      this.ticked.add(id)
    }
    this.untagged = handledCreationGroups.untagged
    // The ticked ones first, as stored when the page opened, then the others, each by name. The
    // order stays while the moderator ticks: a row must not move away under the finger.
    const sorted = [...creationGroups].sort((a, b) =>
      creationGroupLabel(a).localeCompare(creationGroupLabel(b), currentLocale()),
    )
    this.groups = [
      ...sorted.filter(({ id }) => this.ticked.has(id)),
      ...sorted.filter(({ id }) => !this.ticked.has(id)),
    ]
  }

  // The whole choice in one request; a second press waits for the first answer.
  private async save() {
    if (this.saving || !this.groups) {
      return
    }
    this.saving = true
    const of = adminStore.moderator?.gradidoID
    // a save overtakes every question about the choice still on its way
    const choiceAsked = askingHandledCreationGroups()
    const answer = await graphqlRequest(setHandledCreationGroups, {
      groupIds: [...this.ticked].sort((a, b) => a - b),
      untagged: this.untagged,
    })
    this.saving = false
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    keepHandledCreationGroups(
      of,
      v.parse(savedSchema, answer.value).setHandledCreationGroups,
      choiceAsked,
    )
    toastSuccess(t('myGroups.saved'))
    // what the badges count changed with it -- the support's only where it is theirs: a refusal for
    // want of the right takes the tick away (askOpenSupportTickets), and this page stands for every
    // moderator who may choose, with the tick or without
    askOpenCreations()
    if (supportIsTheirs(adminStore.moderator)) {
      askOpenSupportTickets()
    }
  }

  private row(key: string, text: string, checked: boolean, tick: (on: boolean) => void) {
    return m(
      'li.list-group-item',
      { key, class: classes.row },
      m('label', { class: classes.label }, [
        m('input.form-check-input', {
          type: 'checkbox',
          class: classes.box,
          checked,
          // while a save is on its way, the ticks shown are the ticks sent
          disabled: this.saving,
          onchange: (event: Event) => tick((event.target as HTMLInputElement).checked),
        }),
        m('span', text),
      ]),
    )
  }

  view() {
    const groups = this.groups
    const query = this.search.trim().toLowerCase()
    // by name and tag, without regard to case
    const matches = (...words: string[]) =>
      !query || words.some((word) => word.toLowerCase().includes(query))
    const noGroup = t('creationGroupFilter.untagged')
    const rows = groups
      ? [
          ...(matches(noGroup)
            ? [
                this.row('untagged', noGroup, this.untagged, (on) => {
                  this.untagged = on
                }),
              ]
            : []),
          ...groups
            .filter((group) => matches(creationGroupLabel(group), group.tag))
            .map((group) =>
              this.row(
                `group-${group.id}`,
                creationGroupLabel(group),
                this.ticked.has(group.id),
                (on) => (on ? this.ticked.add(group.id) : this.ticked.delete(group.id)),
              ),
            ),
        ]
      : []
    const chosen = this.untagged || this.ticked.size > 0
    return m('.my-groups', { class: classes.page }, [
      m('h2.h4.mb-3', t('myGroups.title')),
      m('p', t('myGroups.intro')),
      m(UserQuery, {
        class: 'mb-2',
        placeholder: t('myGroups.search'),
        value: this.search,
        oninput: (search: string) => {
          this.search = search
        },
      }),
      groups && rows.length === 0
        ? m(
            'p.text-body-secondary.my-3',
            { 'data-test': 'my-groups-no-match' },
            t('myGroups.noMatch'),
          )
        : m('ul.list-group', { 'data-test': 'my-groups-list' }, rows),
      // Below the list, and at the foot of the window while the list is longer than it: saving
      // stays one tap away, also with a thousand groups.
      m('div', { class: classes.foot }, [
        m(
          'p.mb-0',
          { class: classes.rule, 'data-test': 'my-groups-rule' },
          groups ? t(chosen ? 'myGroups.some' : 'myGroups.none') : '',
        ),
        m(
          'button.btn.btn-primary',
          {
            type: 'button',
            'data-test': 'my-groups-save',
            disabled: !groups || this.saving,
            onclick: () => this.save(),
          },
          t('save'),
        ),
      ]),
    ])
  }
}
