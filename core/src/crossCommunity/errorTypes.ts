import { DomainError } from 'shared'

export enum CrossCommunityErrorType {
  previousUserTxNotFinished,
  insufficientBalance,
  apiCallFailed,
  foreignPrepareSendCoinFailed,
  insertPendingTxFailed,
  insertTxFailed,
  foreignRevertSendCoinFailed,
  foreignRevertSettledSendCoinFailed,
  authFailed,
  notFound,
  unknown,
  invalidTransactionOrder,
}

export class CrossCommunityError extends DomainError {
  public constructor(
    public readonly type: CrossCommunityErrorType,
    public readonly message: string,
  ) {
    super(message)
  }
}

// shot form for cross community error
export const xcomError = (type: CrossCommunityErrorType, message: string) => ({
  success: false as const,
  error: new CrossCommunityError(type, message),
})
