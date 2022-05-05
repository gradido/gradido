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
      // Wolle
      console.log('errorCode: ', errorCode)
      console.log('localesIdentifier: ', localesIdentifier)
      if (this.$te(localesIdentifier)) {
        // eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys
        errorMessage = this.$t(localesIdentifier)
        // Wolle
        console.log('localesIdentifier exists !!!')
      } else if (Object.prototype.hasOwnProperty.call(ERRORS_DESCRIPTION, errorCode)) {
        errorMessage = this.$t('error.unknown-error') + ERRORS_DESCRIPTION[errorCode]
        // Wolle
        console.log('ERRORS_DESCRIPTION exists !!!')
      } else {
        errorMessage = this.$t('error.unknown-error') + message
        // Wolle
        console.log('error.unknown-error !!!')
      }
      return errorMessage
    },
  },
}
