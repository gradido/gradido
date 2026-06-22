import { TransactionSelect } from 'database'
import {
  AccountKeyPair,
  CompareError,
  DECAY_RESPITE_CENT,
  GradidoUnit,
  Result,
  TemporalGradidoUnit,
  VoidResult,
} from 'shared'
import { CONFIG } from '../../config'

export type DltUser = {
  publicKey: string | null
  communityUuid: string | null
}

export type DbUser = {
  communityUuid: string | null
  gradidoId: string
}

function abs<T extends number | bigint>(n: T): T {
  if (typeof n === 'bigint') {
    return (n < 0n ? -n : n) as T
  } else {
    return (n < 0 ? -n : n) as T
  }
}

export abstract class AbstractCompareConfirmedRole {
  abstract isIdentical(): Promise<VoidResult<CompareError>>

  isIdenticalDate(
    fieldName: string,
    dbValue?: Date | string | null,
    dltValue?: Date | string | null,
  ): VoidResult<CompareError> {
    let error: CompareError | undefined
    if (!dbValue) {
      error = new CompareError(`${fieldName} from db is missing`)
    } else if (!dltValue) {
      error = new CompareError(`${fieldName} from dlt is missing`)
    } else {
      const dbDate = dbValue instanceof Date ? dbValue : new Date(String(dbValue))
      const dltDate = dltValue instanceof Date ? dltValue : new Date(String(dltValue))
      if (isNaN(dbDate.getTime()) || isNaN(dltDate.getTime())) {
        error = new CompareError('dbDate and/or dltDate are invalid date(s)')
      } else {
        if (dbDate.getTime() !== dltDate.getTime()) {
          error = new CompareError(
            `${fieldName} mismatch`,
            `${dbDate.toISOString()} != ${dltDate.toISOString()}`,
          )
        }
      }
    }
    return error ? { success: false, error } : { success: true }
  }

  isIdenticalGdd(
    fieldName: string,
    dbValue?: GradidoUnit | null,
    dltValue?: GradidoUnit | null,
  ): VoidResult<CompareError> {
    let error: CompareError | undefined
    if (!dbValue) {
      error = new CompareError(`GDD ${fieldName} from db is missing`)
    } else if (!dltValue) {
      error = new CompareError(`GDD ${fieldName} from dlt connector is missing`)
    } else if (dbValue.comparedTo(dltValue) !== 0n) {
      error = new CompareError(
        `GDD ${fieldName} differ`,
        `${dbValue.toString(4)} != ${dltValue.toString(4)}`,
      )
    }

    return error ? { success: false, error } : { success: true }
  }

  compareAndGetDifference(
    fieldName: string,
    dbValue?: TemporalGradidoUnit | null,
    dltValue?: TemporalGradidoUnit | null,
  ): Result<GradidoUnit, CompareError> {
    let error: CompareError | undefined
    if (!dbValue) {
      error = new CompareError(`GDD ${fieldName} from db is missing`)
    } else if (!dltValue) {
      error = new CompareError(`GDD ${fieldName} from dlt connector is missing`)
    } else {
      const dbValueAtDltTime = dbValue.decayedTo(dltValue.balanceDate)
      const diff = dbValueAtDltTime.balance.comparedTo(dltValue.balance)
      if (abs(diff) > DECAY_RESPITE_CENT) {
        error = new CompareError(
          `GDD ${fieldName} differ`,
          `${dbValue.toString()} != ${dltValue.toString()}`,
        )
      } else {
        return { success: true, value: GradidoUnit.fromGradidoCent(diff) }
      }
    }

    return { success: false, error }
  }

  isIdenticalUser(dbUser?: DbUser | null, dltUser?: DltUser | null): VoidResult<CompareError> {
    let error: CompareError | undefined
    if (!dbUser) {
      error = new CompareError('User from db is missing')
    } else if (!dltUser || !dltUser.publicKey) {
      error = new CompareError('User from dlt is missing')
    } else if (!dltUser.communityUuid) {
      error = new CompareError('User Community Uuid from dlt connector is missing')
    } else if (dbUser.communityUuid !== dltUser.communityUuid) {
      error = new CompareError(
        "Community Uuids doesn't match",
        `${dbUser.communityUuid} != ${dltUser.communityUuid}`,
      )
    } else if (!CONFIG.HOME_COMMUNITY_SEED) {
      throw new CompareError('Missing Home Community Seed for calculating Account Key Pair')
    } else {
      const accountKeyPair = AccountKeyPair.fromSeedAndUserUuidAndAccountNumber(
        CONFIG.HOME_COMMUNITY_SEED,
        dbUser.gradidoId,
        1,
      )
      if (accountKeyPair.publicKeyString !== dltUser.publicKey) {
        error = new CompareError(
          "Public Keys doesn't match",
          `${accountKeyPair.publicKeyString} != ${dltUser.publicKey}`,
        )
      }
    }
    return error ? { success: false, error } : { success: true }
  }

  // check if both db transaction really belong to each other
  isTxPairing(tx: TransactionSelect, linkedTx: TransactionSelect): VoidResult<CompareError> {
    let error: CompareError | undefined
    if (linkedTx.typeId === tx.typeId) {
      error = new CompareError('tx and linkedTx have same typeId')
    } else if (tx.userId === linkedTx.userId) {
      error = new CompareError('tx.user and linkedTx.user are identical')
    } else if (tx.linkedUserId === linkedTx.linkedUserId) {
      error = new CompareError('tx.linkedUserId and linkedTx.linkedUserId are identical')
    } else if (tx.userId !== linkedTx.linkedUserId) {
      error = new CompareError('tx.user is not the same as linkedTx.linkedUserId')
    } else if (tx.linkedUserId !== linkedTx.userId) {
      error = new CompareError('tx.linkedUserId is not the same as linkedTx.userId')
    } else if (!tx.amount || !linkedTx.amount) {
      error = new CompareError('tx.amount or linkedTx.amount are missing')
    } else if (tx.amount.comparedTo(linkedTx.amount.negated()) !== 0n) {
      // in db on tx pair one has a reverted amount
      error = new CompareError('tx.amount is not the same as linkedTx.amount')
    } else if (tx.balanceDate.getTime() !== linkedTx.balanceDate.getTime()) {
      error = new CompareError('tx.balanceDate is not the same as linkedTx.balanceDate')
    } else if (tx.transactionLinkId !== linkedTx.transactionLinkId) {
      error = new CompareError(
        'tx.transactionLinkId and linkedTx.transactionLinkId are not identical',
      )
    }
    return error ? { success: false, error } : { success: true }
  }
}
