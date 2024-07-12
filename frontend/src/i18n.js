import { createI18n } from 'vue-i18n'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import nl from './locales/nl.json'
import tr from './locales/tr.json'

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

export default createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: { de, en, es, fr, tr, nl },
  numberFormats,
  dateTimeFormats,
})
