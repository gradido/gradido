import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { memberAlias } from '@/utils/gradidoAddress'
import { shareText } from '@/utils/shareText'

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
