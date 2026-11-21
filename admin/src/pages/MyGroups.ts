// AI-GENERATED — not an architecture reference

import m, { type ClassComponent } from 'mithril'
import * as v from 'valibot'
import { toastError, toastSuccess } from '@/components/Toasts'
import { UserQuery } from '@/components/UserQuery'
import {
  handledGroupsSchema,
  myGroupsChoiceSchema,
  type NumberedCreationGroup,
} from '@/data/CreationGroup.schema'
import { supportIsTheirs } from '@/data/Moderator.logic'
import { graphqlRequest } from '@/graphql/client'
import { myGroupsChoice, setHandledGroups } from '@/graphql/creationGroups.graphql'
import { currentLocale, t } from '@/i18n'
import classes from '@/pages/MyGroups.module.css'
import {
  adminStore,
  askingHandledCreationGroups,
  askingHandledSupportGroups,
  keepHandledCreationGroups,
  keepHandledSupportGroups,
} from '@/store/admin.store'
import { askOpenCreations } from '@/store/openCreations.store'
import { askOpenSupportTickets } from '@/store/openSupportTickets.store'
import { creationGroupLabel } from '@/utils/creationGroupLabel'

const savedSchema = v.object({ setHandledGroups: handledGroupsSchema })

/** One column of ticks: the groups it holds by number, and whether "no group" is among them. */
class Ticks {
  readonly groupIds = new Set<number>()
  untagged = false

  fill({ groupIds, untagged }: { groupIds: number[]; untagged: boolean }) {
    for (const id of groupIds) {
      this.groupIds.add(id)
    }
    this.untagged = untagged
  }

  get chosen() {
    return this.untagged || this.groupIds.size > 0
  }

  // as the server takes it: each group once, ascending
  get sent() {
    return { groupIds: [...this.groupIds].sort((a, b) => a - b), untagged: this.untagged }
  }
}

type Column = 'creation' | 'support'

/**
 * "Meine Gruppen" (MG1, MG2b): the moderator ticks, group by group, whether they handle its
 * creations and its support requests themself, and "no group" alike. The column "Schöpfung" steers
 * the start page's creation lines, the number at "Schöpfung" and the creation page's group filter;
 * the column "Support" the support's lines, the number at "Support" and the support page's filter. A
 * moderator without the support sees the column "Schöpfung" alone; the column "Support" is sent back
 * as it was loaded. For one who sees every group (mayChooseGroups, routes.ts). The page edits the
 * server's state, asked anew at every opening, never the one the admin keeps.
 */
export class MyGroups implements ClassComponent {
  // null while the first answer is on its way: nothing to tick, nothing to save
  private groups: NumberedCreationGroup[] | null = null
  private readonly ticks: Record<Column, Ticks> = { creation: new Ticks(), support: new Ticks() }
  private search = ''
  private saving = false

  oninit() {
    this.load()
  }

  private async load() {
    const of = adminStore.moderator?.gradidoID
    const creationAsked = askingHandledCreationGroups()
    const supportAsked = askingHandledSupportGroups()
    const answer = await graphqlRequest(myGroupsChoice)
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    const { creationGroups, handledCreationGroups, handledSupportGroups } = v.parse(
      myGroupsChoiceSchema,
      answer.value,
    )
    keepHandledCreationGroups(of, handledCreationGroups, creationAsked)
    keepHandledSupportGroups(of, handledSupportGroups, supportAsked)
    this.ticks.creation.fill(handledCreationGroups)
    this.ticks.support.fill(handledSupportGroups)
    // The ticked ones first, in either column as stored when the page opened, then the others, each
    // by name. The order stays while the moderator ticks: a row must not move away under the finger.
    const ticked = (id: number) =>
      this.ticks.creation.groupIds.has(id) || this.ticks.support.groupIds.has(id)
    const sorted = [...creationGroups].sort((a, b) =>
      creationGroupLabel(a).localeCompare(creationGroupLabel(b), currentLocale()),
    )
    this.groups = [
      ...sorted.filter(({ id }) => ticked(id)),
      ...sorted.filter(({ id }) => !ticked(id)),
    ]
  }

