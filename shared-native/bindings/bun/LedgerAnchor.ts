import { ptr } from 'bun:ffi'
import type { GrdtLedgerAnchorType } from '../..'
import { blockchain_core } from './library'

const registry = new FinalizationRegistry((handle: bigint) => {
  if (handle && blockchain_core.symbols.grdw_ledger_anchor_free) {
    blockchain_core.symbols.grdw_ledger_anchor_free(handle)
  }
})

export class LedgerAnchor {
  private _handle: bigint | null = null

  private constructor(handle: bigint) {
    this._handle = handle
    registry.register(this, handle)
  }

  static copy(original: bigint): LedgerAnchor {
    const handle = blockchain_core.symbols.grdw_ledger_anchor_create_copy(original)
    if (!handle) {
      throw new Error('Failed to copy LedgerAnchor')
    }
    return new LedgerAnchor(handle)
  }

  static createFromHieroTransactionId(
    transactionValidStart: { seconds: bigint; nanos?: number },
    hieroAccountId: { accountNum: bigint; shardNum?: bigint; realmNum?: bigint },
  ): LedgerAnchor {
    const handle = blockchain_core.symbols.grdw_ledger_anchor_create()
    if (!handle) {
      throw new Error('Failed to create new LedgerAnchor')
    }
    blockchain_core.symbols.grdw_ledger_anchor_assemble_hiero_transaction_id(
      handle,
      transactionValidStart.seconds,
      transactionValidStart.nanos,
      hieroAccountId.shardNum,
      hieroAccountId.realmNum,
      hieroAccountId.accountNum,
    )
    return new LedgerAnchor(handle)
  }

  // Getter
  public getType(): GrdtLedgerAnchorType {
    if (!this._handle) {
      throw new Error('Object not initialized')
    }
    const type = blockchain_core.symbols.grdw_ledger_anchor_get_type(this._handle)
    return blockchain_core.symbols.grdt_ledger_anchor_to_string(type)
  }

  public isLegacy(): boolean {
    if (!this._handle) {
      throw new Error('Object not initialized')
    }
    return blockchain_core.symbols.grdw_ledger_anchor_is_legacy(this._handle)
  }

  public isNodeTrigger(): boolean {
    if (!this._handle) {
      throw new Error('Object not initialized')
    }
    return blockchain_core.symbols.grdw_ledger_anchor_is_node_trigger(this._handle)
  }

  public isHieroTransactionId(): boolean {
    if (!this._handle) {
      throw new Error('Object not initialized')
    }
    return blockchain_core.symbols.grdw_ledger_anchor_is_hiero_transaction_id(this._handle)
  }

  public getLegacyId(): bigint {
    if (!this._handle) {
      throw new Error('Object not initialized')
    }
    return blockchain_core.symbols.grdw_ledger_anchor_get_legacy_id(this._handle)
  }

  public getNodeTriggerId(): bigint {
    if (!this._handle) {
      throw new Error('Object not initialized')
    }
    return blockchain_core.symbols.grdw_ledger_anchor_get_node_trigger_id(this._handle)
  }

  public getHieroTransactionId(): string | null {
    if (!this._handle) {
      throw new Error('Object not initialized')
    }
    const hieroTransactionIdPtr =
      blockchain_core.symbols.grdw_ledger_anchor_get_hiero_transaction_id(this._handle)
    if (!hieroTransactionIdPtr) {
      return null
    }

    const buffer = new Uint8Array(128)
    const bufferPtr = ptr(buffer)
    const written = Number(
      blockchain_core.symbols.grdw_hiero_transaction_id_to_string(
        bufferPtr,
        buffer.length,
        hieroTransactionIdPtr,
      ),
    )
    if (written === 0) {
      return null
    }
    if (written > buffer.length) {
      throw new Error(
        `Hiero Transaction Id String is to big, max expected: 128, actually: ${written}`,
      )
    }
    return Buffer.from(buffer).toString('utf8').slice(0, written)
  }
}
