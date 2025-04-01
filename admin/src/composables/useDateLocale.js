import { useI18n } from 'vue-i18n'
import { de, enUS as en, fr, es, nl } from 'date-fns/locale'

const locales = { en, de, es, fr, nl }

export function useDateLocale() {
  const { locale } = useI18n()
  const dateLocale = locales[locale.value] || en
  return dateLocale
}
