import i18n from '@/i18n.js'

export const amount = (value) => {
  if (!value) return ''
  return i18n.n(value.toString(), 'decimal').replace('-', '− ')
}
