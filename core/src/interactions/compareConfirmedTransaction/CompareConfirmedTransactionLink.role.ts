import { DltTransactionDeferredTransfer } from 'database'
import { AccountKeyPair, CompareError, VoidResult } from 'shared'
import { CompleteTransaction } from 'shared-native'
import { AbstractCompareConfirmedRole } from './AbstractCompareConfirmed.role'

export class CompareConfirmedTransactionLinkRole extends AbstractCompareConfirmedRole {
  public constructor(
    protected confirmedTx: CompleteTransaction,
    protected dbTransaction: DltTransactionDeferredTransfer,
  ) {
    super()
  }
  isIdentical(): VoidResult<CompareError> {
    const transactionLink = this.dbTransaction.transactionLink
    if (!transactionLink) {
      // we throw because this should be already checked before calling into this interaction
      throw new CompareError('Missing transaction link')
    }

    if (this.confirmedTx.getTransactionType() !== 'GRDT_TRANSACTION_DEFERRED_TRANSFER') {
      return {
        success: false,
        error: new CompareError(
          'Dlt transaction wrong type',
          this.confirmedTx.getTransactionType(),
          'GRDT_TRANSACTION_DEFERRED_TRANSFER',
        ),
      }
    }

    const senderUser = this.dbTransaction.user
    if (!senderUser) {
      return { success: false, error: new CompareError('Missing sender user in db') }
    }

    const dltSenderUser = this.confirmedTx.getSenderPublicKey()
    if (!dltSenderUser) {
      return { success: false, error: new CompareError('Missing sender user in dlt data') }
    }

    const dltSenderCommunityUuid = this.confirmedTx.getSenderCommunityUuid()
    if (!dltSenderCommunityUuid) {
      return {
        success: false,
        error: new CompareError('Missing sender user community uuid in dlt data'),
      }
    }

    const foundedAccountPublicKey = this.confirmedTx.getRecipientPublicKey()
    if (!foundedAccountPublicKey) {
      return {
        success: false,
        error: new CompareError('Missing founding account public key for transaction link'),
      }
    }
    const foundedAccountPublicKeyHex = Buffer.from(foundedAccountPublicKey).toString('hex')

    const result = this.isIdenticalGdd(
      'amount with future decay',
      transactionLink.holdAvailableAmount,
      this.confirmedTx.getAmount(),
    )
    if (!result.success) {
      return result
    }

    // GRDT_ADDRESS_DEFERRED_TRANSFER
    const foundingAccount = AccountKeyPair.fromTransactionLinkCode(transactionLink.code)
    if (foundingAccount.publicKeyString !== foundedAccountPublicKeyHex) {
      return {
        success: false,
        error: new CompareError(
          "code hash as seed for ed25519 key pair generation don't produce correct public key",
          foundingAccount.publicKeyString,
          foundedAccountPublicKeyHex,
        ),
      }
    }

    // most expensive compare at the end
    return this.isIdenticalUser(senderUser, dltSenderUser, dltSenderCommunityUuid)
  }
}
