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
  en: {
    decimal: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
    ungroupedDecimal: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: false,
    },
  },
  de: {
    decimal: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
    ungroupedDecimal: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: false,
    },
  },
}

const dateTimeFormats = {
  en: {
    short: {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    },
    long: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
    },
  },
  de: {
    short: {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    },
    long: {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
    },
  },
}

export default new VueI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: loadLocaleMessages(),
  numberFormats,
  dateTimeFormats,
})
