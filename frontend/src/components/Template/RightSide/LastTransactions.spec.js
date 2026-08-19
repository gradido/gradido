import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import LastTransactions from './LastTransactions'
import { forgetAllMemberAvatars, rememberMemberAvatars } from '@/composables/useMemberAvatars'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    d: (date) => date,
  }),
}))

vi.mock('vue-avatar', () => ({
  default: {
    name: 'Avatar',
    template: '<div class="avatar"></div>',
  },
}))

vi.mock('@/components/TransactionRows/Name', () => ({
  default: {
    name: 'Name',
    template: '<div class="name"></div>',
  },
}))

describe('LastTransactions', () => {
  let wrapper

  const createWrapper = (props = {}) => {
    return mount(LastTransactions, {
      props,
      global: {
        stubs: {
          BRow: true,
          BCol: true,
        },
      },
    })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('renders the component div.rightside-last-transactions', () => {
      expect(wrapper.find('div.rightside-last-transactions').exists()).toBe(true)
    })
  })

  it('renders the correct number of transactions', async () => {
    const transactions = [
      {
        id: 1,
        typeId: 'TRANSFER',
        linkedUser: { firstName: 'John', lastName: 'Doe' },
        amount: 100,
        balanceDate: '2023-01-01',
      },
      {
        id: 2,
        typeId: 'TRANSFER',
        linkedUser: { firstName: 'Jane', lastName: 'Smith' },
        amount: 200,
        balanceDate: '2023-01-02',
      },
    ]
    wrapper = createWrapper({ transactions })
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.mb-4').length).toBe(2)
  })

  it('does not render DECAY, LINK_SUMMARY, or CREATION transactions', async () => {
    const transactions = [
      {
        id: 1,
        typeId: 'TRANSFER',
        linkedUser: { firstName: 'John', lastName: 'Doe' },
        amount: 100,
        balanceDate: '2023-01-01',
      },
      {
        id: 2,
        typeId: 'DECAY',
        linkedUser: { firstName: 'Jane', lastName: 'Smith' },
        amount: 200,
        balanceDate: '2023-01-02',
      },
      {
        id: 3,
        typeId: 'LINK_SUMMARY',
        linkedUser: { firstName: 'Bob', lastName: 'Johnson' },
        amount: 300,
        balanceDate: '2023-01-03',
      },
      {
        id: 4,
        typeId: 'CREATION',
        linkedUser: { firstName: 'Alice', lastName: 'Brown' },
        amount: 400,
        balanceDate: '2023-01-04',
      },
    ]
    wrapper = createWrapper({ transactions })
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.mb-4').length).toBe(1)
  })

  /**
   * The most prominent avatar in the wallet, and the one carrying decision AS-008.
   *
   * ⛔ Written because nothing measured either half: the size was a decision nobody could
   * see in a test, and the letters-from-alias rule is passed by this call site rather than
   * enforced by the component it calls.
   */
  describe('the avatar beside each booking', () => {
    const NAPOLI = {
      id: 3,
      amount: '-12.5',
      linkedUser: { firstName: 'Pizzeria', lastName: 'Napoli', alias: 'napoli' },
    }
    // Own mount: the shared helper stubs BRow/BCol with `true`, and such a stub does not
    // render what is inside it -- the avatar would never exist to be asked about.
    const mountRows = (transactions) =>
      mount(LastTransactions, {
        props: { transactions },
        global: {
          mocks: {
            $t: (key) => key,
            $d: (date) => String(date),
            $filters: { GDD: (amount) => String(amount) },
          },
          stubs: {
            BRow: { template: '<div><slot /></div>' },
            BCol: { template: '<div><slot /></div>' },
          },
        },
      })
    const avatar = () => wrapper.findComponent({ name: 'AppAvatar' })

    beforeEach(() => {
      forgetAllMemberAvatars()
    })

    // 64, not 72: the stored picture is 128 across, and 72 points on a 2x screen asks for
    // 144 -- more than exists, so it was visibly soft exactly where it is largest (AS-008).
    it('is 64 points, which is what the stored picture actually covers', () => {
      wrapper = mountRows([NAPOLI])
      expect(avatar().props().size).toBe(64)
    })

    it('shows the alias letters and keeps the colour on the real initials', () => {
      wrapper = mountRows([NAPOLI])
      expect(avatar().props().initials).toBe('NA')
      expect(avatar().props().colorSeed).toBe('PN')
    })

    it('shows a picture the wallet holds, and nothing while it holds none', () => {
      wrapper = mountRows([NAPOLI])
      expect(avatar().props().src).toBe('')

      rememberMemberAvatars([
        {
          gradidoID: 'g-napoli',
          communityUuid: null,
          avatar: 'the-picture',
          avatarUpdatedAt: '2026-08-19T09:00:00.000Z',
        },
      ])
      wrapper = mountRows([
        {
          ...NAPOLI,
          linkedUser: {
            ...NAPOLI.linkedUser,
            gradidoID: 'g-napoli',
            avatarUpdatedAt: '2026-08-19T09:00:00.000Z',
          },
        },
      ])
      expect(avatar().props().src).toBe('data:image/jpeg;base64,the-picture')
    })
  })
})
