// AI-GENERATED — not an architecture reference
import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useRedeemCommunity } from './useRedeemCommunity'

/**
 * The way to another community: its redeem page, with the code and the link's community -- no
 * more. That community's server asks this one for the link.
 */
const CODE = 'c0ffee1234567890abcdef12'
const HOME = {
  foreign: false,
  name: 'KI Playground',
  url: 'https://ki-playground.gradido.net/api',
  uuid: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
}
const WIEN = {
  foreign: true,
  name: 'Gradido Wien',
  url: 'https://wien.example/api',
  uuid: 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff',
}
const GRAZ = { ...WIEN, name: 'Gradido Graz', url: 'https://graz.example/api/' }
const link = { communities: [WIEN, HOME] }

const use = (recipientCommunity) =>
  useRedeemCommunity({ linkData: link, redeemCode: CODE, recipientCommunity })

describe('useRedeemCommunity', () => {
  it('leads to the redeem page of the community chosen, with the code and the link’s community', () => {
    expect(use(WIEN).recipientRedeemUrl.value).toBe(
      `https://wien.example/redeem/${CODE}?codeCommunityUuid=${HOME.uuid}`,
    )
  })

  it('leaves the api path of the community’s address behind, with or without its slash', () => {
    expect(use(GRAZ).recipientRedeemUrl.value).toMatch(/^https:\/\/graz\.example\/redeem\//)
  })

  it('says whether the community chosen is another one, and follows the choice', () => {
    const chosen = ref(HOME)
    const { isForeignCommunitySelected, recipientRedeemUrl } = use(chosen)
    expect(isForeignCommunitySelected.value).toBe(false)
    chosen.value = WIEN
    expect(isForeignCommunitySelected.value).toBe(true)
    expect(recipientRedeemUrl.value).toContain('https://wien.example/redeem/')
  })
})
