/**
 * C function declarations for grdt_*_to_string are found in
 * {@link include/gradido_blockchain_core/types/}
 */

import { blockchain_core } from './library'

export function grdtAddressToString(addressType: number): string {
  return blockchain_core.symbols.grdt_address_to_string(addressType).toString()
}

export function grdtBalanceDerivationToString(addressType: number): string {
  return blockchain_core.symbols.grdt_balance_derivation_to_string(addressType).toString()
}

export function grdtCrossGroupToString(addressType: number): string {
  return blockchain_core.symbols.grdt_cross_group_to_string(addressType).toString()
}

export function grdtLedgerAnchorToString(addressType: number): string {
  return blockchain_core.symbols.grdt_ledger_anchor_to_string(addressType).toString()
}

export function grdtMemoKeyToString(addressType: number): string {
  return blockchain_core.symbols.grdt_memo_key_to_string(addressType).toString()
}

export function grdtTransactionToString(addressType: number): string {
  return blockchain_core.symbols.grdt_transaction_to_string(addressType).toString()
}
