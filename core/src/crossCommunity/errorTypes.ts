import { StatusMap } from 'elysia'

import { DomainError } from 'shared'

export class CrossCommunityApiError extends DomainError {
  public constructor(
    public readonly status: keyof StatusMap,
    public readonly message: string,
  ) {
    super(message)
  }
}

// short form for cross community api error
export const xcomApiError = (status: keyof StatusMap, message: string) => ({
  success: false as const,
  error: new CrossCommunityApiError(status, message),
})

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
// short form for cross community error
export const xcomError = (type: CrossCommunityErrorType, message: string) => ({
  success: false as const,
  error: new CrossCommunityError(type, message),
})
