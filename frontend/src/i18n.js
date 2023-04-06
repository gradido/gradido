import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

function loadLocaleMessages() {
  const locales = require.context('./locales', true, /[A-Za-z0-9-_,\s]+\.json$/i)
  const messages = {}
  locales.keys().forEach((key) => {
    const matched = key.match(/([A-Za-z0-9-_]+)\./i)
    if (matched && matched.length > 1) {
      const locale = matched[1]
      messages[locale] = {
        validations: require(`vee-validate/dist/locale/${locale}`),
        ...locales(key),
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
  es: {
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
  fr: {
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
  nl: {
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
    time: {
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
      month: 'long',
      year: 'numeric',
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
    time: {
      hour: 'numeric',
      minute: 'numeric',
    },
  },
  es: {
    short: {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    },
    long: {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
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
    time: {
      hour: 'numeric',
      minute: 'numeric',
    },
  },
  fr: {
    short: {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    },
    long: {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
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
    time: {
      hour: 'numeric',
      minute: 'numeric',
    },
  },
  nl: {
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
    time: {
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
