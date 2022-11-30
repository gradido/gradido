export const copyLinks = {
  props: {
    link: { type: String, required: true },
    amount: { type: String, required: true },
    memo: { type: String, required: true },
    validUntil: { type: String, required: true },
  },
  data() {
    return {
      canCopyLink: true,
    }
  },
  methods: {
    copyLink() {
      navigator.clipboard
        .writeText(this.link)
        .then(() => {
          this.toastSuccess(this.$t('gdd_per_link.link-copied'))
        })
        .catch(() => {
          this.canCopyLink = false
          this.toastError(this.$t('gdd_per_link.not-copied'))
        })
    },
    copyLinkWithText() {
      navigator.clipboard
        .writeText(
          `${this.link}
            ${this.$store.state.firstName} ${this.$t('transaction-link.send_you')} ${
            this.amount
          } Gradido.
            "${this.memo}"
            ${this.$t('gdd_per_link.credit-your-gradido')} ${this.$t(
            'gdd_per_link.validUntilDate',
            {
              date: this.$d(new Date(this.validUntil), 'short'),
            },
          )}
          ${this.$t('gdd_per_link.link-hint')}`,
        )
        .then(() => {
          this.toastSuccess(this.$t('gdd_per_link.link-and-text-copied'))
        })
        .catch(() => {
          this.canCopyLink = false
          this.toastError(this.$t('gdd_per_link.not-copied'))
        })
    },
  },
}
