// AI-GENERATED — not an architecture reference

import m, { type ClassComponent } from 'mithril'
import * as v from 'valibot'
import { Pagination } from '@/components/bootstrap/Pagination'
import { toastError } from '@/components/Toasts'
import { UserQuery } from '@/components/UserQuery'
import {
  type HandledCreationGroups,
  handledGroupsSchema,
  myGroupsChoiceSchema,
  type NumberedCreationGroup,
} from '@/data/CreationGroup.schema'
import { maySwitchOff, supportIsTheirs } from '@/data/Moderator.logic'
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
import { isPhone } from '@/viewport'

const savedSchema = v.object({ setHandledGroups: handledGroupsSchema })

/** Rows of a page: "(ohne Gruppe)" counts as one of them, on the first. */
export const MY_GROUPS_PAGE_SIZE = 20

/** How long the page waits before it asks for the stored ticks again, where asking failed. */
const RETRY_MS = 2000

/**
 * One column of ticks: the groups it holds by number, whether "no group" is among them, and whether
 * an administrator handles nothing of its kind (MG5) -- the ticks stay behind the switch.
 */
class Ticks {
  readonly groupIds = new Set<number>()
  untagged = false
  off = false

  fill({ groupIds, untagged, off }: HandledCreationGroups) {
    this.groupIds.clear()
    for (const id of groupIds) {
      this.groupIds.add(id)
    }
    this.untagged = untagged
    this.off = off
  }

  // what counts of it: the sentence of the column
  get state(): 'off' | 'some' | 'all' {
    return this.off ? 'off' : this.untagged || this.groupIds.size > 0 ? 'some' : 'all'
  }

  // as the server takes it: each group once, ascending
  get sent() {
    return {
      groupIds: [...this.groupIds].sort((a, b) => a - b),
      untagged: this.untagged,
      off: this.off,
    }
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
 *
 * Every tick is saved at once, both columns in one request (Bernd, 22.11.2026: no button). One
 * request at a time: ticks made while one is out go with the next, so no answer overtakes another.
 * A save that fails says so and puts back the ticks the server holds -- the boxes wait for them,
 * asked again until the server answers (coderabbit on #4317). Twenty rows to a page, the ticked
 * ones first; the search looks through all of them.
 */
export class MyGroups implements ClassComponent {
  // null while the first answer is on its way: nothing to tick, nothing to save
  private groups: NumberedCreationGroup[] | null = null
  private readonly ticks: Record<Column, Ticks> = { creation: new Ticks(), support: new Ticks() }
  private search = ''
  private page = 1
  // a save on its way, and whether a tick came while it was out
  private saving = false
  private again = false
  // the quiet line below the list: said once a save came back and no tick waits
  private saved = false
  // after a failed save, until the ticks the server holds are back: the boxes wait
  private recovering = false
  // the page was left: a failed save stops asking, also the one waiting its turn (coderabbit on #4317)
  private left = false
  private endWait?: () => void

  oninit() {
    this.load()
  }

  onremove() {
    this.left = true
    this.endWait?.()
  }

  /**
   * The groups and both columns as the server holds them; `order` sorts the rows anew. Answers
   * whether they came; `quiet` asks again without a word of its own.
   */
  private async load(order = true, quiet = false): Promise<boolean> {
    const of = adminStore.moderator?.gradidoID
    const creationAsked = askingHandledCreationGroups()
    const supportAsked = askingHandledSupportGroups()
    const answer = await graphqlRequest(myGroupsChoice)
    if (!answer.success) {
      if (!quiet) {
        toastError(answer.error.message)
      }
      return false
    }
    const { creationGroups, handledCreationGroups, handledSupportGroups } = v.parse(
      myGroupsChoiceSchema,
      answer.value,
    )
    keepHandledCreationGroups(of, handledCreationGroups, creationAsked)
    keepHandledSupportGroups(of, handledSupportGroups, supportAsked)
    this.ticks.creation.fill(handledCreationGroups)
    this.ticks.support.fill(handledSupportGroups)
    if (!order && this.groups) {
      return true
    }
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
    return true
  }

  /**
   * After a failed save: the ticks the server holds, in the order of the page, before anything
   * else is ticked -- the boxes wait, and a question that fails is asked again until the server
   * answers or the page is left. Until then no tick can go out on top of what the screen shows
   * wrongly.
   */
  private async recover() {
    this.recovering = true
    while (!this.left && !(await this.load(false, true))) {
      await this.waitToRetry()
    }
    this.recovering = false
  }

  /** The pause before the stored ticks are asked again; ended at once where the page is left. */
  private waitToRetry() {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, RETRY_MS)
      this.endWait = () => {
        clearTimeout(timer)
        resolve()
      }
    })
  }

  /**
   * Sends both columns as they stand. While a request is out, a tick only marks that another is
   * due: it goes once the answer is there, with the ticks of that moment.
   */
  private async save() {
    if (!this.groups) {
      return
    }
    this.saved = false
    if (this.saving) {
      this.again = true
      return
    }
    this.saving = true
    do {
      this.again = false
      const of = adminStore.moderator?.gradidoID
      // a save overtakes every question about the choice still on its way
      const creationAsked = askingHandledCreationGroups()
      const supportAsked = askingHandledSupportGroups()
      const answer = await graphqlRequest(setHandledGroups, {
        creation: this.ticks.creation.sent,
        support: this.ticks.support.sent,
      })
      if (!answer.success) {
        this.again = false
        toastError(answer.error.message)
        // still saving while the stored ticks come back: nothing goes out in between
        await this.recover()
        this.saving = false
        return
      }
      const saved = v.parse(savedSchema, answer.value).setHandledGroups
      keepHandledCreationGroups(of, saved.creation, creationAsked)
      keepHandledSupportGroups(of, saved.support, supportAsked)
      // what the badges count changed with each save that came through -- the support's only where
      // it is theirs: a refusal for want of the right takes the tick away (askOpenSupportTickets),
      // and this page stands for every moderator who may choose, with the tick or without
      askOpenCreations()
      if (supportIsTheirs(adminStore.moderator)) {
        askOpenSupportTickets()
      }
    } while (this.again)
    this.saving = false
    this.saved = true
  }

