import Vue from 'vue'
import VueI18n from 'vue-i18n'

import en from 'vee-validate/dist/locale/en'
import de from 'vee-validate/dist/locale/de'

Vue.use(VueI18n)

function loadLocaleMessages() {
  const locales = require.context('./locales', true, /[A-Za-z0-9-_,\s]+\.json$/i)
  const messages = {}
  locales.keys().forEach((key) => {
    const matched = key.match(/([A-Za-z0-9-_]+)\./i)
    if (matched && matched.length > 1) {
      const locale = matched[1]
      messages[locale] = locales(key)
      if (locale === 'de') {
        messages[locale] = {
          validations: de,
          ...messages[locale],
        }
      }
      if (locale === 'en') {
        messages[locale] = {
          validations: en,
          ...messages[locale],
        }
      }
    }
  })
  return messages
}

const numberFormats = {
  'en-US': {
    currency: {
      style: 'currency',
      currency: 'GDD',
      abbreviate: true,
    },
  },
  'de-DE': {
    currency: {
      style: 'currency',
      currency: 'GDD',
      abbreviate: true,
    },
  },
}

export default new VueI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: loadLocaleMessages(),
  numberFormats,
})
