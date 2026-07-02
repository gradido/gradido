const GRDT_BALANCE_DERIVATION_TYPES = [
  'GRDT_BALANCE_DERIVATION_UNSPECIFIED',
  'GRDT_BALANCE_DERIVATION_NODE',
  'GRDT_BALANCE_DERIVATION_EXTERN',
]

// The type is derived directly from the array
// for runtime check
function isGrdtBalanceDerivationType(input) {
  return GRDT_BALANCE_DERIVATION_TYPES.includes(input)
}

module.exports = {
  GRDT_BALANCE_DERIVATION_TYPES,
  isGrdtBalanceDerivationType,
}

