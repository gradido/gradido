import { DltTransactionWithTransactionLink } from 'database'
import { AccountKeyPair, CompareError, VoidResult } from 'shared'
import { CheckedTransactionInput, TransactionType } from '../../apis'
import { AbstractCompareConfirmedRole } from './AbstractCompareConfirmed.role'

export class CompareConfirmedTransactionLinkRole extends AbstractCompareConfirmedRole {
  public constructor(
    protected confirmedTx: CheckedTransactionInput,
    protected dbTransaction: DltTransactionWithTransactionLink,
  ) {
    super()
  }
  isIdentical(): VoidResult<CompareError> {
    const transactionLink = this.dbTransaction.transactionLink
    if (!transactionLink) {
      // we throw because this should be already checked before calling into this interaction
      throw new CompareError('Missing transaction link')
    }

    if (this.confirmedTx.transactionType !== TransactionType.GRDT_TRANSACTION_DEFERRED_TRANSFER) {
      return {
        success: false,
        error: new CompareError(
          'Dlt transaction wrong type',
          this.confirmedTx.transactionType,
          TransactionType.GRDT_TRANSACTION_DEFERRED_TRANSFER,
        ),
      }
    }

    const senderUser = this.dbTransaction.user
    if (!senderUser) {
      return { success: false, error: new CompareError('Missing sender user in db') }
    }

    const dltSenderUser = this.confirmedTx.sender
    if (!dltSenderUser) {
      return { success: false, error: new CompareError('Missing sender user in dlt data') }
    }

    const foundedAccountPublicKey = this.confirmedTx.recipient?.publicKey
    if (!foundedAccountPublicKey) {
      return {
        success: false,
        error: new CompareError('Missing founding account public key for transaction link'),
      }
    }

    if (this.confirmedTx.recipient?.communityUuid !== dltSenderUser.communityUuid) {
      return {
        success: false,
        error: new CompareError(
          'Community uuid mismatch',
          `${this.confirmedTx.recipient?.communityUuid} != ${dltSenderUser.communityUuid}`,
        ),
      }
    }

    const result = this.isIdenticalGdd(
      'amount with future decay',
      transactionLink.holdAvailableAmount,
      this.confirmedTx.amount,
    )
    if (!result.success) {
      return result
    }

    // GRDT_ADDRESS_DEFERRED_TRANSFER
    const foundingAccount = AccountKeyPair.fromTransactionLinkCode(transactionLink.code)
    if (foundingAccount.publicKeyString !== foundedAccountPublicKey) {
      return {
        success: false,
        error: new CompareError(
          "code hash as seed for ed25519 key pair generation don't produce correct public key",
          foundingAccount.publicKeyString,
          foundedAccountPublicKey,
        ),
      }
    }

    // most expensive compare at the end
    return this.isIdenticalUser(senderUser, dltSenderUser)
  }
}
