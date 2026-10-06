/**
 * The entry point. Loading the addon by a path relative to this file keeps the
 * caller's working directory out of it.
 *
 * The enum tables in `types/` are plain JavaScript rather than part of the addon: their
 * indices are the C enum values, so they are the one place a TypeScript caller and the
 * blockchain core have to agree. `grdt*ToString` from the addon checks that agreement.
 */

const os = require('node:os')

const isBun = typeof process !== 'undefined' && 'bun' in process.versions
const isWindows = os.platform() === 'win32'

const { isGrdtAddressType, GRDT_ADDRESS_TYPES } = require('./types/GrdtAddressType')
const { isGrdtTransactionType, GRDT_TRANSACTION_TYPES } = require('./types/GrdtTransactionType')
const { isGrdtCrossGroupType, GRDT_CROSS_GROUP_TYPES } = require('./types/GrdtCrossGroupType')
const { isGrdtLedgerAnchorType, GRDT_LEDGER_ANCHOR_TYPES } = require('./types/GrdtLedgerAnchorType')
const { isGrdtMemoKeyType, GRDT_MEMO_KEY_TYPES } = require('./types/GrdtMemoKeyType')

let nativeBinding
try {
  // On Windows, Bun resolves the Node-API from bun.exe, so it gets its own
  // addon. Everywhere else one file serves both runtimes.
  nativeBinding =
    isBun && isWindows
      ? require('./build/shared_native.bun.node')
      : require('./build/shared_native.node')
} catch (cause) {
  throw new Error('the native addon is not built - run `bun run build` in shared-native', { cause })
}

module.exports = {
  ...nativeBinding,
  isGrdtAddressType,
  GRDT_ADDRESS_TYPES,
  isGrdtTransactionType,
  GRDT_TRANSACTION_TYPES,
  isGrdtCrossGroupType,
  GRDT_CROSS_GROUP_TYPES,
  isGrdtLedgerAnchorType,
  GRDT_LEDGER_ANCHOR_TYPES,
  isGrdtMemoKeyType,
  GRDT_MEMO_KEY_TYPES,
}
