// AI-GENERATED — not an architecture reference
import type { Locale } from 'date-fns'
import { de, enUS as en, es, fr, nl } from 'date-fns/locale'
import { useI18n } from 'vue-i18n'

const locales: Record<string, Locale> = { en, de, es, fr, nl }

export function useDateLocale() {
  const { locale } = useI18n()
  const dateLocale = locales[locale.value] || en
  return dateLocale
}
