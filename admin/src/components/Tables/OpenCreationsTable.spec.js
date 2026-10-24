import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount, shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { MemberAvatar } from '@/components/MemberAvatar'
import { LIST_AVATAR_SIZE } from '@/constants'
import IBiArrowDownCircle from '~icons/bi/arrow-down-circle'
import IBiArrowUpCircle from '~icons/bi/arrow-up-circle'
import IBiBellFill from '~icons/bi/bell-fill'
import IBiChatDots from '~icons/bi/chat-dots'
import IBiCheck from '~icons/bi/check'
import IBiExclamationCircleFill from '~icons/bi/exclamation-circle-fill'
import IBiPencilFill from '~icons/bi/pencil-fill'
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
    {
      id: 2,
      contributionStatus: 'CONFIRMED',
      userId: 3,
      moderatorId: 1,
      messagesCount: 2,
      lastMessageType: 'DIALOG',
      lastMessageByModerator: true,
    },
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
    // The button as it stands before a press, the panel as it opens: since 24.10.2026 an open
    // row's button shows the arrow turned up and is named for closing.
    const rowScope = (item, index, detailsShowing = true) => ({
      item,
      index,
      detailsShowing,
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
              this.$slots['cell(editCreation)']?.(rowScope(item, index, false)),
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

    // Each with the member's answer as the last word of its conversation.
    const answered = { messagesCount: 1, lastMessageType: 'DIALOG', lastMessageByModerator: false }
    const openItems = [
      // written by the member
      { id: 3, contributionStatus: 'PENDING', userId: 4, moderatorId: null, ...answered },
      // entered by a moderator on that member's behalf
      { id: 4, contributionStatus: 'PENDING', userId: 5, moderatorId: 1, ...answered },
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
        expect(button.attributes('aria-label')).toBe('details – contribution.detailsState.answer')
        expect(button.attributes('title')).toBe('details – contribution.detailsState.answer')
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
      { key: 'phoneMemo', label: '', class: 'text-break' },
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
    const filter = (row = 0) => head(row).find('.phone-search button')
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

    // Bernd, 24.10.2026: the magnifier finds this member's contributions, so it stands under the
    // face; the group starts flush with the name. A grid of two columns (OpenCreationsTable.css)
    // puts its four parts in this order: face, name, filter, group.
    it('the head puts the filter under the face and the group under the name', () => {
      wrapper = mountCards([open, closed])
      const parts = head(0)
        .findAll('.phone-head > div')
        .map((part) => part.classes()[0] ?? 'name')
      expect(parts).toEqual(['phone-face', 'name', 'phone-search', 'phone-group'])
      expect(head(0).find('.phone-face').findComponent(MemberAvatar).exists()).toBe(true)
      expect(filter(0).attributes('aria-label')).toBe('filter.byEmail')
      expect(filter(0).attributes('title')).toBe('filter.byEmail')
      // An open contribution's group can still be changed there, a closed one's is named.
      expect(head(0).find('.phone-group .group-select').exists()).toBe(true)
      expect(head(1).find('.phone-group .group-select').exists()).toBe(false)
      expect(head(1).find('.phone-group').text()).toBe('contribution.noGroup')
      // The text cell holds the text alone now.
      expect(cardRows()[0].findAll('td')[1].find('.group-select').exists()).toBe(false)
    })

    it('a member without an address gets no filter, and the group keeps its place', () => {
      wrapper = mountCards([{ ...open, user: { ...anna, emailContact: null } }])
      expect(filter().exists()).toBe(false)
      expect(head().find('.phone-search').exists()).toBe(true)
      expect(head().find('.phone-group .group-select').exists()).toBe(true)
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

    // Bernd, 24.10.2026: no words on the buttons, so all of them fit in one row. Each is a square
    // symbol named as a tooltip and for a screen reader.
    it('the action cell offers, for an open contribution, delete, deny, details and confirm, symbols with their names', () => {
      wrapper = mountCards([open], { showCrea: true })
      expect(named(actions())).toEqual(['delete', 'deny', '', 'details', 'contribution.confirm'])
      const buttons = actions().findAll('button')
      for (const button of buttons) {
        expect(button.classes()).toContain('phone-icon-btn')
        expect(button.text().trim()).toBe('')
      }
      // Crea is named by its picture, the others by their label.
      expect(actions().find('img[alt="crea.column"]').exists()).toBe(true)
      for (const button of buttons.filter((b) => b.attributes('aria-label'))) {
        expect(button.attributes('title')).toBe(button.attributes('aria-label'))
      }
    })

    // One row: what takes an open contribution off the list at the left, the bin and the denial
    // together; Crea, the details and the confirmation at the right, the confirmation last.
    // jsdom lays nothing out, so what is held here is the grouping.
    it('one row: bin and denial at the left, Crea, details and confirmation at the right', () => {
      wrapper = mountCards([open], { showCrea: true })
      const row = actions().element
      const bin = actions().find('.btn-danger').element
      const deny = actions().find('.btn-warning').element
      const confirm = actions().find('.btn-success').element
      expect(bin.parentElement).toBe(row)
      expect(deny.parentElement).toBe(row)
      expect(bin.nextElementSibling).toBe(deny)
      const right = confirm.parentElement
      expect(right.parentElement).toBe(row)
      expect([...right.classList]).toContain('ms-auto')
      expect([...right.children].map((b) => b.getAttribute('aria-label') || 'crea')).toEqual([
        'crea',
        'details',
        'contribution.confirm',
      ])
      // No second row, nothing that breaks the row.
      expect([...row.classList]).not.toContain('flex-wrap')
      expect([...right.classList]).not.toContain('flex-wrap')
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

    it('a closed contribution offers its details only, beside Crea where the tab offers it', () => {
      wrapper = mountCards([closed])
      expect(named(actions())).toEqual(['details'])
      expect(filter().exists()).toBe(true)
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
      expect(named(actions(0))).toEqual([])
      expect(named(actions(1))).toEqual([])
      expect(named(actions(2))).toEqual(['details'])
      // The filter in the head stays for every one of them.
      expect([0, 1, 2].every((row) => filter(row).exists())).toBe(true)
    })

    // Bernd, 24.10.2026: one symbol for what is going on, where the button held a bubble and a
    // hint. The server tells whose word is the last and of which kind (lastMessageType,
    // lastMessageByModerator), so an answer and a change of the contribution look different.
    describe('the details button shows one symbol for what is going on', () => {
      const conversation = (lastMessageType, lastMessageByModerator) => ({
        messagesCount: 2,
        lastMessageType,
        lastMessageByModerator,
      })
      const STATES = [
        [
          'the member answered',
          { ...open, ...conversation('DIALOG', false) },
          IBiExclamationCircleFill,
        ],
        ['the member changed it', { ...open, ...conversation('HISTORY', false) }, IBiPencilFill],
        [
          'a question waits for the member',
          { ...open, contributionStatus: 'IN_PROGRESS', ...conversation('DIALOG', true) },
          IBiQuestionDiamond,
        ],
        [
          'a moderator had the last word',
          { ...open, ...conversation('HISTORY', true) },
          IBiChatDots,
        ],
        // coderabbit, #4193: the moderators' internal notes are counted, but they are no
        // conversation with the member.
        [
          'only internal notes',
          { ...open, messagesCount: 1, lastMessageType: null, lastMessageByModerator: null },
          IBiArrowDownCircle,
        ],
        // A moderator's question makes a contribution IN_PROGRESS and nothing else does; the page
        // sets that at once, before the list knows the question.
        [
          'a question just sent',
          { ...open, contributionStatus: 'IN_PROGRESS', messagesCount: 1 },
          IBiQuestionDiamond,
        ],
        ['no conversation', { ...open }, IBiArrowDownCircle],
        [
          'closed, with a conversation',
          { ...closed, ...conversation('DIALOG', true) },
          IBiChatDots,
        ],
        ['closed, without one', { ...closed }, IBiArrowDownCircle],
      ]
      const details = (row) =>
        actions(row)
          .findAll('button')
          .find((b) => b.attributes('aria-expanded') !== undefined)
      // Its name says what the symbol shows, where that is more than the way into the row
      // (coderabbit, #4193): for a screen reader, and as a tooltip.
      const NAMES = new Map([
        [IBiExclamationCircleFill, 'details – contribution.detailsState.answer'],
        [IBiPencilFill, 'details – contribution.detailsState.changed'],
        [IBiQuestionDiamond, 'details – contribution.detailsState.question'],
        [IBiChatDots, 'details – contribution.detailsState.conversation'],
        [IBiArrowDownCircle, 'details'],
      ])

      it.each(STATES)('%s', (_, item, icon) => {
        wrapper = mountCards([{ ...item, id: 9 }])
        expect(details(0).findAll('svg')).toHaveLength(1)
        expect(details(0).findComponent(icon).exists()).toBe(true)
        expect(details(0).attributes('aria-label')).toBe(NAMES.get(icon))
        expect(details(0).attributes('title')).toBe(NAMES.get(icon))
        // The three that ask for a moderator's eye stand out.
        const waiting = [IBiExclamationCircleFill, IBiPencilFill, IBiQuestionDiamond].includes(icon)
        expect(details(0).findComponent(icon).classes().includes('text-warning')).toBe(waiting)
      })

      // A copy: the table keeps "open" on the item itself (`_showDetails`), which would carry
      // over to every later test of the same object.
      it('turns its arrow up while the details are open', async () => {
        wrapper = mountCards([{ ...open }])
        expect(details(0).attributes('aria-expanded')).toBe('false')
        await details(0).trigger('click')
        expect(details(0).findComponent(IBiArrowUpCircle).exists()).toBe(true)
        expect(details(0).attributes('aria-expanded')).toBe('true')
      })

      // Bernd, 24.10.2026: whatever the closed button showed, the open row's button shows the
      // arrow turned up and is named for closing -- the card's own "hide details" went.
      it.each(STATES)('%s: open, the arrow up, named for closing', async (_, item) => {
        wrapper = mountCards([{ ...item, id: 9 }])
        await details(0).trigger('click')
        expect(details(0).findAll('svg')).toHaveLength(1)
        expect(details(0).findComponent(IBiArrowUpCircle).exists()).toBe(true)
        expect(details(0).attributes('aria-label')).toBe('hide_details')
        expect(details(0).attributes('title')).toBe('hide_details')
        expect(wrapper.text()).not.toContain('hide_details')
      })

      // The desk's open tab shows the same symbol in its details column.
      it('at the desk the same', () => {
        for (const [, item, icon] of STATES.filter(
          ([, item]) => item.contributionStatus !== 'CONFIRMED',
        )) {
          wrapper = mount(OpenCreationsTable, {
            props: {
              items: [{ ...item, id: 9 }],
              fields: [{ key: 'editCreation', label: 'details' }],
              hideResubmission: false,
            },
            global: { plugins: [store], stubs: { ThemedSelect: themedSelect, BModal: modal } },
          })
          const button = wrapper.find('tbody > tr button')
          expect(button.attributes('aria-label')).toBe(NAMES.get(icon))
          expect(button.attributes('title')).toBe(NAMES.get(icon))
          expect(button.findAll('svg')).toHaveLength(1)
          expect(button.findComponent(icon).exists()).toBe(true)
        }
      })

      // Open, the desk's buttons show the arrow turned up too: the open tab's and the closed
      // tabs', with a conversation or without.
      it('at the desk, open, the arrow up as well', async () => {
        for (const [key, item] of [
          ['editCreation', { ...open, ...conversation('DIALOG', false), id: 9 }],
          ['chatCreation', { ...closed, ...conversation('DIALOG', true), id: 10 }],
          ['chatCreation', { ...closed, id: 11 }],
        ]) {
          wrapper = mount(OpenCreationsTable, {
            props: { items: [item], fields: [{ key, label: 'details' }], hideResubmission: false },
            global: { plugins: [store], stubs: { ThemedSelect: themedSelect, BModal: modal } },
          })
          await wrapper.find('tbody > tr button').trigger('click')
          const button = wrapper.find('tbody > tr button')
          expect(button.findComponent(IBiArrowUpCircle).exists(), key).toBe(true)
          expect(button.attributes('aria-label'), key).toBe('hide_details')
          expect(button.attributes('aria-expanded'), key).toBe('true')
        }
      })

      // A closed tab's row without a conversation: the same button as the others, named and in
      // reach of the keyboard, the arrow down while closed (it was a bare arrow; coderabbit, #4194).
      it('at the desk, a closed row without a conversation has the button too', () => {
        wrapper = mount(OpenCreationsTable, {
          props: {
            items: [{ ...closed, id: 12 }],
            fields: [{ key: 'chatCreation', label: 'details' }],
            hideResubmission: false,
          },
          global: { plugins: [store], stubs: { ThemedSelect: themedSelect, BModal: modal } },
        })
        const button = wrapper.find('tbody > tr button')
        expect(button.exists()).toBe(true)
        expect(button.findAll('svg')).toHaveLength(1)
        expect(button.findComponent(IBiArrowDownCircle).exists()).toBe(true)
        expect(button.attributes('aria-label')).toBe('details')
        expect(button.attributes('aria-expanded')).toBe('false')
      })
    })

    it('the phone buttons emit what the desk cells emit', async () => {
      // A copy: opening the row marks the item itself (`_showDetails`).
      wrapper = mountCards([{ ...open }], { showCrea: true })
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

      await filter().trigger('click')
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

// The Crea button of a row: its own rule takes Bootstrap's focus ring away (it only tints), so a
// ring of its own shows a keyboard where it stands. Vitest hands stylesheets to the tests as empty
// strings: the sheet itself is read, comments taken out first.
describe('the stylesheet of the contribution rows', () => {
  it('gives the Crea button a ring at keyboard focus', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const css = readFileSync(join(here, 'OpenCreationsTable.css'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
    expect(css).toContain('.btn.crea-logo-btn:focus-visible { outline: 2px solid currentcolor; }')
  })
})
