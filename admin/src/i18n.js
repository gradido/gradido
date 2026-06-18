import { createI18n } from 'vue-i18n'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import nl from './locales/nl.json'
import it from './locales/it.json'
import tr from './locales/tr.json'
import ru from './locales/ru.json'
import pt from './locales/pt.json'
import el from './locales/el.json'

const decimalFormat = {
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
}

const numberFormats = {
  en: decimalFormat,
  de: decimalFormat,
  es: decimalFormat,
  fr: decimalFormat,
  nl: decimalFormat,
  it: decimalFormat,
  tr: decimalFormat,
  ru: decimalFormat,
  pt: decimalFormat,
  el: decimalFormat,
}

const datetimeFormatEn = {
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
}

const datetimeFormatDayFirst = {
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
}

const datetimeFormats = {
  en: datetimeFormatEn,
  de: datetimeFormatDayFirst,
  es: datetimeFormatDayFirst,
  fr: datetimeFormatDayFirst,
  nl: datetimeFormatDayFirst,
  it: datetimeFormatDayFirst,
  tr: datetimeFormatDayFirst,
  ru: datetimeFormatDayFirst,
  pt: datetimeFormatDayFirst,
  el: datetimeFormatDayFirst,
}

const i18n = createI18n({
  locale: 'en',
  legacy: false,
  fallbackLocale: 'en',
  messages: { de, en, es, fr, nl, it, tr, ru, pt, el },
  numberFormats,
  datetimeFormats,
})

export default i18n
