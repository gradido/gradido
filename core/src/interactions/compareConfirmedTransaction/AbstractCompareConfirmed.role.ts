import { TransactionSelect, UserSelectIdentity as UserSelect } from 'database'
import { AccountKeyPair, CompareError, GradidoUnit, VoidResult } from 'shared'
import { TransactionParty } from '../../apis'
import { CONFIG } from '../../config'

export abstract class AbstractCompareConfirmedRole {
  abstract isIdentical(): VoidResult<CompareError>
  isIdenticalGdd(
    fieldName: string,
    dbValue?: GradidoUnit | null,
    dltValue?: string | null,
  ): VoidResult<CompareError> {
    let error: CompareError | undefined
    if (!dbValue) {
      error = new CompareError(`GDD ${fieldName} from db is missing`)
    } else if (!dltValue) {
      error = new CompareError(`GDD ${fieldName} from dlt connector is missing`)
    } else if (dbValue.comparedTo(GradidoUnit.fromString(dltValue)) !== 0n) {
      error = new CompareError(`GDD ${fieldName} differ`, `${dbValue.toString(4)} != ${dltValue}`)
    }

    return error ? { success: false, error } : { success: true }
  }

  isIdenticalUser(
    dbUser?: UserSelect | null,
    transactionParty?: TransactionParty | null,
  ): VoidResult<CompareError> {
    let error: CompareError | undefined
    if (!dbUser) {
      error = new CompareError('User from db is missing')
    } else if (!transactionParty) {
      error = new CompareError('User from dlt connector is missing')
    } else if (dbUser.communityUuid !== transactionParty.communityUuid) {
      error = new CompareError(
        "Community Uuids doesn't match",
        `${dbUser.communityUuid} != ${transactionParty.communityUuid}`,
      )
    } else if (!CONFIG.HOME_COMMUNITY_SEED) {
      error = new CompareError('Missing Home Community Seed for calculating Account Key Pair')
    } else {
      const accountKeyPair = AccountKeyPair.fromSeedAndUserUuidAndAccountNumber(
        CONFIG.HOME_COMMUNITY_SEED,
        dbUser.gradidoId,
        1,
      )
      if (accountKeyPair.publicKeyString !== transactionParty.publicKey) {
        error = new CompareError(
          "Public Keys doesn't match",
          `${accountKeyPair.publicKeyString} != ${transactionParty.publicKey}`,
        )
      }
    }
    return error ? { success: false, error } : { success: true }
  }

  // check if both db transaction really belong to each other
  isTxPairing(tx: TransactionSelect, linkedTx: TransactionSelect): VoidResult<CompareError> {
    let error: CompareError | undefined
    if (linkedTx.typeId === tx.typeId) {
      error = new CompareError('Db transaction and linked transaction have same typeId')
    } else if (tx.userId === linkedTx.userId) {
      error = new CompareError('transaction user and linked transaction user are identical')
    } else if (tx.linkedUserId === linkedTx.linkedUserId) {
      error = new CompareError(
        'transaction linkedUserId and linked transaction linkedUserId are identical',
      )
    } else if (tx.userId !== linkedTx.linkedUserId || tx.linkedUserId !== linkedTx.userId) {
      error = new CompareError('transaction user is not the same as linked transaction linked user')
    } else if (tx.linkedUserId !== linkedTx.userId) {
      error = new CompareError('transaction linked user is not the same as linked transaction user')
    } else if (tx.amount !== linkedTx.amount) {
      error = new CompareError('transaction amount is not the same as linked transaction amount')
    } else if (tx.balanceDate !== linkedTx.balanceDate) {
      error = new CompareError(
        'transaction balanceDate is not the same as linked transaction balanceDate',
      )
    } else if (tx.transactionLinkId !== linkedTx.transactionLinkId) {
      error = new CompareError('transactionLinkId are not identical')
    }
    return error ? { success: false, error } : { success: true }
  }
}
