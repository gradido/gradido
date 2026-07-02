const os = require('node:os')

const isBun = typeof process !== 'undefined' && 'bun' in process.versions
const isWindows = os.platform() === 'win32'

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
if (isBun && isWindows) {
  nativeBinding = require('./build/shared_native.bun.node')
} else {
  nativeBinding = require('./build/shared_native.node')
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
