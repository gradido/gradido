import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'

export const useCopyLinks = ({ link, amount, memo, validUntil }) => {
  const canCopyLink = ref(true)

  const store = useStore()
  const { toastSuccess, toastError } = useAppToast()
  const { t, d } = useI18n()

  const copyLink = () => {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        toastSuccess(t('gdd_per_link.link-copied'))
      })
      .catch(() => {
        canCopyLink.value = false
        toastError(t('gdd_per_link.not-copied'))
      })
  }

  const copyLinkWithText = () => {
    navigator.clipboard
      .writeText(linkText)
      .then(() => {
        toastSuccess(t('gdd_per_link.link-and-text-copied'))
      })
      .catch(() => {
        canCopyLink.value = false
        toastError(t('gdd_per_link.not-copied'))
      })
  }

  const linkText = computed(() => {
    return `${link}
${store.state.firstName} ${t('transaction-link.send_you')} ${amount} Gradido.
"${memo}"
${t('gdd_per_link.credit-your-gradido')} ${t('gdd_per_link.validUntilDate', {
      date: d(new Date(validUntil), 'short'),
    })}
${t('gdd_per_link.link-hint')}`
  })

  return {
    canCopyLink,
    copyLink,
    copyLinkWithText,
    linkText,
  }
}
