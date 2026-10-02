import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useAmountInText } from '@/composables/useAmountInText'
import { useAppToast } from '@/composables/useToast'
import { memberAlias } from '@/utils/gradidoAddress'
import { shareText } from '@/utils/shareText'

/**
 * Copying and sharing a transaction link, with the text that goes out with it.
 *
 * @param {object} link what the link holds; `greeting` where it is a thank-you greeting
 *   (`{ recipientName }` is what is read of it), null or left out for a plain link
 */
export const useCopyLinks = ({ link, amount, memo, validUntil, greeting = null }) => {
  const canCopyLink = ref(true)

  const store = useStore()
  const { toastSuccess, toastError } = useAppToast()
  const { t, d } = useI18n()
  const amountInText = useAmountInText()

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

  // A greeting's sentence goes without the sender's words, so its message after copying does
  // not speak of "your message": that one does not travel.
  const copyLinkWithText = () =>
    writeToClipboard(
      linkText.value,
      greeting ? t('thank-you-greeting.share.copied') : t('gdd_per_link.link-and-text-copied'),
    )

  // Four lines to the person the link is for, with the link on a line of its own after the
  // question. The sender under their alias (NU-021/KLAR-07), as on the cheque and the redeem
  // page. The warning that whoever holds the link can redeem it is not in here: it is meant
  // for the sender and stands on their screen (`gdd_per_link.link-hint`). The amount with the
  // decimal mark of the language the text is written in, as the sheet the link opens as.
  //
  // A thank-you greeting goes out with a sentence of its own (ZE-017, F3): in the first person,
  // without the sender's words and without the amount -- both stand on the card, behind the
  // link. The name where the greeting has one, the link on a line of its own, and the last
  // line the plain link has too: until when it waits, and that nothing happens otherwise.
  const greetingText = () =>
    [
      greeting.recipientName
        ? t('thank-you-greeting.share.line1-for', { name: greeting.recipientName })
        : t('thank-you-greeting.share.line1'),
      link,
      t('gdd_per_link.share-line4', { date: d(new Date(validUntil), 'short') }),
    ].join('\n')

  const plainText = () =>
    [
      t('gdd_per_link.share-line1', {
        name: memberAlias(store.state.username, store.state.gradidoID),
        amount: amountInText(amount),
      }),
      t('gdd_per_link.share-line2', { memo }),
      t('gdd_per_link.share-line3'),
      link,
      t('gdd_per_link.share-line4', { date: d(new Date(validUntil), 'short') }),
    ].join('\n')

  const linkText = computed(() => (greeting ? greetingText() : plainText()))

  // The device's own share sheet, and a copy where that does not work. `utils/shareText` says
  // why the link travels inside the text and not as `url`, and why closing the sheet is silent.
  const share = () => shareText(linkText.value, copyLinkWithText)

  return {
    canCopyLink,
    copyLink,
    copyLinkWithText,
    linkText,
    share,
  }
}
