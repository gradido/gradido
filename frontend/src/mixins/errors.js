import { ERRORS_DESCRIPTION } from '@/config/errors'

export const errorMessageRemoveGraphQl = (message) => {
  return message.replace(/^GraphQL error: /, '')
}

export const errors = {
  methods: {
    translateErrorMessage(message) {
      let errorMessage
      const errorCode = errorMessageRemoveGraphQl(message)
      const localesIdentifier = 'error.backend.' + errorCode
      if (this.$te(localesIdentifier)) {
        // eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys
        errorMessage = this.$t(localesIdentifier)
      } else if (Object.prototype.hasOwnProperty.call(ERRORS_DESCRIPTION, errorCode)) {
        errorMessage = this.$t('error.unknown-error') + ERRORS_DESCRIPTION[errorCode]
      } else {
        errorMessage = this.$t('error.unknown-error') + message
      }
      return errorMessage
    },
  },
}
