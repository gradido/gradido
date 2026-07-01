import { TransactionTypeId } from 'database'
import { AccountKeyPair, CompareError, VoidResult } from 'shared'
import { CONFIG } from '../../config'
import { DbUser, DltUser } from './AbstractCompareConfirmed.role'
import { CompareConfirmedTransferRole } from './CompareConfirmedTransfer.role'

export class CompareConfirmedTransactionRedeemLinkRole extends CompareConfirmedTransferRole {
  async isIdentical(): Promise<VoidResult<CompareError>> {
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

    if (!CONFIG.HOME_COMMUNITY_SEED) {
      throw new CompareError('Missing Home Community Seed for calculating Account Key Pair')
    }
    let user: DbUser | null = null
    if (this.dbTransaction.transaction?.typeId === TransactionTypeId.SEND) {
      user = this.dbTransaction.user
    } else if (this.dbTransaction.transaction?.typeId === TransactionTypeId.RECEIVE) {
      user = this.dbTransaction.linkedUser
    }
    if (!user) {
      throw new CompareError(`Couldn't find user`)
    }

    const accountKeyPair = AccountKeyPair.fromSeedAndUserUuidAndAccountNumber(
      CONFIG.HOME_COMMUNITY_SEED,
      user.gradidoId,
      1,
    )

    const dltSenderUserPublicKey = accountKeyPair.publicKeyString
    if (!dltSenderUserPublicKey) {
      return { success: false, error: new CompareError('Missing sender user in dlt data') }
    }

    const dltSenderUserCommunityUuid = this.confirmedTx.getSenderCommunityUuid()
    if (!dltSenderUserCommunityUuid) {
      return {
        success: false,
        error: new CompareError('Missing sender user community uuid in dlt data'),
      }
    }
    const dltSenderUser: DltUser = {
      publicKey: dltSenderUserPublicKey,
      communityUuid: dltSenderUserCommunityUuid,
    }

    const dltRecipientUserPublicKey = this.confirmedTx.getRecipientPublicKey()
    if (!dltRecipientUserPublicKey) {
      return { success: false, error: new CompareError('Missing recipient user in dlt data') }
    }

    const dltRecipientUserCommunityUuid = this.confirmedTx.getRecipientCommunityUuid()
    if (!dltRecipientUserCommunityUuid) {
      return {
        success: false,
        error: new CompareError('Missing recipient user community uuid in dlt data'),
      }
    }
    const dltRecipientUser: DltUser = {
      publicKey: dltRecipientUserPublicKey,
      communityUuid: dltRecipientUserCommunityUuid,
    }

    let result = await this.isIdenticalCommonPart(dltSenderUser, dltRecipientUser)
    if (!result.success) {
      return result
    }

    const transactionLink = this.dbTransaction.transactionLinkDeep
    if (!transactionLink) {
      // we throw because this should be already checked before calling into this interaction
      throw new CompareError('Missing transaction link')
    }
    const tx = this.dbTransaction.transaction
    if (!tx) {
      throw new CompareError('Missing transaction')
    }

    result = this.isIdenticalGdd(
      'amount',
      transactionLink.amount,
      tx.amount?.isNegative() ? tx.amount?.negated() : tx.amount,
    )
    if (!result.success) {
      return result
    }

    if (transactionLink.redeemedBy !== this.dbTransaction?.linkedUser?.id) {
      return {
        success: false,
        error: new CompareError(
          `TransactionLink.redeemedBy isn't correct, was link redeemed twice?`,
          transactionLink.redeemedBy?.toString(),
          this.dbTransaction?.linkedUser?.id.toString(),
        ),
      }
    }

    if (transactionLink.userId !== this.dbTransaction?.user?.id) {
      return {
        success: false,
        error: new CompareError(
          `TransactionLink.userId isn't correct`,
          transactionLink.userId?.toString(),
          this.dbTransaction?.user?.id.toString(),
        ),
      }
    }

    if (transactionLink.redeemedAt?.getTime() !== this.confirmedTx.getCreatedAt().getTime()) {
      return {
        success: false,
        error: new CompareError(
          `TransactionLink.redeemedAt isn't correct, is this the right link?`,
          transactionLink.redeemedAt?.toString(),
          this.confirmedTx.getCreatedAt().toString(),
        ),
      }
    }

    const foundedAccountPublicKey = this.confirmedTx.getSenderPublicKey()
    if (!foundedAccountPublicKey) {
      return {
        success: false,
        error: new CompareError('Missing founding account public key for redeem transaction link'),
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

    return { success: true }
  }
}
