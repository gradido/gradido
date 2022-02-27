import Decimal from 'decimal.js-light'

Decimal.set({
  precision: 25,
  rounding: Decimal.ROUND_HALF_UP,
})

export default Decimal
