// AI-GENERATED — not an architecture reference

import { useApolloClient } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import CONFIG from '@/config'
import { useAppToast } from '@/composables/useToast'
import { avatarFull } from '@/graphql/queries'
import { cardFileName, drawGradidoCard } from '@/utils/gradidoCard'
import { renderQrCodeCanvas } from '@/utils/qrCode'

/**
 * The member's own printable Gradido card.
 *
 * Everything the card shows already exists in the wallet, with one exception: the 512 x 512
 * rendition of the picture, which is deliberately not part of the login response because it
 * is about ten times the everyday one. It is fetched here, at the moment somebody actually
 * asks for a card.
 *
 * The QR is rendered off screen, with the same generator the modal uses, so what gets
 * printed is the code the screen would show.
 */

/**
 * The community host, without scheme or path -- that is what gets printed (E-008). The
 * scheme goes back on for the QR, where it decides whether a phone camera offers to open
 * the link at all.
 *
 * @param {string} url
 * @returns {string}
 */
export const communityHost = (url) => {
  try {
    return new URL(url).host
  } catch {
    return String(url ?? '')
      .replace(/^[a-z]+:\/\//i, '')
      .replace(/\/.*$/, '')
  }
}

/**
 * The address in both shapes at once, so they can never disagree on one card.
 *
 * @param {string} alias
 * @returns {{host: string, link: string}}
 */
export const cardAddress = (alias) => ({
  host: communityHost(CONFIG.COMMUNITY_URL),
  link: new URL(`/u/${alias}`, CONFIG.COMMUNITY_URL).href,
})

export const useGradidoCard = () => {
  const store = useStore()
  const { t } = useI18n()
  const { toastError } = useAppToast()
  const { client } = useApolloClient()

  /**
   * The full picture, or null when the member has none.
   *
   * Asked through the client rather than useLazyQuery: `load()` answers only on its first
   * call and returns a bare false afterwards, which would silently turn the second card of
   * a session into one without a picture.
   */
  const fetchPicture = async () => {
    try {
      const { data } = await client.query({ query: avatarFull, fetchPolicy: 'network-only' })
      return data?.avatarFull ? `data:image/jpeg;base64,${data.avatarFull}` : null
    } catch (error) {
      // A card without a picture is still a card, and the initials disc is a full-value
      // stand-in -- so a picture that cannot be fetched must not cost the whole card.
      return null
    }
  }

  const memberName = () => {
    const { firstName, lastName } = store.state
    return `${firstName ?? ''} ${lastName ?? ''}`.trim()
  }

  const drawCard = async () => {
    const { firstName, lastName, username, gradidoID } = store.state
    const alias = username || gradidoID
    const { host, link } = cardAddress(alias)

    return drawGradidoCard({
      qrCanvas: await renderQrCodeCanvas(link),
      name: memberName(),
      // The two labels the wallet already uses for these fields. Printing a different word
      // than the send form shows would make the card harder to follow, not easier.
      communityLabel: t('community.community'),
      communityName: CONFIG.COMMUNITY_NAME,
      aliasLabel: t('form.username'),
      alias,
      host,
      initials: `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`,
      picture: await fetchPicture(),
    })
  }

  /**
   * Hands the card to the browser and returns the picture it handed over, so the caller can
   * show the very same one instead of drawing a second time. Null when it failed.
   *
   * The images the card is made of are only loaded at this point, so one that fails to load
   * must not stay silent.
   */
  const downloadCard = async (image = null) => {
    try {
      const card = image ?? (await drawCard())
      const anchor = document.createElement('a')
      anchor.href = card
      anchor.download = cardFileName(memberName())
      anchor.click()
      return card
    } catch (error) {
      toastError(error.message)
      return null
    }
  }

  return { drawCard, downloadCard }
}
