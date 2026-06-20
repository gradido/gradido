// CompleteTransaction.wrapper.ts
import {
  type ErrorDetails,
  type GrdtTransactionType,
  type LedgerAnchor,
  NativeCompleteTransaction,
  type VoidResult,
} from 'shared-native'
import { Duration } from './Duration'
import { GradidoUnit } from './GradidoUnit'
import { TemporalGradidoUnit } from './TemporalGradidoUnit'

/**
 * Wrapper for the native CompleteTransaction class.
 *
 * All methods are passed through to the native instance, except:
 * - `getAmount()`: returns `GradidoUnit` instead of `bigint`
 * - `getAccountBalanceForPublicKey()`: returns `{ balance: GradidoUnit; coinCommunityUuid: string }`
 */
export class CompleteTransaction {
  private _native: NativeCompleteTransaction

  constructor() {
    this._native = new NativeCompleteTransaction()
  }

  // ─── Native methods with modified return types ───

  /**
   * Initializes the transaction from a serialized protobuf buffer.
   * @param serialized - Protobuf-serialized transaction in base64 encoded string
   * @param communityUuid - Community UUID as string(36)
   */
  public initFromProtobuf(serialized: string, communityUuid: string): VoidResult {
    return this._native.initFromProtobuf(Buffer.from(serialized, 'base64'), communityUuid)
  }

  /**
   * Validates the transaction.
   * @param verifySignatures - Whether to verify cryptographic signatures (default: true)
   */
  public validate(verifySignatures: boolean = true): VoidResult<ErrorDetails> {
    return this._native.validate(verifySignatures)
  }

  /**
   * Returns the confirmation timestamp of the transaction.
   */
  public getConfirmedAt(): Date {
    return this._native.getConfirmedAt()
  }

  /**
   * Returns the creation timestamp of the transaction.
   */
  public getCreatedAt(): Date {
    return this._native.getCreatedAt()
  }

  /**
   * Returns the ledger anchor of the transaction.
   */
  public getLedgerAnchor(): LedgerAnchor {
    return this._native.getLedgerAnchor()
  }

  /**
   * Returns the sender's public key as hex string, or null if not applicable.
   */
  public getSenderPublicKey(): string | null {
    const publicKey = this._native.getSenderPublicKey()
    if (publicKey) {
      return Buffer.from(publicKey).toString('hex')
    }
    return null
  }

  /**
   * Returns the recipient's public key as hex string, or null if not applicable.
   */
  public getRecipientPublicKey(): string | null {
    const publicKey = this._native.getRecipientPublicKey()
    if (publicKey) {
      return Buffer.from(publicKey).toString('hex')
    }
    return null
  }

  /**
   * Returns the sender's community UUID as string, or null if not applicable.
   */
  public getSenderCommunityUuid(): string | null {
    return this._native.getSenderCommunityUuid()
  }

  /**
   * Returns the recipient's community UUID as string, or null if not applicable.
   */
  public getRecipientCommunityUuid(): string | null {
    return this._native.getRecipientCommunityUuid()
  }

  /**
   * Returns the registered account public key as hex string, or null if not applicable.
   */
  public getRegisteredAccount(): string | null {
    const publicKey = this._native.getRegisteredAccount()
    if (publicKey) {
      return Buffer.from(publicKey).toString('hex')
    }
    return null
  }

  /**
   * Returns the transaction amount as GradidoUnit.
   * Returns 0 GDD if the transaction type has no amount (e.g., REGISTER_ADDRESS).
   */
  public getAmount(): GradidoUnit {
    const gddCent = this._native.getAmount()
    return GradidoUnit.fromGradidoCent(BigInt(gddCent))
  }

  /**
   * Returns the balance of a given public key for this transaction.
   * @param publicKey - Public key hex string(64)
   * @returns Object with balance as TemporalGradidoUnit and coinCommunityUuid, or null if not found.
   */
  public getAccountBalanceForPublicKey(
    publicKey: string,
  ): { balance: TemporalGradidoUnit; coinCommunityUuid: string } | null {
    const result = this._native.getAccountBalanceForPublicKey(publicKey)
    if (!result) {
      return null
    }
    return {
      balance: new TemporalGradidoUnit(
        GradidoUnit.fromGradidoCent(result.balance),
        this.getConfirmedAt(),
      ),
      coinCommunityUuid: result.coinCommunityUuid,
    }
  }

  /**
   * Returns the transaction type as a string.
   */
  public getTransactionType(): GrdtTransactionType {
    return this._native.getTransactionType()
  }

  /**
   * Returns the target date of the transaction, or null if not applicable.
   */
  public getTargetDate(): Date | null {
    return this._native.getTargetDate()
  }

  /**
   * Returns the timeout duration in seconds, or 0n if not applicable.
   */
  public getTimeoutDuration(): Duration {
    return new Duration(this._native.getTimeoutDuration())
  }
}
