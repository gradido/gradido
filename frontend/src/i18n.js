import Vue from 'vue'
import VueI18n from 'vue-i18n'

import en from 'vee-validate/dist/locale/en'
import de from 'vee-validate/dist/locale/de'
import es from 'vee-validate/dist/locale/es'

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
      if (locale === 'es') {
        messages[locale] = {
          validations: es,
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
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
    },
    monthShort: {
      month: 'short',
    },
    month: {
      month: 'long',
    },
    year: {
      year: 'numeric',
    },
    monthAndYear: {
      month: 'long',
      year: 'numeric',
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
      month: 'long',
      year: 'numeric',
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
    },
    monthShort: {
      month: 'short',
    },
    month: {
      month: 'long',
    },
    year: {
      year: 'numeric',
    },
    monthAndYear: {
      month: 'long',
      year: 'numeric',
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
