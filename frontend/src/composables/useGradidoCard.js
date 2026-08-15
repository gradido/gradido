// AI-GENERATED — not an architecture reference

import { useApolloClient } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import CONFIG from '@/config'
import { useAppToast } from '@/composables/useToast'
import { avatarFull } from '@/graphql/queries'
import { gradidoAddress, memberAlias } from '@/utils/gradidoAddress'
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

// Ten cards on one A4 page, in real millimetres:
// 2 x 85.6 = 171.2 plus 2 x 19.4 margin = 210 · 5 x 54 = 270 plus 2 x 13.5 = 297.
//
// Printed as an <img> per card rather than one shared background image: browsers suppress
// background graphics in print unless the reader ticks a box, and a sheet that comes out
// blank would look like our mistake. Ten elements share one string, so it costs nothing.
const SHEET_STYLE = `
  @page { size: A4; margin: 0 }
  html, body { margin: 0; padding: 0; background: #fff }
  .sheet {
    /* border-box, or the padding is added on top of the 210 x 297 and the page becomes
       248.8 x 324 -- wider and taller than the paper, so the right column and the bottom
       row are cut off. The mockup this layout came from had a global border-box reset;
       a print frame starts with none. */
    box-sizing: border-box;
    width: 210mm; height: 297mm; padding: 13.5mm 19.4mm; display: grid;
    grid-template-columns: repeat(2, 85.6mm); grid-template-rows: repeat(5, 54mm);
  }
  .sheet img { width: 85.6mm; height: 54mm; display: block }
`

const buildSheet = (doc, card) => {
  const style = doc.createElement('style')
  style.textContent = SHEET_STYLE
  doc.head.appendChild(style)

  const sheet = doc.createElement('div')
  sheet.className = 'sheet'
  for (let index = 0; index < 10; index++) {
    const image = doc.createElement('img')
    image.src = card
    image.alt = ''
    sheet.appendChild(image)
  }
  doc.body.appendChild(sheet)
}

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
    const alias = memberAlias(username, gradidoID)
    const { host, link } = gradidoAddress(alias)

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

  /**
   * Lays ten cards on an A4 page and opens the print dialogue, where "Save as PDF" is one
   * click away. That is the whole reason there is no PDF library here: the browser already
   * writes PDFs, and it is the only thing in the chain that knows what a millimetre is.
   *
   * The page is built in a hidden frame rather than a new window, because a new window is
   * what pop-up blockers stop.
   */
  const printCardSheet = async () => {
    let frame = null
    try {
      const card = await drawCard()

      frame = document.createElement('iframe')
      frame.setAttribute('aria-hidden', 'true')
      frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
      document.body.appendChild(frame)

      const doc = frame.contentDocument
      buildSheet(doc, card)
      // The picture has to be decoded before the dialogue opens, or the page goes to the
      // printer empty. decode() is the only way to know; a load event has already passed.
      // Where there is no decode(), printing still works -- a data URI needs no network --
      // so its absence must not cost the sheet. It is missing in more places than one thinks.
      await Promise.all(
        [...doc.images].map((image) =>
          typeof image.decode === 'function' ? image.decode().catch(() => {}) : null,
        ),
      )

      // The frame must outlive the dialogue -- removing it while the browser is printing
      // cancels the job. It goes when printing is over, and a minute later at the latest:
      // afterprint fires on cancel too, but not everywhere, and a frame per click adds up.
      const remove = () => frame?.remove()
      frame.contentWindow.addEventListener('afterprint', remove)
      setTimeout(remove, 60000)

      frame.contentWindow.focus()
      frame.contentWindow.print()
      return card
    } catch (error) {
      frame?.remove()
      toastError(error.message)
      return null
    }
  }

  return { drawCard, downloadCard, printCardSheet }
}
