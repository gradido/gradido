// AI-GENERATED — not an architecture reference
import { computed, toValue } from 'vue'

/**
 * Redeeming a member's link in ANOTHER community than the one it was made in: somebody whose
 * account is elsewhere picks that community, and the browser goes to the redeem page over there
 * with the code and the link's community. That community's server asks this one for the link
 * (peer-api transactionLink) and pays it out from here (disburseTransactionLink).
 *
 * The link's community is the one entry of the link's `communities` that is not foreign.
 *
 * @param {object} options each a value, a ref or a getter
 * @param {object} options.linkData the link, as `queryTransactionLink` answers
 * @param {string} options.redeemCode the code in the address
 * @param {object} options.recipientCommunity the community chosen
 */
export function useRedeemCommunity({ linkData, redeemCode, recipientCommunity }) {
  const isForeignCommunitySelected = computed(() => toValue(recipientCommunity).foreign === true)

  // The redeem page of the chosen community, for this link.
  const recipientRedeemUrl = computed(() => {
    const linkCommunity = toValue(linkData).communities?.find((c) => c.foreign === false)
    const base = toValue(recipientCommunity).url.replace(/\/api\/?$/, '')
    const query = new URLSearchParams({ codeCommunityUuid: linkCommunity?.uuid ?? '' })
    return `${base}/redeem/${toValue(redeemCode)}?${query}`
  })

  return { isForeignCommunitySelected, recipientRedeemUrl }
}
