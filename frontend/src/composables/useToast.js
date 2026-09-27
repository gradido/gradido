import { useI18n } from 'vue-i18n'
import { useToastController } from 'bootstrap-vue-next'

export function useAppToast() {
  const { t } = useI18n()
  const { show } = useToastController()
  const toastSuccess = (message) => {
    toast(message, {
      title: t('success'),
      variant: 'success',
    })
  }

  const toastError = (message) => {
    toast(message, {
      // Not t('error'): in the wallet's locale files `error` is a group of messages, so it
      // answered with its own name and every red toast was titled "error", in every language.
      // This is the headline the wallet's error pages carry.
      title: t('message.errorTitle'),
      variant: 'danger',
    })
  }

  const toastInfo = (message) => {
    toast(message, {
      title: t('info'),
      variant: 'warning',
      bodyClass: 'gdd-toaster-body-darken',
    })
  }

  const toast = (message, options = {}) => {
    if (message.replace) message = message.replace(/^GraphQL error: /, '')
    options = {
      solid: true,
      toaster: 'b-toaster-top-right',
      headerClass: 'gdd-toaster-title',
      bodyClass: 'gdd-toaster-body',
      toastClass: 'gdd-toaster',
      ...options,
      body: message,
    }

    show({ props: { ...options } })
  }

  return {
    toastSuccess,
    toastError,
    toastInfo,
    toast,
  }
}
