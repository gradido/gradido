import { useI18n } from 'vue-i18n'
import { useToast } from 'bootstrap-vue-next'

export function useAppToast() {
  const { t } = useI18n()
  const { show } = useToast()
  const toastSuccess = (message) => {
    toast(message, {
      title: t('success'),
      variant: 'success',
    })
  }

  const toastError = (message) => {
    toast(message, {
      title: t('error'),
      variant: 'danger',
    })
  }

  const toastInfo = (message) => {
    toast(message, {
      title: t('navigation.info'),
      variant: 'warning',
      bodyClass: 'gdd-toaster-body--darken',
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
