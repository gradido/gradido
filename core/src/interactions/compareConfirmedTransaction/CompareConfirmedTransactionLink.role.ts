import { DltTransactionDeferredTransfer } from 'database'
import { AccountKeyPair, CompareError, CompleteTransaction, Duration, VoidResult } from 'shared'
import { AbstractCompareConfirmedRole } from './AbstractCompareConfirmed.role'

export class CompareConfirmedTransactionLinkRole extends AbstractCompareConfirmedRole {
  public constructor(
    protected confirmedTx: CompleteTransaction,
    protected dbTransaction: DltTransactionDeferredTransfer,
  ) {
    super()
  }
  isIdentical(): Promise<VoidResult<CompareError>> {
    const transactionLink = this.dbTransaction.transactionLink
    if (!transactionLink) {
      // we throw because this should be already checked before calling into this interaction
      throw new CompareError('Missing transaction link')
    }

    if (this.confirmedTx.getTransactionType() !== 'GRDT_TRANSACTION_DEFERRED_TRANSFER') {
      return Promise.resolve({
        success: false,
        error: new CompareError(
          'Dlt transaction wrong type',
          this.confirmedTx.getTransactionType(),
          'GRDT_TRANSACTION_DEFERRED_TRANSFER',
        ),
      })
    }

    let result = this.isIdenticalDate(
      'createdAt',
      this.dbTransaction.transactionLink?.createdAt,
      this.confirmedTx.getCreatedAt(),
    )
    if (!result.success) {
      return Promise.resolve(result)
    }

    const senderUser = this.dbTransaction.user
    if (!senderUser) {
      return Promise.resolve({
        success: false,
        error: new CompareError('Missing sender user in db'),
      })
    }

    const dltSenderUser = this.confirmedTx.getSenderPublicKey()
    if (!dltSenderUser) {
      return Promise.resolve({
        success: false,
        error: new CompareError('Missing sender user in dlt data'),
      })
    }

    const dltSenderCommunityUuid = this.confirmedTx.getSenderCommunityUuid()
    if (!dltSenderCommunityUuid) {
      return Promise.resolve({
        success: false,
        error: new CompareError('Missing sender user community uuid in dlt data'),
      })
    }
    const dbLinkDuration = Duration.fromDateDiff(
      new Date(transactionLink.createdAt),
      new Date(transactionLink.validUntil),
    )
    const dltDuration = this.confirmedTx.getTimeoutDuration()
    if (dbLinkDuration.comparedTo(dltDuration) !== 0n) {
      return Promise.resolve({
        success: false,
        error: new CompareError(
          'Link duration differ',
          `db link duration: ${dbLinkDuration.toString(4)} != dlt link duration: ${dltDuration.toString(4)}`,
        ),
      })
    }

    const foundedAccountPublicKey = this.confirmedTx.getRecipientPublicKey()
    if (!foundedAccountPublicKey) {
      return Promise.resolve({
        success: false,
        error: new CompareError('Missing founding account public key for transaction link'),
      })
    }

    result = this.isIdenticalGdd(
      'amount with future decay',
      transactionLink.holdAvailableAmount,
      this.confirmedTx.getAmount(),
    )
    if (!result.success) {
      return Promise.resolve(result)
    }

    // TODO: think if it make sense to check the balance of last transaction and calculate decay until transaction link creation date

    // GRDT_ADDRESS_DEFERRED_TRANSFER
    const foundingAccount = AccountKeyPair.fromTransactionLinkCode(transactionLink.code)
    if (foundingAccount.publicKeyString !== foundedAccountPublicKey) {
      return Promise.resolve({
        success: false,
        error: new CompareError(
          "code hash as seed for ed25519 key pair generation don't produce correct public key",
          foundingAccount.publicKeyString,
          foundedAccountPublicKey,
        ),
      })
    }

    // most expensive compare at the end
    return Promise.resolve(this.isIdenticalUser(senderUser, dltSenderUser, dltSenderCommunityUuid))
  }
}
