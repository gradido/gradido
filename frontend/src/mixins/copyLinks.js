export const copyLinks = {
  props: {
    link: { type: String, required: true },
    amount: { type: String, required: true },
    memo: { type: String, required: true },
    validUntil: { type: String, required: true },
    text: { type: String, required: true },
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
        .writeText(this.text)
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
