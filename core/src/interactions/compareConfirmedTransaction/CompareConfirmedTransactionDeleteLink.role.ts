import { DltTransactionTransfer } from 'database'
import {
  AccountKeyPair,
  CompareError,
  CompleteTransaction,
  TemporalGradidoUnit,
  VoidResult,
} from 'shared'
import { AbstractCompareConfirmedRole } from './AbstractCompareConfirmed.role'

export class CompareConfirmedTransactionDeleteLinkRole extends AbstractCompareConfirmedRole {
  public constructor(
    protected confirmedTx: CompleteTransaction,
    protected dbTransaction: DltTransactionTransfer,
  ) {
    super()
  }

  async isIdentical(): Promise<VoidResult<CompareError>> {
    const transactionLink = this.dbTransaction.transactionLinkDeep
    if (!transactionLink) {
      // we throw because this should be already checked before calling into this interaction
      throw new CompareError('Missing transaction_links')
    }

    const recipientUser = this.dbTransaction.transactionLinkUser
    if (!recipientUser) {
      // we throw because this should be already checked before calling into this interaction
      throw new CompareError('Missing user from transaction_links')
    }

    const transactionType = this.confirmedTx.getTransactionType()

    if (transactionType !== 'GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER') {
      return {
        success: false,
        error: new CompareError(
          'Dlt transaction wrong type',
          transactionType,
          'GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER',
        ),
      }
    }
    const dltConfirmedAtTime = this.confirmedTx.getConfirmedAt().getTime()
    if (transactionLink.createdAt.getTime() > dltConfirmedAtTime) {
      return {
        success: false,
        error: new CompareError(
          'transaction link cannot be deleted before it was created',
          this.confirmedTx.getConfirmedAt().toISOString(),
          `>= ${transactionLink.createdAt.toISOString()}`,
        ),
      }
    }
    if (transactionLink.redeemedAt || transactionLink.redeemedBy) {
      return {
        success: false,
        error: new CompareError('transaction link cannot be deleted if it was redeemed'),
      }
    }
    if (transactionLink.validUntil.getTime() <= dltConfirmedAtTime) {
      return {
        success: false,
        error: new CompareError(
          'transaction link cannot be deleted manually after or at auto delete timestamp',
          this.confirmedTx.getConfirmedAt().toISOString(),
          `< ${transactionLink.validUntil.toISOString()}`,
        ),
      }
    }

    const result = this.isIdenticalGdd(
      'amount',
      transactionLink.amount,
      this.confirmedTx.getAmount(),
    )
    if (!result.success) {
      return result
    }

    const foundedAccountPublicKey = this.confirmedTx.getSenderPublicKey()
    if (!foundedAccountPublicKey) {
      return {
        success: false,
        error: new CompareError('Missing founding account public key for transaction link'),
      }
    }
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

    const dltRecipientUser = this.confirmedTx.getRecipientPublicKey()
    if (!dltRecipientUser) {
      return {
        success: false,
        error: new CompareError('Missing sender user in dlt data'),
      }
    }

    const dltRecipientUserCommunityUuid = this.confirmedTx.getRecipientCommunityUuid()
    if (!dltRecipientUserCommunityUuid) {
      return {
        success: false,
        error: new CompareError('Missing recipient user community uuid in dlt data'),
      }
    }

    return this.isIdenticalUser(recipientUser, dltRecipientUser, dltRecipientUserCommunityUuid)
  }
}
