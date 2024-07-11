import { createI18n } from 'vue-i18n'

const loadLocaleMessages = () => {
  const locales = require.context('./locales/', true, /[A-Za-z0-9-_,\s]+\.json$/i)
  const messages = {}
  locales.keys().forEach((key) => {
    const matched = key.match(/([A-Za-z0-9-_]+)\./i)
    if (matched && matched.length > 1) {
      const locale = matched[1]
      messages[locale] = locales(key)
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

const datetimeFormats = {
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
  },
}

const i18n = createI18n({
  locale: 'en',
  legacy: false,
  fallbackLocale: 'en',
  messages: loadLocaleMessages(),
  numberFormats,
  datetimeFormats,
})

export default i18n
