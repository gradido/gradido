// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach, vi } from 'vitest'
import ChatGroupPicker from './ChatGroupPicker.vue'
import { LIST_AVATAR_SIZE } from '@/constants'

vi.mock('@/i18n', () => ({
  default: { global: { t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key) } },
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key),
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
const LENA = {
  ...contact('lena-id', 'Lena-Mond'),
  user: {
    ...contact('lena-id', 'Lena-Mond').user,
    communityUuid: 'wien-uuid',
    communityName: 'Gradido Wien',
  },
  homeCommunity: false,
}

describe('ChatGroupPicker', () => {
  let wrapper

  const mountPicker = (props = {}) => {
    wrapper = mount(ChatGroupPicker, {
      props: {
        contacts: [ANNA, CARLA, LENA],
        modelValue: [],
        'onUpdate:modelValue': (value) => wrapper.setProps({ modelValue: value }),
        ...props,
      },
    })
    return wrapper
  }

  const pick = (id) => wrapper.find(`[data-test="chat-group-pick-${id}"]`)
  const names = () =>
    wrapper
      .findAll('[data-test="chat-group-picker-list"] .chat-group-pick-name')
      .map((n) => n.text())

  afterEach(() => wrapper?.unmount())

  it("offers the member's contacts, each with a face at the size of every list", () => {
    mountPicker()
    expect(names()).toEqual(['Anna-Sonne', 'Carla-Sonne', 'Lena-Mond'])
    const face = pick('anna-id').find('.app-avatar')
    expect(face.attributes('style')).toContain(`width: ${LIST_AVATAR_SIZE}px`)
    // ⛔ Not zoomable inside the row's label: it would swallow the tap meant for the box.
    expect(face.element.tagName).toBe('DIV')
  })

  it('ticks and unticks by a tap, in the order they were ticked', async () => {
    mountPicker()
    await pick('carla-id').find('input').setValue(true)
    await pick('anna-id').find('input').setValue(true)
    expect(wrapper.props('modelValue').map((user) => user.gradidoID)).toEqual([
      'carla-id',
      'anna-id',
    ])
    await pick('carla-id').find('input').setValue(false)
    expect(wrapper.props('modelValue').map((user) => user.gradidoID)).toEqual(['anna-id'])
  })

  it('shows the chosen ones over the list', async () => {
    mountPicker({ modelValue: [CARLA.user] })
    const chips = wrapper.findAll('[data-test="chat-group-picker-chips"] li')
    expect(chips.map((chip) => chip.text())).toEqual(['CACarla-Sonne'])
  })

  // E-050 F2: another community's members come with P6 -- there, greyed, not to be chosen.
  it("shows another community's contact greyed, with the reason, and not to be chosen", () => {
    mountPicker()
    const row = pick('lena-id')
    expect(row.classes()).toContain('is-off')
    expect(row.find('input').attributes('disabled')).toBeDefined()
    expect(row.find('.chat-group-pick-sub').text()).toBe(
      'chatGroup.pickLater {"community":"Gradido Wien"}',
    )
    expect(pick('anna-id').find('.chat-group-pick-sub').text()).toBe('KI Playground')
  })

  // Those in the group already are not offered -- by the pair, without regard to case.
  it('leaves out who is in the group already', () => {
    mountPicker({ excluded: [{ ...ANNA.user, gradidoID: 'ANNA-ID' }] })
    expect(names()).toEqual(['Carla-Sonne', 'Lena-Mond'])
  })

  it('narrows the list as one types', async () => {
    mountPicker()
    await wrapper.find('[data-test="chat-group-picker-search"]').setValue('CARLA')
    expect(names()).toEqual(['Carla-Sonne'])
    await wrapper.find('[data-test="chat-group-picker-search"]').setValue('zzz')
    expect(wrapper.find('[data-test="chat-group-picker-none"]').text()).toBe(
      'chatGroup.pickNoMatch',
    )
  })

  it('says so where the member has no contact yet', () => {
    mountPicker({ contacts: [] })
    expect(wrapper.find('[data-test="chat-group-picker-none"]').text()).toBe(
      'chatGroup.pickNoContacts',
    )
  })
})
