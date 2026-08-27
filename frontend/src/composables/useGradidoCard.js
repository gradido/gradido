// AI-GENERATED — not an architecture reference

import { useApolloClient } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import CONFIG from '@/config'
import { useAppToast } from '@/composables/useToast'
import { avatarFull } from '@/graphql/queries'
import { avatarLettering } from '@/utils/avatarLettering'
import { gradidoAddress, memberAlias } from '@/utils/gradidoAddress'
import { cardFileName, drawGradidoCard } from '@/utils/gradidoCard'
import { printSheet } from '@/utils/printSheet'
import { renderQrCodeCanvas } from '@/utils/qrCode'

/**
 * The member's own printable Gradido card.
 *
 * Everything the card shows already exists in the wallet, with one exception: the 512 x 512
 * rendition of the picture, which is deliberately not part of the login response because it
 * is about ten times the everyday one.
 *
 * ## Which picture, and why that decides a query per visit
 *
 * The card is now drawn as soon as the settings page opens, so that somebody typing their
 * contact lines sees them appear. Fetching the large picture for that would put an extra
 * query on every visit to the page -- the card section sits on the tab it opens with.
 *
 * So the two draws use different pictures, and the difference is invisible where it lands:
 *
 * - **The preview** takes the everyday 128 px rendition, which is in the store already
 *   (`state.avatar`, written at login and persisted). On screen the picture is about a
 *   tenth of a card wide, so nothing about it is visible -- and it costs no query at all.
 * - **The download and the sheet** fetch the 512 px rendition, because those end up on
 *   paper, where 20 mm at 300 dpi is 236 px and the everyday one would show it.
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

  /**
   * The name the card actually carries, which is not always the member's own.
   *
   * A card is handed to strangers, and whether one's real name goes out with it is the
   * holder's decision, not ours (Bernd, 27.08.2026). With the real name off, the alias moves
   * up into the name's place -- bare, without the word "user name" in front of it, because
   * up there it is simply what this person is called. The line that used to carry it below
   * then goes; see drawGradidoCard.
   *
   * ⛔ Everything the card says about the member has to follow that one decision, or the
   * name comes back in by a side door. Two of those doors are easy to miss:
   *
   * - **the initials disc**, when there is no picture. "BH" beside an alias is the real name
   *   in two letters, handed to the same stranger. So the letters follow the name line
   *   (AS-010) while the COLOUR keeps hashing the real initials, so nobody's disc changes.
   * - **the file name of the download**, which is what a print shop reads off the file.
   */
  const printedName = (realName) => {
    const { username, gradidoID } = store.state
    return realName ? memberName() : memberAlias(username, gradidoID)
  }

  /**
   * The everyday picture, as a data URI, or null. Held in the store as bare base64.
   */
  const storedPicture = () =>
    store.state.avatar ? `data:image/jpeg;base64,${store.state.avatar}` : null

  /**
   * @param {object} [options]
   * @param {string[]} [options.contact]  the lines the member typed, at most five
   * @param {boolean} [options.heading]   whether the word above them is printed too
   * @param {boolean} [options.realName]  whether the member's real name goes on the card
   * @param {boolean} [options.preview]   true for the picture on screen, false for paper
   */
  const drawCard = async ({
    contact = [],
    heading = true,
    realName = true,
    preview = false,
  } = {}) => {
    const { firstName, lastName, username, gradidoID } = store.state
    const alias = memberAlias(username, gradidoID)
    const { host, link } = gradidoAddress(alias)
    // Letters from the alias, colour from the real initials -- the wallet's split (AS-010).
    // Which of the two the card shows follows the name line above the disc, see printedName.
    //
    // ⚠️ The RESOLVED alias, not the raw user name. They differ for a stored name of one or
    // two characters, which predates the rule and falls back to the Gradido ID -- and the
    // disc has to agree with the line printed beside it, which is that same resolved value.
    const { letters, colorSeed } = avatarLettering({ alias, firstName, lastName })

    return drawGradidoCard({
      qrCanvas: await renderQrCodeCanvas(link),
      name: printedName(realName),
      // The two labels the wallet already uses for these fields. Printing a different word
      // than the send form shows would make the card harder to follow, not easier.
      communityLabel: t('community.community'),
      communityName: CONFIG.COMMUNITY_NAME,
      aliasLabel: t('form.username'),
      alias,
      // Without the real name the alias is already the name line; a labelled line saying it
      // again two lines below would only repeat it.
      showAliasLine: realName,
      host,
      // Raw, not uppercased: this is a hash seed as well as two letters, and
      // `avatarPaletteEntry` is case-sensitive. `drawPicture` uppercases what it draws.
      initials: realName ? colorSeed : letters,
      colorSeed,
      picture: preview ? storedPicture() : await fetchPicture(),
      // The same word stands over the field the member types into. The field looks like
      // its result, which is the whole point of drawing the card while they type.
      //
      // It can be left off: with five full lines the word is in the way rather than an
      // invitation, and that is a judgement only the person holding the card can make.
      contactHeading: heading ? t('gradido-card.contact') : '',
      contact,
    })
  }

  /**
   * Hands the card to the browser and returns the picture it handed over, so the caller can
   * show the very same one instead of drawing a second time. Null when it failed.
   *
   * Options rather than positions, like drawCard above: a caller passing only the lines and
   * a caller passing only a ready picture would otherwise differ by argument order alone.
   *
   * The images the card is made of are only loaded at this point, so one that fails to load
   * must not stay silent.
   */
  const downloadCard = async ({
    contact = [],
    heading = true,
    realName = true,
    image = null,
  } = {}) => {
    try {
      const card = image ?? (await drawCard({ contact, heading, realName }))
      const anchor = document.createElement('a')
      anchor.href = card
      // ⛔ The name that is ON the card, not the member's own. A file called
      // "Gradido Bernd Hückstädt.png" is what a print shop reads, and handing the real name
      // over in the file name of a card that deliberately does not carry it would undo the
      // decision at the last step.
      anchor.download = cardFileName(printedName(realName))
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
  const printCardSheet = async ({ contact = [], heading = true, realName = true } = {}) => {
    try {
      const card = await drawCard({ contact, heading, realName })
      // ⚠️ The frame dance lives in `utils/printSheet` since the thank you card needed the
      // same one. Everything specific to THIS sheet -- ten cards, landscape, the padding
      // that keeps the grid inside the paper -- stays here.
      await printSheet({ style: SHEET_STYLE, build: (doc) => buildSheet(doc, card) })
      return card
    } catch (error) {
      toastError(error.message)
      return null
    }
  }

  return { drawCard, downloadCard, printCardSheet }
}