  // The column's word, as the menu has it: "Schöpfung", "Support".
  private word(column: Column) {
    return column === 'creation' ? t('creation') : t('navbar.support')
  }

  // A box of its own label, at least 44px high; named by the group and the column's word. It stands
  // still while the column is off (MG5): its ticks are kept for the day it is on again.
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
        // also after a failed save, until the stored ticks are back
        disabled: this.recovering || ticks.off,
        onchange: (event: Event) => {
          const on = (event.target as HTMLInputElement).checked
          if (group === null) {
            ticks.untagged = on
          } else if (on) {
            ticks.groupIds.add(group)
          } else {
            ticks.groupIds.delete(group)
          }
          this.save()
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

  // "Selbst bearbeiten" (MG5), for an administrator: the first row, with a switch for each column --
  // off, and nothing of its kind is theirs, counted or mailed; its ticks stay behind it
  private handleRow(columns: Column[]) {
    return m(
      'li.list-group-item',
      {
        key: 'handle',
        class: `${classes.row} ${classes.handle}`,
        'data-test': 'my-groups-handle',
      },
      [
        m('span', { id: 'my-groups-name-handle', class: classes.name }, t('myGroups.handle')),
        ...columns.map((column) =>
          m(
            'label',
            { class: classes.cell },
            m(
              '.form-check.form-switch',
              { class: classes.switch },
              m('input.form-check-input', {
                type: 'checkbox',
                role: 'switch',
                class: classes.box,
                checked: !this.ticks[column].off,
                disabled: this.recovering,
                'aria-labelledby': `my-groups-name-handle my-groups-head-${column}`,
                onchange: (event: Event) => {
                  this.ticks[column].off = !(event.target as HTMLInputElement).checked
                  this.save()
                },
              }),
            ),
          ),
        ),
      ],
    )
  }

  // what counts in each column, as the ticks and the switch stand; off, the support's mails too
  private rule(columns: Column[]) {
    return columns.map((column) => {
      const state = this.ticks[column].state
      const sentence = state === 'off' && column === 'support' ? 'offSupport' : state
      return m(
        'span',
        { key: column },
        t(`myGroups.rule.${sentence}`, { column: this.word(column) }),
      )
    })
  }

  view() {
    const groups = this.groups
    const phone = isPhone()
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
          ...(matches(noGroup) ? [{ key: 'untagged', text: noGroup, group: null }] : []),
          ...groups
            .filter((group) => matches(creationGroupLabel(group), group.tag))
            .map((group) => ({
              key: `group-${group.id}`,
              text: creationGroupLabel(group),
              group: group.id,
            })),
        ]
      : []
    const pages = Math.max(1, Math.ceil(rows.length / MY_GROUPS_PAGE_SIZE))
    const page = Math.min(this.page, pages)
    const shown = rows.slice((page - 1) * MY_GROUPS_PAGE_SIZE, page * MY_GROUPS_PAGE_SIZE)
    return m('.my-groups', { class: classes.page }, [
      m('h2.h4.mb-3', t('myGroups.title')),
      m('p', t(columns.length > 1 ? 'myGroups.introBoth' : 'myGroups.intro')),
      m(UserQuery, {
        class: 'mb-2',
        placeholder: t('myGroups.search'),
        value: this.search,
        oninput: (search: string) => {
          this.search = search
          // a search looks through all groups, from the first page
          this.page = 1
        },
      }),
      groups && rows.length === 0
        ? m(
            'p.text-body-secondary.my-3',
            { 'data-test': 'my-groups-no-match' },
            t('myGroups.noMatch'),
          )
        : m('ul.list-group', { id: 'my-groups-list', 'data-test': 'my-groups-list' }, [
            ...(groups ? [this.head(columns)] : []),
            ...(groups && maySwitchOff(adminStore.moderator) ? [this.handleRow(columns)] : []),
            ...shown.map(({ key, text, group }) => this.row(columns, key, text, group)),
          ]),
      // on a phone `‹`, three numbers and `›`; at the desk five places with the ellipses, and « »
      pages > 1
        ? m(Pagination, {
            class: 'justify-content-center mt-3 mb-0 b-pagination-pills phone-pager',
            page,
            pages,
            controls: 'my-groups-list',
            limit: phone ? 3 : 5,
            noEndButtons: phone,
            onpage: (next: number) => {
              this.page = next
            },
          })
        : null,
      // Below the list, and at the foot of the window while the list is longer than it: what counts,
      // and quietly that it is saved.
      m('div', { class: classes.foot }, [
        m(
          'p.mb-0',
          { class: classes.rule, 'data-test': 'my-groups-rule' },
          groups ? this.rule(columns) : '',
        ),
        m(
          'p.mb-0.small.text-body-secondary',
          { class: classes.saved, role: 'status', 'data-test': 'my-groups-saved' },
          this.saved ? t('myGroups.saved') : '',
        ),
      ]),
    ])
  }
}
