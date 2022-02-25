export const toasters = {
  methods: {
    toastSuccess(message) {
      this.toast(message, {
        title: this.$t('success'),
        variant: 'success',
        headerClass: 'gdd-toaster-text-success',
        bodyClass: 'gdd-toaster-text-success',
      })
    },
    toastError(message) {
      this.toast(message, {
        title: this.$t('error.error'),
        variant: 'danger',
        headerClass: 'gdd-toaster-text-danger',
        bodyClass: 'gdd-toaster-text-danger',
      })
    },
    toast(message, options) {
      message = message.replace(/^GraphQL error: /, '')
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
