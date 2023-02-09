export const toasters = {
  methods: {
    toastSuccess(message) {
      this.toast(message, {
        title: this.$t('success'),
        variant: 'success',
      })
    },
    toastError(message) {
      this.toast(message, {
        title: this.$t('error.error'),
        variant: 'danger',
        autoHideDelay: 5000,
      })
    },
    toastInfo(message) {
      this.toast(message, {
        title: this.$t('navigation.info'),
        variant: 'warning',
      })
    },
    toastInfoNoHide(message, { noAutoHide: true }) {
      this.toast(message, {
        title: this.$t('navigation.info'),
        variant: 'warning',
      })
    },
    toast(message, options) {
      if (message.replace) message = message.replace(/^GraphQL error: /, '')
      this.$root.$bvToast.toast(message, {
        appendToast: true,
        solid: true,
        toaster: 'b-toaster-top-right',
        headerClass: 'gdd-toaster-title',
        bodyClass: 'gdd-toaster-body',
        toastClass: 'gdd-toaster',
        ...options,
      })
    },
  },
}
