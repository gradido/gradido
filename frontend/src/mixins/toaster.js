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
      })
    },
    toast(message, options) {
      if (message.replace) message = message.replace(/^GraphQL error: /, '')
      this.$bvToast.toast(message, {
        autoHideDelay: 5000,
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
