export const createFilters = (i18n) => {
  const formatAmount = (value) => {
    if (value === null || value === undefined) return ''
    try {
      const numValue = Number(value)
      if (isNaN(numValue)) return ''
      return i18n.global.n(numValue, 'decimal').replace('-', '− ')
    } catch (error) {
      console.error('Error formatting amount:', error)
      return ''
    }
  }

  const formatGDD = (value) => {
    const formattedAmount = formatAmount(value)
    if (formattedAmount === '') return ''

    const numValue = Number(value)
    if (isNaN(numValue)) return formattedAmount + ' GDD'

    const prefix = numValue > 0 ? '+ ' : numValue < 0 ? '' : ''
    return prefix + formattedAmount + ' GDD'
  }

  return { amount: formatAmount, GDD: formatGDD }
}
