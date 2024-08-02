let i18n

export const loadFilters = (_i18n) => {
  i18n = _i18n
  return { amount, GDD }
}

const amount = (value) => {
  if (!value && value !== 0) return ''
  return i18n.global.n(value.toString(), 'decimal').replace('-', '− ')
}

const GDD = (value) => {
  value = amount(value)
  if (value === '') return ''
  if (!value.match(/^− /) && !value.match(/^0[.,]00$/)) value = '+ ' + value
  return value + ' GDD'
}
