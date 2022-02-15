export const toasters = {
  methods: {
    toastSuccess(message) {
      this.toast(message, {
        title: this.$t('success'),
        variant: 'danger',
      })
    },
    toastError(message) {
      this.toast(message, {
        title: this.$t('error.error'),
        variant: 'success',
      })
    },
    toast(message, options) {
      this.$bvToast.toast(message, {
        autoHideDelay: 5000,
        appendToast: false,
        solid: true,
        ...options,
      })
    },
  },
}
