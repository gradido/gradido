// AI-GENERATED — not an architecture reference
import { computed, getCurrentScope, onScopeDispose, toValue } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import CONFIG from '@/config'
import { createRedeemJwtMutation } from '@/graphql/mutations'

/**
 * The community a redeem link was made in, as the link's own data names it: the one entry of
 * `communities` that is not foreign. A link that carries no communities at all was made here.
 */
function homeCommunityOf(linkData) {
  if (linkData.communities?.length === 0) {
    return {
      uuid: '',
      name: CONFIG.COMMUNITY_NAME,
      url: CONFIG.COMMUNITY_URL,
      foreign: false,
    }
  }
  const homeCommunity = linkData.communities?.find((c) => c.foreign === false)
  return {
    uuid: homeCommunity.uuid,
    name: homeCommunity.name,
    url: homeCommunity.url,
    foreign: homeCommunity.foreign,
  }
}

/**
 * Redeeming a member's link in ANOTHER community than the one it was made in: somebody whose
 * account is elsewhere picks that community, this server signs a token for the link, and the
 * browser goes to the redeem page over there with it.
 *
 * One way for both places that offer it -- the choice of community on the redeem page as it
 * was (RedeemCommunitySelection) and the field behind "I already have an account" on the
 * thank-you view (RedeemThanks). It lived in the first of the two before.
 *
 * Two things hold here that did not before, and both are about the answer coming back later
 * than it was asked for:
 * - The browser goes to the community the token was asked for. The address used to be read
 *   after the answer, from whatever was chosen by then.
 * - Nobody is sent anywhere once the page that asked is gone: who went on to the registration
 *   meanwhile stays there.
 *
 * @param {object} options each a value, a ref or a getter
 * @param {object} options.linkData the link, as `queryTransactionLink` answers
 * @param {string} options.redeemCode the code in the address
 * @param {object} [options.recipientCommunity] the community chosen; none yet means the link's own
 */
export function useRedeemCommunity({ linkData, redeemCode, recipientCommunity }) {
  const senderCommunity = computed(() => homeCommunityOf(toValue(linkData)))

  const currentRecipientCommunity = computed(
    () => toValue(recipientCommunity) || { ...senderCommunity.value },
  )

  const isForeignCommunitySelected = computed(() => currentRecipientCommunity.value.foreign)

  const { mutate: createRedeemJwt } = useMutation(createRedeemJwtMutation)

  let gone = false
  if (getCurrentScope()) {
    onScopeDispose(() => {
      gone = true
    })
  }

  /**
   * Asks for the token and sends the browser to the chosen community with it. Does nothing
   * where the link's own community is chosen: there is nowhere to go.
   *
   * @returns {Promise<boolean>} whether the browser was sent on
   */
  async function forwardToRecipientCommunity() {
    if (!isForeignCommunitySelected.value) return false
    const target = currentRecipientCommunity.value
    const link = toValue(linkData)
    const { data } = await createRedeemJwt({
      gradidoId: link.senderUser?.gradidoID,
      senderCommunityUuid: senderCommunity.value.uuid,
      senderCommunityName: senderCommunity.value.name,
      recipientCommunityUuid: target.uuid,
      code: toValue(redeemCode),
      amount: link.amount,
      memo: link.memo,
      // The only name this call sends, and the backend signs exactly it (`alias ?? ''` in
      // createRedeemJwt). The mutation still declares a `firstName` variable and the resolver
      // still accepts the argument -- neither is filled from here.
      alias: link.senderUser?.alias,
      validUntil: link.validUntil,
    })
    if (!data?.createRedeemJwt) {
      throw new Error('Failed to get redeem token')
    }
    if (gone) return false
    window.location.href = target.url.replace(/\/api\/?$/, '') + '/redeem/' + data.createRedeemJwt
    return true
  }

  return {
    senderCommunity,
    currentRecipientCommunity,
    isForeignCommunitySelected,
    forwardToRecipientCommunity,
  }
}
