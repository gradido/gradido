import { ERRORS_DESCRIPTION } from '@/config/errors'

export const errorMessageRemoveGraphQl = (message) => {
  return message.replace(/^GraphQL error: /, '')
}

export const errors = {
  methods: {
    translateErrorMessage(message) {
      let errorMessage = errorMessageRemoveGraphQl(message)
      if (this.$te(errorMessage)) {
        // eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys
        errorMessage = this.$t(errorMessage)
      } else if (Object.prototype.hasOwnProperty.call(ERRORS_DESCRIPTION, errorMessage)) {
        errorMessage = this.$t('error.unknown-error') + ERRORS_DESCRIPTION[errorMessage]
      } else {
        errorMessage = this.$t('error.unknown-error') + message
      }
      return errorMessage
    },
  },
}
