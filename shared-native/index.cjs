const isBun = typeof process !== 'undefined' && 'bun' in process.versions

const { isGrdtAddressType, GRDT_ADDRESS_TYPES } = require('./types/GrdtAddressType')
const { isGrdtTransactionType, GRDT_TRANSACTION_TYPES } = require('./types/GrdtTransactionType')
const {
  isGrdtBalanceDerivationType,
  GRDT_BALANCE_DERIVATION_TYPES,
} = require('./types/GrdtBalanceDerivationType')
const { isGrdtCrossGroupType, GRDT_CROSS_GROUP_TYPES } = require('./types/GrdtCrossGroupType')
const { isGrdtLedgerAnchorType, GRDT_LEDGER_ANCHOR_TYPES } = require('./types/GrdtLedgerAnchorType')
const { isGrdtMemoKeyType, GRDT_MEMO_KEY_TYPES } = require('./types/GrdtMemoKeyType')

let nativeBinding
if (!isBun) {
  nativeBinding = require('./build/shared_native.node')
} else {
  // bun cannot handle NodeJs Native Addons build with mingw32 or clang (zig as c compiler)
  // on windows (at the moment), so we use direct ffi instead
  // direct ffi with bun should be also faster as using NAPI so we use it also on other platforms
  nativeBinding = require('./bindings/bun')
}

module.exports = {
  ...nativeBinding,
  isGrdtAddressType,
  GRDT_ADDRESS_TYPES,
  isGrdtTransactionType,
  GRDT_TRANSACTION_TYPES,
  isGrdtBalanceDerivationType,
  GRDT_BALANCE_DERIVATION_TYPES,
  isGrdtCrossGroupType,
  GRDT_CROSS_GROUP_TYPES,
  isGrdtLedgerAnchorType,
  GRDT_LEDGER_ANCHOR_TYPES,
  isGrdtMemoKeyType,
  GRDT_MEMO_KEY_TYPES,
}
