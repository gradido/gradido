import { StatusMap } from 'elysia'
import { DomainError } from 'shared'

export class CrossCommunityError extends DomainError {
  public constructor(
    public readonly status: keyof StatusMap,
    public readonly message: string,
  ) {
    super(message)
  }
}

// shot form for cross community error
export const xcomError = (status: keyof StatusMap, message: string) => ({
  success: false as const,
  error: new CrossCommunityError(status, message),
})
