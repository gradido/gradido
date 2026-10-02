// AI-GENERATED — not an architecture reference
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { useRedeemCommunity } from './useRedeemCommunity'

/**
 * The way to another community with a token for the link, as both places that offer it use
 * it. Called from a component, as it always is: the composable asks its scope whether the page
 * that asked is still there.
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
  description: 'here',
  url: 'https://ki-playground.gradido.net/api',
  uuid: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
}
const WIEN = {
  foreign: true,
  name: 'Gradido Wien',
  url: 'https://wien.example/api',
  uuid: 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff',
}
const GRAZ = {
  foreign: true,
  name: 'Gradido Graz',
  url: 'https://graz.example/api/',
  uuid: 'cccccccc-dddd-4eee-8fff-000000000000',
}

const link = (overrides = {}) => ({
  __typename: 'TransactionLink',
  amount: '20',
  memo: 'Danke fürs Reparieren der Gartenbank — sie steht wieder wie neu.',
  validUntil: '2099-07-12T09:30:00.000Z',
  senderUser: { gradidoID: SENDER, alias: 'Oma-Emma', firstName: 'Wilhelmine' },
  communities: [{ ...WIEN, __typename: 'Community' }, HOME],
  ...overrides,
})

/** A component that uses the composable and hands back what it returns. */
const use = (options) => {
  let used
  const wrapper = mount(
    defineComponent({
      setup() {
        used = useRedeemCommunity(options)
        return () => h('div')
      },
    }),
  )
  return { ...used, wrapper }
}

/** A promise the test settles when it wants to: the token while it is on its way. */
const underway = () => {
  let settle
  const answer = new Promise((resolve, reject) => {
    settle = { resolve, reject }
  })
  return { answer, ...settle }
}

