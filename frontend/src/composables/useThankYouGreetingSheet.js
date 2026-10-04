// AI-GENERATED — not an architecture reference

import { ref } from 'vue'
import { useApolloClient } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useAmountInText } from '@/composables/useAmountInText'
import { awaitGreetingPicture } from '@/composables/useGreetingPictures'
import { useAppToast } from '@/composables/useToast'
import { cardSlogan } from '@/utils/cardSlogan'
import { saveChatImageFile } from '@/utils/chatImageSave'
import { isGradidoId, memberAlias } from '@/utils/gradidoAddress'
import { greetingParts } from '@/utils/thankYouGreeting'
import {
  drawThankYouGreetingSheet,
  printThankYouGreetingSheet,
  thankYouGreetingSheetFile,
  thankYouGreetingSheetFileName,
} from '@/utils/thankYouGreetingSheet'
import { thankYouMotif } from '@/utils/thankYouMotifs'
import { fetchThankYouPicture, thankYouPictureAddress } from '@/utils/thankYouPicture'

/** The code of a link is the last piece of its address. */
const codeOf = (link) =>
  String(link ?? '')
    .split(/[?#]/)[0]
    .split('/')
    .filter(Boolean)
    .pop() ?? ''

/**
 * A thank-you greeting on paper: its sheet printed, or saved as a picture.
 *
 * The sentences and the data of the sheet are built here and not at the call sites, because
 * the sheet is offered in two places -- on "Fertig", right after a greeting was made, and in
 * the menu of a greeting in the member's own list, where it is printed a day later on another
 * computer -- and both have to hand out the same sheet (as useThankYouCheque does it for the
 * cheque).
 *
 * ONE drawing, two ways out: the print dialogue takes the picture the drawer made, and the
 * saved file is that same picture.
 *
 * ## The photo of a greeting that carries one
 *
 * - "Fertig" hands in the picture the page made a moment ago (`picture`). Nothing is fetched.
 * - The list has none of that size. There the large rendition is fetched from the address the
 *   greeting's own page uses -- once a tap -- and, where that address gives nothing, the small
 *   rendition the list holds is taken, asked for where it is not there yet.
 * - ⛔ Where no photo comes, nothing is printed and nothing is saved: never a card with an empty
 *   place for its picture. The one sentence for everything that fails says so.
 * - What was fetched is let go again once the sheet is drawn. Nothing of a photo goes into the
 *   store, the device's storage or Apollo's cache.
 *
 * ## One at a time
 *
 * While a sheet is being made both ways wait (`busy`): a double tap makes one sheet.
 *
 * @param {object} greetingLink the greeting as a link: `link`, `amount`, `memo`, `validUntil`
 *   and `greeting`; `id` where its photo may have to be asked for; `picture` where the caller
 *   holds the photo itself, as an address an image can be loaded from
 * @param {object} [options]
 * @param {boolean} [options.secondTap] whether the caller offers a second tap where the share
 *   sheet asks for one (`saveWaits`); without it the file is downloaded in that case
 */
export const useThankYouGreetingSheet = (
  { id = null, link, amount, memo, validUntil, greeting, picture = null },
  { secondTap = false } = {},
) => {
  const store = useStore()
  const { t, d, locale } = useI18n()
  const { toastError } = useAppToast()
  const amountInText = useAmountInText()
  // Asked for its client only where the server has to be asked: "Fertig" never does.
  const apollo = useApolloClient()

  /** A sheet is being made, printed or handed over. */
  const busy = ref(false)
  /**
   * A file waits for a second tap: the share sheet opens only right after a tap, and the sheet
   * had to be drawn first. That tap hands the same file over, without drawing it again.
   */
  const saveWaits = ref(false)
  let waitingFile = null

  /** What the drawer is given: everything that stands on the paper. */
  const sheetOf = (pictureAddress) => {
    const { line, words } = greetingParts(memo, greeting?.line)
    const alias = memberAlias(store.state.username, store.state.gradidoID)
    return {
      link,
      picture: pictureAddress,
      line,
      // In capitals by the rules of the language, as the card on the screen sets it
      // (RedeemThanksPaper): Turkish "için" is "İÇİN", Greek capitals carry no accent.
      forWhom: greeting?.recipientName
        ? t('thank-you-greeting.for', { name: greeting.recipientName }).toLocaleUpperCase(
            locale.value,
          )
        : '',
      words,
      // ⛔ The sender signs with their user name (NU-021) -- and whoever has none does not sign:
      // `memberAlias` stands the Gradido ID in for a missing name, and that is no signature.
      signature: isGradidoId(alias) ? '' : alias,
      // The amount as a sentence says it, the date as "Fertig" says it. A no-break space joins
      // the amount and its unit: where the sentence takes two lines, none of them ends on "20".
      waits: t('thank-you-greeting.sheet.waits', {
        amount: `${amountInText(amount)}\u00a0${t('GDD-long')}`,
      }),
      scan: t('thank-you-greeting.sheet.scan', { date: d(new Date(validUntil), 'short') }),
      free: t('thank-you-greeting.sheet.free'),
      slogan: cardSlogan(t),
    }
  }

  /**
   * The photo as an address the drawer can load, with what lets it go afterwards -- or null
   * where none comes.
   */
  const photo = async () => {
    if (picture) return { address: picture, release: () => {} }

    const address = thankYouPictureAddress(codeOf(link))
    const blob = address ? await fetchThankYouPicture(address) : null
    if (blob) {
      const held = URL.createObjectURL(blob)
      return { address: held, release: () => URL.revokeObjectURL(held) }
    }

    const small = await awaitGreetingPicture(apollo.client, id)
    return small?.state === 'ready' ? { address: small.src, release: () => {} } : null
  }

  /** The sheet as a PNG data URL, drawn now. */
  const drawGreetingSheet = async () => {
    let held = null
    try {
      let address = null
      if (greeting?.hasPicture) {
        held = await photo()
        if (!held) throw new Error('the photo of the greeting did not come')
        address = held.address
      } else {
        // No picture for a motif this wallet does not know: the sheet then carries the line alone.
        address = thankYouMotif(greeting?.motif, t)?.src ?? null
      }
      return await drawThankYouGreetingSheet(sheetOf(address))
    } finally {
      held?.release()
    }
  }

  /**
   * One at a time, and ONE sentence for whatever fails -- a picture that does not load, a photo
   * that does not come: never a message in the browser's own language.
   */
  const once = async (work) => {
    if (busy.value) return
    busy.value = true
    try {
      await work()
    } catch {
      toastError(t('thank-you-greeting.paper.failed'))
    } finally {
      busy.value = false
    }
  }

  /** The sheet in the browser's print dialogue, where "Save as PDF" is one click away. */
  const printGreetingSheet = () =>
    once(async () => printThankYouGreetingSheet(await drawGreetingSheet()))

  const fileName = () =>
    thankYouGreetingSheetFileName(
      greeting?.recipientName
        ? t('thank-you-greeting.list.for', { name: greeting.recipientName })
        : t('thank-you-greeting.name'),
    )

  /**
   * The same sheet as a picture, to the member's device: on a phone or a tablet through its
   * share sheet, on a computer as a download (saveChatImageFile).
   *
   * Whoever closes the share sheet changed their mind: no error and no sentence.
   */
  const saveGreetingSheet = () =>
    once(async () => {
      const file = waitingFile ?? thankYouGreetingSheetFile(await drawGreetingSheet(), fileName())
      let outcome = await saveChatImageFile(file)
      // The share sheet wants a tap of its own, and a menu has no place to offer one.
      if (outcome === 'again' && !secondTap) {
        outcome = await saveChatImageFile(file, { computer: true })
      }
      waitingFile = outcome === 'again' ? file : null
      saveWaits.value = waitingFile !== null
    })

  return { busy, saveWaits, printGreetingSheet, saveGreetingSheet }
}
