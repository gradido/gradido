// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { BButton, BCol, BRow } from 'bootstrap-vue-next'
import i18n from '@/i18n'
import RedeemCommunitySelection from './RedeemCommunitySelection.vue'

/**
 * The choice of community on the redeem page as it was. Its way to another community moved
 * into `useRedeemCommunity`, which the thank-you view uses as well; this holds that the block
 * still asks for the same token and still sends the browser to the same address through it.
 */
const apollo = vi.hoisted(() => ({ createRedeemJwt: null }))

vi.mock('@vue/apollo-composable', async () => {
  const { createRedeemJwtMutation } = await import('@/graphql/mutations')
  return {
    useMutation: (document) => {
      if (document !== createRedeemJwtMutation)
        throw new Error('a mutation this test does not know')
      return { mutate: (...args) => apollo.createRedeemJwt(...args) }
    },
  }
})

vi.mock('@/config', () => ({
  default: {
    COMMUNITY_NAME: 'KI Playground',
    COMMUNITY_URL: 'https://ki-playground.gradido.net',
  },
}))

const CODE = 'c0ffee1234567890abcdef12'
const SENDER = '76378cbb-5a5c-4e4b-9a3b-1f2d3c4b5a69'
const HOME = {
  __typename: 'Community',
  foreign: false,
  name: 'KI Playground',
  description: '',
  url: 'https://ki-playground.gradido.net/api',
  uuid: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
}
const WIEN = {
  foreign: true,
  name: 'Gradido Wien',
  url: 'https://wien.example/api',
  uuid: 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff',
}

const link = () => ({
  __typename: 'TransactionLink',
  amount: '20',
  memo: 'Danke fürs Reparieren der Gartenbank — sie steht wieder wie neu.',
  validUntil: '2099-07-12T09:30:00.000Z',
  senderUser: { gradidoID: SENDER, alias: 'Oma-Emma' },
  communities: [{ ...WIEN, __typename: 'Community' }, HOME],
})

// The app resolves these by itself (unplugin-vue-components); a test has to name them. The
// switch is a stand-in that shows which community it was given and can pick another.
const CommunitySwitch = {
  name: 'CommunitySwitch',
  props: { modelValue: { type: Object, default: () => ({}) } },
  emits: ['update:model-value'],
  template: '<div data-test="switch">{{ modelValue.name }}</div>',
}

const selection = (props = {}) =>
  mount(RedeemCommunitySelection, {
    props: { linkData: link(), redeemCode: CODE, ...props },
    global: { plugins: [i18n], components: { BButton, BCol, BRow, CommunitySwitch } },
  })

const forwardButton = (wrapper) =>
  wrapper.findAll('button').find((button) => button.text() === 'Jetzt weiterleiten')

describe('RedeemCommunitySelection', () => {
  let place

  beforeEach(() => {
    i18n.global.locale.value = 'de'
    place = { href: 'https://ki-playground.gradido.net/redeem/' + CODE }
    vi.stubGlobal('location', place)
    apollo.createRedeemJwt = vi.fn().mockResolvedValue({ data: { createRedeemJwt: 'signed.jwt' } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts with the community the link was made in', () => {
    const wrapper = selection()

    expect(wrapper.find('[data-test="switch"]').text()).toBe('KI Playground')
    expect(forwardButton(wrapper)).toBeUndefined()
  })

  it('hands a choice up as the four fields the page keeps', async () => {
    const wrapper = selection()

    wrapper
      .findComponent(CommunitySwitch)
      .vm.$emit('update:model-value', { ...WIEN, description: 'x', __typename: 'Community' })
    await flushPromises()

    expect(wrapper.emitted('update:recipientCommunity')).toEqual([[WIEN]])
  })

  it('offers the way there only where another community is chosen', () => {
    expect(forwardButton(selection({ recipientCommunity: { ...HOME } }))).toBeUndefined()
    expect(forwardButton(selection({ recipientCommunity: WIEN }))).toBeDefined()
  })

  it('asks for the same token as before and sends the browser to the same address', async () => {
    const wrapper = selection({ recipientCommunity: WIEN })

    await forwardButton(wrapper).trigger('click')
    await flushPromises()

    expect(apollo.createRedeemJwt).toHaveBeenCalledTimes(1)
    expect(apollo.createRedeemJwt).toHaveBeenCalledWith({
      gradidoId: SENDER,
      senderCommunityUuid: HOME.uuid,
      senderCommunityName: 'KI Playground',
      recipientCommunityUuid: WIEN.uuid,
      code: CODE,
      amount: '20',
      memo: 'Danke fürs Reparieren der Gartenbank — sie steht wieder wie neu.',
      alias: 'Oma-Emma',
      validUntil: '2099-07-12T09:30:00.000Z',
    })
    expect(place.href).toBe('https://wien.example/redeem/signed.jwt')
  })
})