describe('useRedeemCommunity', () => {
  let place

  beforeEach(() => {
    place = { href: 'https://ki-playground.gradido.net/redeem/' + CODE }
    vi.stubGlobal('location', place)
    apollo.createRedeemJwt = vi.fn().mockResolvedValue({ data: { createRedeemJwt: 'signed.jwt' } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('the community the link was made in', () => {
    it('is the entry of the link that is not foreign', () => {
      const { senderCommunity } = use({ linkData: link(), redeemCode: CODE })

      expect(senderCommunity.value).toEqual({
        uuid: HOME.uuid,
        name: 'KI Playground',
        url: 'https://ki-playground.gradido.net/api',
        foreign: false,
      })
    })

    it('is this community where the link names none', () => {
      const { senderCommunity } = use({ linkData: link({ communities: [] }), redeemCode: CODE })

      expect(senderCommunity.value).toEqual({
        uuid: '',
        name: 'KI Playground',
        url: 'https://ki-playground.gradido.net',
        foreign: false,
      })
    })
  })

  describe('the community chosen', () => {
    it('is the link’s own as long as nobody chose', () => {
      const { currentRecipientCommunity, isForeignCommunitySelected } = use({
        linkData: link(),
        redeemCode: CODE,
      })

      expect(currentRecipientCommunity.value.uuid).toBe(HOME.uuid)
      expect(isForeignCommunitySelected.value).toBe(false)
    })

    it('follows the choice', () => {
      const chosen = ref(null)
      const { currentRecipientCommunity, isForeignCommunitySelected } = use({
        linkData: link(),
        redeemCode: CODE,
        recipientCommunity: chosen,
      })

      chosen.value = WIEN

      expect(currentRecipientCommunity.value).toEqual(WIEN)
      expect(isForeignCommunitySelected.value).toBe(true)
    })

    // The contribution link's page hands over a community of its own and never asks for the
    // link's: its data names no communities at all, and reading them would throw.
    it('does not read the link’s communities where one is handed over', () => {
      const { currentRecipientCommunity } = use({
        linkData: { __typename: 'ContributionLink', amount: '100' },
        redeemCode: 'CL-abc123',
        recipientCommunity: () => ({ ...HOME }),
      })

      expect(currentRecipientCommunity.value.uuid).toBe(HOME.uuid)
    })
  })

  describe('going there', () => {
    it('asks for nothing and goes nowhere where the link’s own community is chosen', async () => {
      const { forwardToRecipientCommunity } = use({ linkData: link(), redeemCode: CODE })

      expect(await forwardToRecipientCommunity()).toBe(false)

      expect(apollo.createRedeemJwt).not.toHaveBeenCalled()
      expect(place.href).toBe('https://ki-playground.gradido.net/redeem/' + CODE)
    })

    it('asks for a token for the link and the community chosen', async () => {
      const { forwardToRecipientCommunity } = use({
        linkData: link(),
        redeemCode: CODE,
        recipientCommunity: WIEN,
      })

      await forwardToRecipientCommunity()

      expect(apollo.createRedeemJwt).toHaveBeenCalledTimes(1)
      const [sent] = apollo.createRedeemJwt.mock.calls[0]
      expect(sent).toEqual({
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
      // The sender travels under the user name; no real name goes along (NU-021).
      expect(sent).not.toHaveProperty('firstName')
      expect(JSON.stringify(sent)).not.toContain('Wilhelmine')
    })

    it('sends the browser to the redeem page of that community, with the token', async () => {
      const { forwardToRecipientCommunity } = use({
        linkData: link(),
        redeemCode: CODE,
        recipientCommunity: WIEN,
      })

      expect(await forwardToRecipientCommunity()).toBe(true)

      expect(place.href).toBe('https://wien.example/redeem/signed.jwt')
    })

    // A community is stored with the address of its API; the page lies beside it.
    it.each([
      ['https://graz.example/api/', 'https://graz.example/redeem/signed.jwt'],
      ['https://graz.example/api', 'https://graz.example/redeem/signed.jwt'],
      ['https://graz.example', 'https://graz.example/redeem/signed.jwt'],
    ])('builds the address from %s', async (url, expected) => {
      const { forwardToRecipientCommunity } = use({
        linkData: link(),
        redeemCode: CODE,
        recipientCommunity: { ...GRAZ, url },
      })

      await forwardToRecipientCommunity()

      expect(place.href).toBe(expected)
    })

    it('says so and goes nowhere where no token comes back', async () => {
      apollo.createRedeemJwt = vi.fn().mockResolvedValue({ data: { createRedeemJwt: null } })
      const { forwardToRecipientCommunity } = use({
        linkData: link(),
        redeemCode: CODE,
        recipientCommunity: WIEN,
      })

      await expect(forwardToRecipientCommunity()).rejects.toThrow('Failed to get redeem token')
      expect(place.href).toBe('https://ki-playground.gradido.net/redeem/' + CODE)
    })

    it('hands on what the server refused with', async () => {
      apollo.createRedeemJwt = vi.fn().mockRejectedValue(new Error('Transaction link expired'))
      const { forwardToRecipientCommunity } = use({
        linkData: link(),
        redeemCode: CODE,
        recipientCommunity: WIEN,
      })

      await expect(forwardToRecipientCommunity()).rejects.toThrow('Transaction link expired')
      expect(place.href).toBe('https://ki-playground.gradido.net/redeem/' + CODE)
    })
  })

  // The answer comes later than it was asked for, and the page does not stand still meanwhile.
  describe('while the token is on its way', () => {
    it('goes to the community the token was asked for, whatever is chosen by then', async () => {
      const token = underway()
      apollo.createRedeemJwt = vi.fn(() => token.answer)
      const chosen = ref(WIEN)
      const { forwardToRecipientCommunity } = use({
        linkData: link(),
        redeemCode: CODE,
        recipientCommunity: chosen,
      })

      const going = forwardToRecipientCommunity()
      chosen.value = GRAZ
      token.resolve({ data: { createRedeemJwt: 'signed.for.wien' } })
      await going

      expect(apollo.createRedeemJwt.mock.calls[0][0].recipientCommunityUuid).toBe(WIEN.uuid)
      expect(place.href).toBe('https://wien.example/redeem/signed.for.wien')
    })

    it('sends nobody anywhere once the page that asked is gone', async () => {
      const token = underway()
      apollo.createRedeemJwt = vi.fn(() => token.answer)
      const { forwardToRecipientCommunity, wrapper } = use({
        linkData: link(),
        redeemCode: CODE,
        recipientCommunity: WIEN,
      })

      const going = forwardToRecipientCommunity()
      wrapper.unmount()
      token.resolve({ data: { createRedeemJwt: 'signed.jwt' } })

      expect(await going).toBe(false)
      expect(place.href).toBe('https://ki-playground.gradido.net/redeem/' + CODE)
    })
  })
})
