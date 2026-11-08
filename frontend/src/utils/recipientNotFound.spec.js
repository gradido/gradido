// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import { isRecipientNotFoundError, isUserNotFoundAnswer } from './recipientNotFound'

describe('isUserNotFoundAnswer', () => {
  it('is the server saying there is no such member', () => {
    expect(isUserNotFoundAnswer({ graphQLErrors: [{ message: 'User not found' }] })).toBe(true)
  })

  // ⛔ Never "no account" because the network was gone, or because the server failed otherwise.
  it.each([
    [{ networkError: new Error('Failed to fetch'), graphQLErrors: [] }],
    [{ networkError: new Error('Failed to fetch') }],
    [{ graphQLErrors: [{ message: '403.13 - Client certificate revoked' }] }],
    [{ graphQLErrors: [{ message: 'User not found in the bin' }] }],
    [new Error('User not found')],
    [undefined],
  ])('is nothing else: %j', (error) => {
    expect(isUserNotFoundAnswer(error)).toBe(false)
  })
})

describe('isRecipientNotFoundError', () => {
  // The backend's sentence for a member of this community and of another one alike.
  it('is the sentence of the backend, with what was looked for behind it', () => {
    expect(isRecipientNotFoundError('The recipient user was not found: sarah@example.org')).toBe(
      true,
    )
  })

  it.each([
    'X-Community sendCoins disabled per configuration!',
    'The recipient community was not found',
    '',
    undefined,
  ])('is nothing else: %s', (message) => {
    expect(isRecipientNotFoundError(message)).toBe(false)
  })
})
