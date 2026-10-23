import { mount, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { MemberAvatar } from '@/components/MemberAvatar'
import { LIST_AVATAR_SIZE } from '@/constants'
import IBiBellFill from '~icons/bi/bell-fill'
import IBiCheck from '~icons/bi/check'
import IBiExclamationCircleFill from '~icons/bi/exclamation-circle-fill'
import IBiQuestionDiamond from '~icons/bi/question-diamond'
import { adminStore } from '../../../test/adminStore'
import { OpenCreationsTable } from './OpenCreationsTable'

vi.mock('../RowDetails', () => ({ RowDetails: { name: 'RowDetails' } }))
vi.mock('../ContributionMessages/ContributionMessagesList', () => ({
  ContributionMessagesList: { name: 'ContributionMessagesList' },
}))

// Keeps the values a text is built with, so a test can read what a sentence names.
const { t } = vi.hoisted(() => ({
  t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t }),
}))

describe('OpenCreationsTable', () => {
  let wrapper
  let store
  let toggles

  const moderatorUser = { gradidoID: 'moderator-gid', communityUuid: 'home' }
  const otherUser = { gradidoID: 'other-gid', communityUuid: 'home' }

  const mockItems = [
    { id: 1, contributionStatus: 'PENDING', userId: 2, moderatorId: null, messagesCount: 0 },
    { id: 2, contributionStatus: 'CONFIRMED', userId: 3, moderatorId: 1, messagesCount: 2 },
  ]

  const mockFields = [
    { key: 'contributionStatus', label: 'Status' },
    { key: 'bookmark', label: 'Bookmark' },
    { key: 'memo', label: 'Memo' },
    { key: 'editCreation', label: 'Edit' },
    { key: 'chatCreation', label: 'Chat' },
    { key: 'deny', label: 'Deny' },
    { key: 'confirm', label: 'Confirm' },
  ]

  const creationGroups = [
    { id: 1, tag: 'music', name: 'Musik' },
    { id: 2, tag: 'sports', name: null },
  ]

  // Stands in for BTableLite: renders every cell slot and the details row of every item, each
  // in an element named after its slot, with a toggleDetails per row that a test can count.
  const slotRenderingTable = {
    name: 'BTableLite',
    props: { items: { type: Array, default: () => [] }, tbodyTrClass: Function },
    render() {
      return h(
        'div',
        this.items.map((item, index) =>
          h(
            'div',
            { class: 'contribution-row' },
            Object.keys(this.$slots).map((name) =>
              h(
                'div',
                { 'data-slot': name },
                this.$slots[name]({
                  item,
                  index,
                  value: item[name.slice(5, -1)],
                  detailsShowing: false,
                  toggleDetails: toggles[index],
                }),
              ),
            ),
          ),
        ),
      )
    },
  }
  const slotRenderingRowDetails = {
    name: 'RowDetails',
    props: { row: Object, slotName: String, type: String, index: Number },
    render() {
      return h('div', this.$slots[this.slotName]?.())
    },
  }
  const slotRenderingButton = {
    name: 'BButton',
    render() {
      return h('button', this.$slots.default?.())
    },
  }
  const themedSelect = {
    name: 'ThemedSelect',
    props: { modelValue: String, options: Array },
    render() {
      return h('div', { class: 'themed-select-stub' })
    },
  }
  const modal = {
    name: 'BModal',
    props: { modelValue: Boolean },
    emits: ['hide'],
    render() {
      return h('div', { class: 'modal-stub' }, this.$slots.default?.())
    },
  }

  const mountTable = (items = mockItems, props = {}) => {
    toggles = items.map(() => vi.fn())
    return shallowMount(OpenCreationsTable, {
      props: { items, fields: mockFields, hideResubmission: false, creationGroups, ...props },
      global: {
        plugins: [store],
        stubs: {
          BTableLite: slotRenderingTable,
          RowDetails: slotRenderingRowDetails,
          BButton: slotRenderingButton,
          ThemedSelect: themedSelect,
          BModal: modal,
        },
      },
    })
  }

  const cell = (slot, row = 0) =>
    wrapper.findAll('.contribution-row')[row].find(`[data-slot="${slot}"]`)

  beforeEach(() => {
    store = adminStore({
      moderator: {
        gradidoID: 'moderator-gid',
        communityUuid: 'home',
      },
    })
    wrapper = mountTable()
  })

  it('renders the component', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'BTableLite' }).exists()).toBe(true)
  })

  it('hands the table a row class by status', () => {
    const rowClass = wrapper.findComponent({ name: 'BTableLite' }).props('tbodyTrClass')
    expect(rowClass({ contributionStatus: 'CONFIRMED' }, 'row')).toBe('table-success')
    expect(rowClass({ contributionStatus: 'DENIED' }, 'row')).toBe('table-warning')
    expect(rowClass({ contributionStatus: 'DELETED' }, 'row')).toBe('table-danger')
    expect(rowClass({ contributionStatus: 'IN_PROGRESS' }, 'row')).toBe('table-primary')
    expect(rowClass({ contributionStatus: 'PENDING' }, 'row')).toBe('table-primary')
    expect(rowClass({ contributionStatus: 'CONFIRMED' }, 'row-details')).toBeUndefined()
    expect(rowClass(null, 'row')).toBeUndefined()
  })

  it.each([
    ['cell(bookmark)', 'delete'],
    ['cell(deny)', 'deny'],
    ['cell(confirm)', 'confirm'],
  ])('emits show-overlay from the %s button', async (slot, action) => {
    await cell(slot).find('button').trigger('click')
    expect(wrapper.emitted('show-overlay')).toEqual([[mockItems[0], action]])
  })

  it('opens one details row at a time', async () => {
    await cell('cell(editCreation)', 0).find('button').trigger('click')
    expect(toggles[0]).toHaveBeenCalledTimes(1)

    // Another row: the open one closes first.
    await cell('cell(editCreation)', 1).find('button').trigger('click')
    expect(toggles[0]).toHaveBeenCalledTimes(2)
    expect(toggles[1]).toHaveBeenCalledTimes(1)

    // The same row again: only it closes.
    await cell('cell(editCreation)', 1).find('button').trigger('click')
    expect(toggles[0]).toHaveBeenCalledTimes(2)
    expect(toggles[1]).toHaveBeenCalledTimes(2)
  })

  it('offers the moderator no action on a contribution of their own', () => {
    wrapper = mountTable([
      { id: 1, contributionStatus: 'PENDING', messagesCount: 0, user: moderatorUser },
      { id: 2, contributionStatus: 'PENDING', messagesCount: 0, user: otherUser },
      { id: 3, contributionStatus: 'PENDING', messagesCount: 0, user: null },
    ])
    for (const slot of ['cell(bookmark)', 'cell(editCreation)', 'cell(deny)', 'cell(confirm)']) {
      expect(cell(slot, 0).find('button').exists(), slot).toBe(false)
      expect(cell(slot, 1).find('button').exists(), slot).toBe(true)
      expect(cell(slot, 2).find('button').exists(), slot).toBe(true)
    }
  })

  describe('what the message panel reports', () => {
    const panel = () => wrapper.findComponent({ name: 'ContributionMessagesList' })

    it('emits update-contributions', async () => {
      await panel().vm.$emit('update-contributions')
      expect(wrapper.emitted('update-contributions')).toBeTruthy()
    })

    it('emits update-status', async () => {
      await panel().vm.$emit('update-status', 1)
      expect(wrapper.emitted('update-status')).toEqual([[1]])
    })

    it('emits reload-contribution', async () => {
      await panel().vm.$emit('reload-contribution', 1)
      expect(wrapper.emitted('reload-contribution')).toEqual([[1]])
    })

    it('emits resubmission-saved', async () => {
      await panel().vm.$emit('resubmission-saved', 'unchanged')
      expect(wrapper.emitted('resubmission-saved')).toEqual([['unchanged']])
    })
  })

  // Group functions: the group is editable while a contribution is open, and a change goes
  // through a confirmation because it can hand the contribution to another moderator.
  describe('changing the group', () => {
    const item = { id: 7, contributionStatus: 'PENDING', creationGroups: [{ tag: 'music' }] }
    const select = () => wrapper.findComponent({ name: 'ThemedSelect' })
    const dialog = () => wrapper.findComponent({ name: 'BModal' })
    const pick = (tag) => select().vm.$emit('update:model-value', tag)

    beforeEach(() => {
      wrapper = mountTable([item])
    })

    it('offers the dropdown only while the contribution is open', () => {
      wrapper = mountTable(
        ['PENDING', 'IN_PROGRESS', 'CONFIRMED', 'DENIED', 'DELETED'].map((status, id) => ({
          id,
          contributionStatus: status,
          creationGroups: [],
        })),
      )
      const offered = [0, 1, 2, 3, 4].map((row) =>
        cell('cell(memo)', row).findComponent({ name: 'ThemedSelect' }).exists(),
      )
      expect(offered).toEqual([true, true, false, false, false])
    })

    it('lists "no group" plus every canonical group', () => {
      expect(select().props('options')).toEqual([
        { value: '', text: 'contribution.noGroup' },
        { value: 'music', text: 'Musik (#music)' },
        { value: 'sports', text: '#sports' },
      ])
    })

    it('asks before moving, and does not emit yet', async () => {
      await pick('sports')
      expect(dialog().props('modelValue')).toBe(true)
      expect(dialog().text()).toContain(
        `contribution.changeGroupQuestion ${JSON.stringify({ from: 'Musik (#music)', to: '#sports' })}`,
      )
      expect(wrapper.emitted('assign-group')).toBeFalsy()
    })

    // Saving replaces the whole set, so a contribution that belongs to two groups loses one
    // of them. The dropdown can only show the first, so the question has to name both --
    // otherwise the second group disappears without ever having been on screen.
    it('names every group it is about to replace, not just the first', async () => {
      wrapper = mountTable([
        {
          id: 7,
          contributionStatus: 'PENDING',
          creationGroups: [{ tag: 'music' }, { tag: 'sports' }],
        },
      ])
      await pick('')
      expect(dialog().text()).toContain(
        `contribution.changeGroupQuestion ${JSON.stringify({
          from: 'Musik (#music), #sports',
          to: 'contribution.noGroup',
        })}`,
      )
    })

    it('emits the change once confirmed', async () => {
      await pick('sports')
      await dialog().vm.$emit('hide', { trigger: 'ok' })
      expect(wrapper.emitted('assign-group')[0]).toEqual([{ contributionId: 7, tags: ['sports'] }])
      expect(dialog().props('modelValue')).toBe(false)
    })

    it('sends an empty list when moving to "no group"', async () => {
      await pick('')
      await dialog().vm.$emit('hide', { trigger: 'ok' })
      expect(wrapper.emitted('assign-group')[0]).toEqual([{ contributionId: 7, tags: [] }])
    })

    it('emits nothing when the change is cancelled', async () => {
      await pick('sports')
      await dialog().vm.$emit('hide', { trigger: 'cancel' })
      expect(wrapper.emitted('assign-group')).toBeFalsy()
      expect(dialog().props('modelValue')).toBe(false)
    })

    it('ignores picking the group the contribution already has', async () => {
      await pick('music')
      expect(dialog().props('modelValue')).toBe(false)
      expect(wrapper.emitted('assign-group')).toBeFalsy()
    })

    // The dropdown must never show a group the contribution does not have. A pick is only
    // shown while it is waiting for its answer -- every ending that is not a saved change
    // has to put it back.
    describe('what the dropdown shows', () => {
      it('shows the group of the contribution when nothing is pending', () => {
        expect(select().props('modelValue')).toBe('music')
        wrapper = mountTable([{ id: 8, contributionStatus: 'PENDING', creationGroups: [] }])
        expect(select().props('modelValue')).toBe('')
      })

      it('shows the picked group while the question is open', async () => {
        await pick('sports')
        expect(select().props('modelValue')).toBe('sports')
      })

      it.each(['cancel', 'close', 'esc', 'backdrop'])(
        'puts the old group back when the dialog ends with "%s"',
        async (trigger) => {
          await pick('sports')
          await dialog().vm.$emit('hide', { trigger })
          expect(select().props('modelValue')).toBe('music')
          expect(wrapper.emitted('assign-group')).toBeFalsy()
        },
      )

      it('carries the change out and keeps showing it when the dialog ends with "ok"', async () => {
        await pick('sports')
        await dialog().vm.$emit('hide', { trigger: 'ok' })
        expect(wrapper.emitted('assign-group')[0]).toEqual([
          { contributionId: 7, tags: ['sports'] },
        ])
        expect(select().props('modelValue')).toBe('sports')
      })

      it('puts the old group back when the backend refuses the change', async () => {
        await pick('sports')
        await dialog().vm.$emit('hide', { trigger: 'ok' })
        await wrapper.setProps({ groupChangeFailures: 1 })
        expect(select().props('modelValue')).toBe('music')
      })

      it('stops showing the pick once fresh contributions arrive', async () => {
        await pick('sports')
        await dialog().vm.$emit('hide', { trigger: 'ok' })
        await wrapper.setProps({ items: [item] })
        expect(select().props('modelValue')).toBe('music')
      })
    })
  })

  // A contribution a moderator entered on someone's behalf used to take a separate path: its
  // own button in the details column, and an edit form in the details row gated on
  // confirmedAt. The list query no longer asks for that field, so the gate never held and the
  // panel stayed empty. These tests render the two slots the automatic stub swallows.
  describe('a contribution a moderator entered for someone else', () => {
    const rowScope = (item, index) => ({
      item,
      index,
      detailsShowing: true,
      toggleDetails: () => undefined,
    })

    // Stands in for BTableLite: the automatic stub renders none of its scoped slots, so
    // neither the details button nor the details panel would exist to look at.
    const slotRenderingTable = {
      name: 'BTableLite',
      props: { items: { type: Array, default: () => [] } },
      render() {
        return h(
          'div',
          this.items.map((item, index) =>
            h('div', { class: 'contribution-row' }, [
              this.$slots['cell(editCreation)']?.(rowScope(item, index)),
              this.$slots['row-details']?.(rowScope(item, index)),
            ]),
          ),
        )
      },
    }

    // Same reason, one level down: RowDetails carries the panel in a dynamically named slot.
    const slotRenderingRowDetails = {
      name: 'RowDetails',
      props: { row: Object, slotName: String, type: String, index: Number },
      render() {
        return h('div', this.$slots[this.slotName]?.())
      },
    }

    // And once more for the button -- the message badges sit inside it.
    const slotRenderingButton = {
      name: 'BButton',
      render() {
        return h('button', this.$slots.default?.())
      },
    }

    const openItems = [
      // written by the member
      { id: 3, contributionStatus: 'PENDING', userId: 4, moderatorId: null, messagesCount: 1 },
      // entered by a moderator on that member's behalf
      { id: 4, contributionStatus: 'PENDING', userId: 5, moderatorId: 1, messagesCount: 1 },
    ]

    beforeEach(() => {
      wrapper = shallowMount(OpenCreationsTable, {
        props: { items: openItems, fields: mockFields, hideResubmission: false },
        global: {
          plugins: [store],
          stubs: {
            BTableLite: slotRenderingTable,
            RowDetails: slotRenderingRowDetails,
            BButton: slotRenderingButton,
          },
        },
      })
    })

    it('opens the same message panel as one written by the member', () => {
      expect(wrapper.findAllComponents({ name: 'ContributionMessagesList' })).toHaveLength(2)
    })

    it('carries the unanswered-message badge like any other', () => {
      expect(wrapper.findAllComponents(IBiExclamationCircleFill)).toHaveLength(2)
    })

    // The button holds an icon and nothing else, so without these a screen reader can only
    // announce "button", and hovering tells a moderator nothing either.
    it('is named for screen readers and as a tooltip', () => {
      const buttons = wrapper.findAll('button')
      expect(buttons).toHaveLength(2)
      buttons.forEach((button) => {
        expect(button.attributes('aria-label')).toBe('details')
        expect(button.attributes('title')).toBe('details')
      })
    })
  })

  // The magnifier in its own column puts the member's address into the search of the page.
  // Since 16.10.2026 it is the only way to it: the details row had the same as a funnel beside
  // the address, and Bernd let it go ("dieselbe Funktion … die Lupe").
  describe('the magnifier', () => {
    const member = (email) => ({ firstName: 'Peter', lastName: 'Lustig', emailContact: { email } })
    const items = [
      { id: 5, contributionStatus: 'PENDING', userId: 6, user: member('peter@example.org') },
      { id: 6, contributionStatus: 'PENDING', userId: 7, user: null },
    ]
    const rowScope = (item, index) => ({
      item,
      index,
      detailsShowing: true,
      toggleDetails: () => undefined,
    })
    // Renders the column of the magnifier and the details row, which the automatic stub swallows.
    const slotRenderingTable = {
      name: 'BTableLite',
      props: { items: { type: Array, default: () => [] } },
      render() {
        return h(
          'div',
          this.items.map((item, index) =>
            h('div', { class: 'contribution-row' }, [
              this.$slots['cell(searchUser)']?.(rowScope(item, index)),
              this.$slots['row-details']?.(rowScope(item, index)),
            ]),
          ),
        )
      },
    }
    const slotRenderingRowDetails = {
      name: 'RowDetails',
      props: { row: Object, slotName: String, type: String, index: Number },
      render() {
        return h('div', this.$slots[this.slotName]?.())
      },
    }
    const slotRenderingButton = {
      name: 'BButton',
      render() {
        return h('button', this.$slots.default?.())
      },
    }

    beforeEach(() => {
      wrapper = shallowMount(OpenCreationsTable, {
        props: { items, fields: mockFields, hideResubmission: false },
        global: {
          plugins: [store],
          stubs: {
            BTableLite: slotRenderingTable,
            RowDetails: slotRenderingRowDetails,
            BButton: slotRenderingButton,
          },
        },
      })
    })

    it('puts the address of the member into the search', async () => {
      const magnifiers = wrapper.findAll('button')
      // None for a contribution without a member.
      expect(magnifiers).toHaveLength(1)
      expect(magnifiers[0].attributes('title')).toBe('filter.byEmail')
      expect(magnifiers[0].attributes('aria-label')).toBe('filter.byEmail')

      await magnifiers[0].trigger('click')
      expect(wrapper.emitted('search-for-email')).toEqual([['peter@example.org']])
    })

    it('is the only way to it: the details row is handed nothing to search with', () => {
      const panels = wrapper.findAllComponents({ name: 'ContributionMessagesList' })
      expect(panels).toHaveLength(2)
      panels.forEach((panel) => expect(panel.vm.$attrs).not.toHaveProperty('onSearchForEmail'))
    })
  })

  /**
   * ⛔ The REAL table and the real buttons. What is measured is that the phone cells reach the
   * table at all -- `cell(phoneHead)` is a slot name bootstrap-vue-next gives, which a stub
   * would answer to whatever one wrote into it -- and what a moderator can press in them.
   */
  describe('the card a row becomes on a phone', () => {
    const PHONE_FIELDS = [
      { key: 'phoneHead', label: '' },
      { key: 'memo', label: 'text', class: 'text-break' },
      { key: 'phoneActions', label: '' },
    ]
    const anna = {
      firstName: 'Anna',
      lastName: 'Muster',
      alias: 'anna-m',
      gradidoID: 'g-anna',
      communityUuid: 'home',
      emailContact: { email: 'anna@example.org' },
    }
    const open = {
      id: 1,
      amount: '150',
      memo: 'Kuchenstand beim Herbstfest',
      contributionStatus: 'PENDING',
      contributionDate: '2026-09-01T00:00:00.000Z',
      createdAt: '2026-10-02T08:00:00.000Z',
      messagesCount: 0,
      user: anna,
    }
    const closed = {
      ...open,
      id: 2,
      contributionStatus: 'CONFIRMED',
      closedAt: '2026-10-05T10:00:00.000Z',
    }
    const day = (value) => new Date(value).toLocaleDateString()

    const mountCards = (items, props = {}) =>
      mount(OpenCreationsTable, {
        props: { items, fields: PHONE_FIELDS, hideResubmission: false, ...props },
        global: {
          plugins: [store],
          stubs: { ThemedSelect: themedSelect, BModal: modal },
        },
      })

    // The rows of contributions. bootstrap-vue-next 0.26.8 gives an opened details row no class
    // of its own: it is the row with one cell, and a hidden row stands before it for the stripes.
    const cardRows = () =>
      wrapper.findAll('tbody > tr').filter((tr) => tr.findAll(':scope > td').length > 1)
    const head = (row = 0) => cardRows()[row].findAll('td')[0]
    const actions = (row = 0) => cardRows()[row].find('.phone-actions')
    const named = (scope) =>
      scope
        .findAll('button')
        .map((button) => button.attributes('aria-label') || button.text().trim())

    it('the head cell shows the face, the name, the alias, the amount and the date', () => {
      wrapper = mountCards([open])
      const cells = wrapper.find('tbody > tr').findAll('td')
      expect(cells).toHaveLength(3)

      const avatar = head().findComponent(MemberAvatar)
      expect(avatar.exists()).toBe(true)
      expect(avatar.props('size')).toBe(LIST_AVATAR_SIZE)
      expect(head().text()).toContain('Anna Muster')
      expect(head().text()).toContain('anna-m')
      expect(head().text()).toContain('150 GDD')
      expect(head().text()).toContain(day(open.contributionDate))
      // The text in full width, as a cell of its own between the head and the buttons.
      expect(cells[1].text()).toContain('Kuchenstand beim Herbstfest')
      expect(cells[2].find('.phone-actions').exists()).toBe(true)
    })

    it("a closed contribution's head names when it was created and closed", () => {
      wrapper = mountCards([open, closed])
      expect(head(0).text()).not.toContain('contributions.closed')
      expect(head(1).text()).toContain(
        `createdAt ${day(closed.createdAt)} · contributions.closed ${day(closed.closedAt)}`,
      )
    })

    it('with showStatus the head carries the status symbol', () => {
      wrapper = mountCards([open, closed])
      expect(head(0).findComponent(IBiBellFill).exists()).toBe(false)

      wrapper = mountCards([open, closed], { showStatus: true })
      expect(head(0).findComponent(IBiBellFill).exists()).toBe(true)
      expect(head(1).findComponent(IBiCheck).exists()).toBe(true)
    })

    it('the action cell offers details, the filter and, for an open contribution, delete, deny and confirm, each with its name', () => {
      wrapper = mountCards([open])
      expect(named(actions())).toEqual([
        'details',
        'filter.byEmail',
        'delete',
        'deny',
        'contribution.confirm',
      ])
      // The two that are a symbol and nothing else carry their name as a tooltip as well.
      for (const button of actions().findAll('.phone-icon-btn')) {
        expect(button.attributes('title')).toBe(button.attributes('aria-label'))
      }
    })

    // At 320px "Ablehnen" and "Bestätigen" with their symbols find no room beside the bin in
    // most languages. They keep together, at the right, and take the next line as a pair --
    // jsdom lays nothing out, so what is held here is the grouping that lets them.
    it('keeps the two words of a decision together, apart from the bin', () => {
      wrapper = mountCards([open])
      const bin = actions().find('.btn-danger')
      const deny = actions().find('.btn-warning')
      const confirm = actions().find('.btn-success')
      expect(deny.element.parentElement).toBe(confirm.element.parentElement)
      expect(bin.element.parentElement).not.toBe(deny.element.parentElement)
      expect([...deny.element.parentElement.classList]).toEqual(
        expect.arrayContaining(['d-flex', 'flex-wrap', 'ms-auto']),
      )
      expect([...bin.element.parentElement.classList]).toContain('flex-wrap')
    })

    it('offers Crea only where the tab offers it to this moderator', () => {
      wrapper = mountCards([open])
      expect(actions().find('img[alt="crea.column"]').exists()).toBe(false)

      wrapper = mountCards([open], { showCrea: true })
      expect(actions().find('img[alt="crea.column"]').exists()).toBe(true)

      // The "all" tab offers it on open contributions only, as at the desk.
      wrapper = mountCards([open, closed], { showCrea: true, creaOpenOnly: true })
      expect(actions(0).find('img[alt="crea.column"]').exists()).toBe(true)
      expect(actions(1).find('img[alt="crea.column"]').exists()).toBe(false)
    })

    it('a closed contribution offers details and the filter only', () => {
      wrapper = mountCards([closed])
      expect(named(actions())).toEqual(['details', 'filter.byEmail'])
    })

    // As the desk's tab "Offen" does: no decision and no details on the moderator's own open
    // contribution. A closed one shows its details, as the desk's other tabs do.
    it("the moderator's own open contribution offers neither a decision nor its details", () => {
      const own = { ...anna, gradidoID: 'moderator-gid' }
      wrapper = mountCards([
        { ...open, user: own },
        { ...open, id: 3, contributionStatus: 'IN_PROGRESS', user: own },
        { ...closed, user: own },
      ])
      expect(named(actions(0))).toEqual(['filter.byEmail'])
      expect(named(actions(1))).toEqual(['filter.byEmail'])
      expect(named(actions(2))).toEqual(['details', 'filter.byEmail'])
    })

    it('the details button carries the hints of the desk', () => {
      wrapper = mountCards([
        { ...open, messagesCount: 2 },
        { ...open, id: 3, contributionStatus: 'IN_PROGRESS', messagesCount: 1 },
        { ...open, id: 4, messagesCount: 0 },
      ])
      const details = (row) => actions(row).find('button')
      expect(details(0).findComponent(IBiExclamationCircleFill).classes()).toContain('text-warning')
      expect(details(1).findComponent(IBiQuestionDiamond).classes()).toContain('text-warning')
      expect(details(2).find('svg + svg').exists()).toBe(false)
    })

    it('the phone buttons emit what the desk cells emit', async () => {
      wrapper = mountCards([open], { showCrea: true })
      const button = (name) =>
        actions()
          .findAll('button')
          .find((b) => (b.attributes('aria-label') || b.text().trim()) === name)

      await button('contribution.confirm').trigger('click')
      await button('deny').trigger('click')
      await button('delete').trigger('click')
      expect(wrapper.emitted('show-overlay')).toEqual([
        [open, 'confirm'],
        [open, 'deny'],
        [open, 'delete'],
      ])

      await button('filter.byEmail').trigger('click')
      expect(wrapper.emitted('search-for-email')).toEqual([['anna@example.org']])

      await actions().find('img[alt="crea.column"]').trigger('click')
      expect(wrapper.emitted('crea-evaluate')).toEqual([[open]])

      // Details opens the row, as the button of the desk does.
      expect(wrapper.findComponent({ name: 'RowDetails' }).exists()).toBe(false)
      await button('details').trigger('click')
      expect(wrapper.findComponent({ name: 'RowDetails' }).exists()).toBe(true)
    })

    // The desk's open tab, drawn by the same real table: every column still draws what it drew,
    // and nothing of the card reaches it.
    it('the desk cells render as before', () => {
      const deskFields = [
        { key: 'bookmark', label: 'delete' },
        { key: 'deny', label: 'deny' },
        { key: 'searchUser', label: '' },
        { key: 'name', label: 'name' },
        { key: 'amount', label: 'creation', formatter: (value) => `${value} GDD` },
        { key: 'memo', label: 'text' },
        { key: 'contributionDate', label: 'created', formatter: day },
        { key: 'creaEvaluate', label: 'crea.column' },
        { key: 'editCreation', label: 'details' },
        { key: 'confirm', label: 'save' },
      ]
      wrapper = mount(OpenCreationsTable, {
        props: { items: [open], fields: deskFields, hideResubmission: false },
        global: { plugins: [store], stubs: { ThemedSelect: themedSelect, BModal: modal } },
      })
      const cells = wrapper.find('tbody > tr').findAll('td')
      expect(cells.map((cell) => named(cell))).toEqual([
        ['delete'],
        ['deny'],
        ['filter.byEmail'],
        [],
        [],
        [],
        [],
        [''],
        ['details'],
        ['save'],
      ])
      // Two spaces: the name, a space before the alias, and the space inside its <small>.
      expect(cells[3].text()).toBe('Anna Muster  anna-m')
      expect(cells[4].find('div').text()).toBe('150 GDD')
      expect(cells[4].findComponent(MemberAvatar).exists()).toBe(true)
      expect(cells[6].text()).toBe(day(open.contributionDate))
      expect(wrapper.find('.phone-actions').exists()).toBe(false)
    })
  })
})
