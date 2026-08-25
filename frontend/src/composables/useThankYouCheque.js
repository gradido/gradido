// AI-GENERATED — not an architecture reference

import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useAppToast } from '@/composables/useToast'
import { renderQrCodeCanvas } from '@/utils/qrCode'
import { gradidoAddress, memberAlias } from '@/utils/gradidoAddress'
import { chequeFileName, drawCheque } from '@/utils/thankYouCheque'

/**
 * The printable cheque for one transaction link.
 *
 * The sentences are built here and not at the call sites, because the cheque is offered
 * in two places - the menu of a link in the list, and the page right after a link was
 * created - and both have to hand out the same object.
 *
 * The QR code is rendered off screen. In the list nothing is showing when the button is
 * pressed, and on the result page the drawing must not have to wait for the figure to
 * appear.
 */
export const useThankYouCheque = ({ link, amount, memo, validUntil }) => {
  const store = useStore()
  const { t, d } = useI18n()
  const { toastError } = useAppToast()

  const drawThankYouCheque = async () => {
    // gradidoID, not gradidoId -- the store spells it with a capital D, and reading the
    // other spelling put the word "undefined" on the printed cheque of every member who
    // has no user name yet.
    const { firstName, lastName, username, gradidoID, avatar } = store.state
    const alias = memberAlias(username, gradidoID)
    return drawCheque({
      kind: 'thankYou',
      // The alias in the header, not the real name (NU-021/KLAR-07): a cheque is handed
      // to strangers. The card keeps the real name -- that is a card's purpose.
      name: alias,
      // The same address the card prints, in the same three weights. Taken by name rather
      // than spread: the cheque needs the host, and a field added to the address later
      // should not ride along into the drawing unnoticed.
      host: gradidoAddress(alias).host,
      alias,
      // The everyday 128-pixel rendition is enough: the cheque draws the picture at 78
      // pixels. It is already in the store, so this costs no query and no waiting -- unlike
      // the card, which prints 24 mm and needs the large one.
      portrait: avatar ? `data:image/jpeg;base64,${avatar}` : null,
      initials: `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`,
      // The same sentence the copy text and the redeem page build, so the three never
      // disagree about who is giving: the alias (NU-021/KLAR-07).
      headline: `${alias} ${t('transaction-link.send_you')} ${amount} Gradido.`,
      memo,
      hintLine: t('thank-you-cheque.scan-qr'),
      validLine: t('thank-you-cheque.valid-until', { date: d(new Date(validUntil), 'short') }),
      qrCanvas: await renderQrCodeCanvas(link),
    })
  }

  /**
   * Hands the cheque to the browser. Pass a picture that was already drawn - the result
   * page has one, because it shows it - otherwise it is drawn now.
   *
   * The pictures the cheque is made of are only loaded at this point, so one that fails
   * to load must not stay silent.
   */
  const downloadThankYouCheque = async (image = null) => {
    try {
      const anchor = document.createElement('a')
      anchor.href = image ?? (await drawThankYouCheque())
      anchor.download = chequeFileName(memo, amount)
      anchor.click()
    } catch (error) {
      toastError(error.message)
    }
  }

  return { drawThankYouCheque, downloadThankYouCheque }
}
