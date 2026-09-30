// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import ChatGroupPicker from './ChatGroupPicker.vue'

/**
 * The picker where a message is forwarded (E-059): the member's groups as a list of their own over
 * the contacts, and at most so many chosen together (F3). ChatGroupPicker.spec.js holds the picker
 * as a group's members see it -- without groups, without a limit.
 */
vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) =>
      values === undefined
        ? key
        : `${key} ${typeof values === 'number' ? values : JSON.stringify(values)}`,
    d: (date, format) => `${format}(${date.toISOString()})`,
  }),
}))

const contact = (gradidoID, alias, extra = {}) => ({
  user: {
    communityUuid: 'home-uuid',
    communityName: 'KI Playground',
    gradidoID,
    alias,
    avatarColorIndex: 2,
    avatarUpdatedAt: null,
  },
  homeCommunity: true,
  ...extra,
})
const ANNA = contact('anna-id', 'Anna-Sonne')
const CARLA = contact('carla-id', 'Carla-Sonne')
const OMA = contact('oma-id', 'Oma-Emma')
const group = (n, title, extra = {}) => ({
  groupUuid: `group-${n}`,
  title,
  memberCount: 6,
  lastMessageAt: null,
  ...extra,
})
const CAFE = group(1, 'Gradido-Café Berlin', { lastMessageAt: '2026-09-29T09:00:00.000Z' })
const GARDEN = group(2, 'Gemeinschaftsgarten Pankow')

describe('ChatGroupPicker with groups and a limit (E-059)', () => {
  let wrapper

  const mountPicker = (props = {}) => {
    wrapper = mount(ChatGroupPicker, {
      props: {
        contacts: [ANNA, CARLA, OMA],
        groups: [CAFE, GARDEN],
        modelValue: [],
        chosenGroups: [],
        'onUpdate:modelValue': (value) => wrapper.setProps({ modelValue: value }),
        'onUpdate:chosenGroups': (value) => wrapper.setProps({ chosenGroups: value }),
        ...props,
      },
    })
    return wrapper
  }

  const group = (uuid) => wrapper.find(`[data-test="chat-group-pick-group-${uuid}"]`)
  const person = (id) => wrapper.find(`[data-test="chat-group-pick-${id}"]`)
  const groupNames = () =>
    wrapper
      .findAll('[data-test="chat-group-picker-groups"] .chat-group-pick-name')
      .map((n) => n.text())
  const contactNames = () =>
    wrapper
      .findAll('[data-test="chat-group-picker-list"] .chat-group-pick-name')
      .map((n) => n.text())

  afterEach(() => wrapper?.unmount())

  it('offers the groups in a list of their own over the contacts, each with its square and its line', () => {
    mountPicker()
    expect(wrapper.find('[data-test="chat-group-picker-groups-head"]').text()).toBe(
      'chatGroup.pickGroups',
    )
    expect(wrapper.find('[data-test="chat-group-picker-contacts-head"]').text()).toBe(
      'chatGroup.pickContacts',
    )
    expect(groupNames()).toEqual(['Gradido-Café Berlin', 'Gemeinschaftsgarten Pankow'])
    expect(contactNames()).toEqual(['Anna-Sonne', 'Carla-Sonne', 'Oma-Emma'])
    expect(group('group-1').find('.chat-group-pick-sub').text()).toBe(
      'chatGroup.memberCount 6 · contacts.last {"date":"short(2026-09-29T09:00:00.000Z)"}',
    )
    // The square of a group, not the circle of a person.
    expect(group('group-1').find('.app-avatar').classes()).not.toContain('rounded-circle')
  })

  it("shows neither list heading where no groups are handed in, as for a group's members", () => {
    mountPicker({ groups: [] })
    expect(wrapper.find('[data-test="chat-group-picker-groups-head"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="chat-group-picker-contacts-head"]').exists()).toBe(false)
  })

  it('hands out the groups chosen by their uuids, in the order they were ticked, and shows them among the chosen', async () => {
    mountPicker()
    await group('group-2').find('input').setValue(true)
    await group('group-1').find('input').setValue(true)
    expect(wrapper.props('chosenGroups')).toEqual(['group-2', 'group-1'])
    expect(
      wrapper
        .findAll('[data-test="chat-group-picker-chips"] li')
        .map((chip) => chip.findAll('span').at(-1).text()),
    ).toEqual(['Gemeinschaftsgarten Pankow', 'Gradido-Café Berlin'])

    await group('group-2').find('input').setValue(false)
    expect(wrapper.props('chosenGroups')).toEqual(['group-1'])
  })

  it('narrows the groups by their names as well', async () => {
    mountPicker()
    await wrapper.find('[data-test="chat-group-picker-search"]').setValue('café')
    expect(groupNames()).toEqual(['Gradido-Café Berlin'])
    await wrapper.find('[data-test="chat-group-picker-search"]').setValue('kuchen')
    expect(wrapper.find('[data-test="chat-group-picker-groups-none"]').text()).toBe(
      'chatGroup.pickNoGroupMatch',
    )
  })

  // E-059 F3: five at most -- groups and contacts together.
  it('lets the others wait once as many as may be are chosen, and says why', async () => {
    mountPicker({ max: 3, modelValue: [ANNA.user], chosenGroups: ['group-1'] })
    expect(wrapper.find('[data-test="chat-group-picker-full"]').exists()).toBe(false)

    await person('carla-id').find('input').setValue(true)

    expect(wrapper.find('[data-test="chat-group-picker-full"]').text()).toBe(
      'chatGroup.pickMax {"max":3}',
    )
    expect(person('oma-id').find('input').element.disabled).toBe(true)
    expect(person('oma-id').classes()).toContain('is-off')
    expect(group('group-2').find('input').element.disabled).toBe(true)
    // The chosen ones stay free to be taken out.
    expect(person('carla-id').find('input').element.disabled).toBe(false)
    expect(group('group-1').find('input').element.disabled).toBe(false)

    await group('group-1').find('input').setValue(false)
    expect(wrapper.find('[data-test="chat-group-picker-full"]').exists()).toBe(false)
    expect(person('oma-id').find('input').element.disabled).toBe(false)
  })

  it('takes nobody past the limit, whatever the box says', async () => {
    mountPicker({ max: 1, modelValue: [ANNA.user] })
    await person('carla-id').find('input').trigger('change')
    await group('group-1').find('input').trigger('change')
    expect(wrapper.props('modelValue')).toEqual([ANNA.user])
    expect(wrapper.props('chosenGroups')).toEqual([])
  })

  it('says what the page asks where it is not a group being filled', () => {
    mountPicker({
      contacts: [],
      label: 'An wen?',
      placeholder: 'Suchen …',
      noContactsText: 'Keine',
    })
    expect(wrapper.find('label.form-label').text()).toBe('An wen?')
    expect(wrapper.find('[data-test="chat-group-picker-search"]').attributes('placeholder')).toBe(
      'Suchen …',
    )
    expect(wrapper.find('[data-test="chat-group-picker-none"]').text()).toBe('Keine')
  })
})
