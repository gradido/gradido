// AI-GENERATED — not an architecture reference

import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import CONFIG from '@/config'
import { useAppToast } from '@/composables/useToast'
import { renderQrCodeCanvas } from '@/utils/qrCode'
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
    const { firstName, lastName, username, gradidoId } = store.state
    return drawCheque({
      kind: 'thankYou',
      name: `${firstName} ${lastName}`.trim(),
      address: `${CONFIG.COMMUNITY_NAME}/${username || gradidoId}`,
      initials: `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`,
      headline: `${firstName} ${t('transaction-link.send_you')} ${amount} Gradido.`,
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
