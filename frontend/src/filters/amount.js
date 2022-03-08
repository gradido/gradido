let i18n

export const loadFilters = (_i18n) => {
  i18n = _i18n
  return { amount }
}

const amount = (value) => {
  if (!value) return ''
  return i18n.n(value.toString(), 'decimal').replace('-', '− ')
}