  // Both columns in one request; a second press waits for the first answer.
  private async save() {
    if (this.saving || !this.groups) {
      return
    }
    this.saving = true
    const of = adminStore.moderator?.gradidoID
    // a save overtakes every question about the choice still on its way
    const creationAsked = askingHandledCreationGroups()
    const supportAsked = askingHandledSupportGroups()
    const creation = this.ticks.creation.sent
    const support = this.ticks.support.sent
    const answer = await graphqlRequest(setHandledGroups, {
      creationGroupIds: creation.groupIds,
      creationUntagged: creation.untagged,
      supportGroupIds: support.groupIds,
      supportUntagged: support.untagged,
    })
    this.saving = false
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    const saved = v.parse(savedSchema, answer.value).setHandledGroups
    keepHandledCreationGroups(of, saved.creation, creationAsked)
    keepHandledSupportGroups(of, saved.support, supportAsked)
    toastSuccess(t('myGroups.saved'))
    // what the badges count changed with it -- the support's only where it is theirs: a refusal for
    // want of the right takes the tick away (askOpenSupportTickets), and this page stands for every
    // moderator who may choose, with the tick or without
    askOpenCreations()
    if (supportIsTheirs(adminStore.moderator)) {
      askOpenSupportTickets()
    }
  }

  // The column's word, as the menu has it: "Schöpfung", "Support".
  private word(column: Column) {
    return column === 'creation' ? t('creation') : t('navbar.support')
  }

  // A box of its own label, at least 44px high; named by the group and the column's word.
  private cell(column: Column, key: string, group: number | null) {
    const ticks = this.ticks[column]
    const checked = group === null ? ticks.untagged : ticks.groupIds.has(group)
    return m(
      'label',
      { class: classes.cell },
      m('input.form-check-input', {
        type: 'checkbox',
        class: classes.box,
        checked,
        'aria-labelledby': `my-groups-name-${key} my-groups-head-${column}`,
        // while a save is on its way, the ticks shown are the ticks sent
        disabled: this.saving,
        onchange: (event: Event) => {
          const on = (event.target as HTMLInputElement).checked
          if (group === null) {
            ticks.untagged = on
          } else if (on) {
            ticks.groupIds.add(group)
          } else {
            ticks.groupIds.delete(group)
          }
        },
      }),
    )
  }

  private row(columns: Column[], key: string, text: string, group: number | null) {
    return m('li.list-group-item', { key, class: classes.row, 'data-test': 'my-groups-row' }, [
      m('span', { id: `my-groups-name-${key}`, class: classes.name }, text),
      ...columns.map((column) => this.cell(column, key, group)),
    ])
  }

  // The words above the boxes; for the eye, a screen reader hears them with each box.
  private head(columns: Column[]) {
    return m(
      'li.list-group-item',
      { key: 'head', class: classes.head, 'aria-hidden': 'true', 'data-test': 'my-groups-head' },
      [
        m('span', { class: classes.name }),
        ...columns.map((column) =>
          m('span', { id: `my-groups-head-${column}`, class: classes.column }, this.word(column)),
        ),
      ],
    )
  }

  // what counts after a save, as the ticks stand: of rows where one column stands, of columns where two
  private rule(columns: Column[]) {
    const chosen = columns.filter((column) => this.ticks[column].chosen).length
    if (chosen === 0) {
      return t('myGroups.none')
    }
    if (chosen < columns.length) {
      return t('myGroups.someEmpty')
    }
    return t(columns.length > 1 ? 'myGroups.someBoth' : 'myGroups.some')
  }

  view() {
    const groups = this.groups
    const columns: Column[] = supportIsTheirs(adminStore.moderator)
      ? ['creation', 'support']
      : ['creation']
    const query = this.search.trim().toLowerCase()
    // by name and tag, without regard to case
    const matches = (...words: string[]) =>
      !query || words.some((word) => word.toLowerCase().includes(query))
    const noGroup = t('creationGroupFilter.untagged')
    const rows = groups
      ? [
          ...(matches(noGroup) ? [this.row(columns, 'untagged', noGroup, null)] : []),
          ...groups
            .filter((group) => matches(creationGroupLabel(group), group.tag))
            .map((group) =>
              this.row(columns, `group-${group.id}`, creationGroupLabel(group), group.id),
            ),
        ]
      : []
    return m('.my-groups', { class: classes.page }, [
      m('h2.h4.mb-3', t('myGroups.title')),
      m('p', t(columns.length > 1 ? 'myGroups.introBoth' : 'myGroups.intro')),
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
        : m('ul.list-group', { 'data-test': 'my-groups-list' }, [
            ...(groups ? [this.head(columns)] : []),
            ...rows,
          ]),
      // Below the list, and at the foot of the window while the list is longer than it: saving
      // stays one tap away, also with a thousand groups.
      m('div', { class: classes.foot }, [
        m(
          'p.mb-0',
          { class: classes.rule, 'data-test': 'my-groups-rule' },
          groups ? this.rule(columns) : '',
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
