import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { memberAlias } from '@/utils/gradidoAddress'

export const useCopyLinks = ({ link, amount, memo, validUntil }) => {
  const canCopyLink = ref(true)

  const store = useStore()
  const { toastSuccess, toastError } = useAppToast()
  const { t, d } = useI18n()

  // Say "copied" only once it is copied. Where the page is not served over TLS, and in some
  // browsers built into other apps, `navigator.clipboard` is not there at all -- the call then
  // throws before there is a promise to reject, and a `.catch` on the promise never runs.
  const writeToClipboard = async (text, copiedMessage) => {
    try {
      await navigator.clipboard.writeText(text)
      toastSuccess(copiedMessage)
    } catch {
      canCopyLink.value = false
      toastError(t('gdd_per_link.not-copied'))
    }
  }

  const copyLink = () => writeToClipboard(link, t('gdd_per_link.link-copied'))

  const copyLinkWithText = () =>
    writeToClipboard(linkText.value, t('gdd_per_link.link-and-text-copied'))

  // Four lines to the person the link is for, with the link on a line of its own after the
  // question. The sender under their alias (NU-021/KLAR-07), as on the cheque and the redeem
  // page. The warning that whoever holds the link can redeem it is not in here: it is meant
  // for the sender and stands on their screen (`gdd_per_link.link-hint`).
  const linkText = computed(() =>
    [
      t('gdd_per_link.share-line1', {
        name: memberAlias(store.state.username, store.state.gradidoID),
        amount,
      }),
      t('gdd_per_link.share-line2', { memo }),
      t('gdd_per_link.share-line3'),
      link,
      t('gdd_per_link.share-line4', { date: d(new Date(validUntil), 'short') }),
    ].join('\n'),
  )

  /**
   * Hands the text to the device's own share sheet, and copies it where that does not work.
   *
   * Only `text` goes along, no `url`: the link is already in the text, and Chrome on Android
   * joins text and url with a space (`ShareParams.getTextAndUrl`), so the message would carry
   * the link twice. Closing the sheet rejects with an `AbortError` -- the member changed their
   * mind, which is not an error and gets no message. Every other failure copies instead,
   * including a browser without a share sheet: there `navigator.share` is missing and the
   * call throws.
   */
  const share = async () => {
    try {
      await navigator.share({ text: linkText.value })
    } catch (error) {
      if (error?.name !== 'AbortError') await copyLinkWithText()
    }
  }

  return {
    canCopyLink,
    copyLink,
    copyLinkWithText,
    linkText,
    share,
  }
}
