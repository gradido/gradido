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
  it('is the sentence of this community, with what was looked for behind it', () => {
    expect(isRecipientNotFoundError('The recipient user was not found: sarah@example.org')).toBe(
      true,
    )
  })

  // As the hulls of the servers between hand it on (core/.../processXComSendCoins.ts).
  it('is the answer of another community to the vote, wherever it stands in the message', () => {
    expect(
      isRecipientNotFoundError(
        'Error: voteForSendCoins failed for endpoint=https://x/api/, err=Error: ' +
          'voteForSendCoins with unknown recipientUserIdentifier in the community=Wien: {"response":{}}{}',
      ),
    ).toBe(true)
  })

  // By then the vote has found the recipient: what those steps say is another matter.
  it.each([
    'settleSendCoins with unknown recipientUserIdentifier in the community=Wien',
    'revertSendCoins with unknown recipientUserIdentifier in the community=Wien',
    'X-Community sendCoins disabled per configuration!',
    'The recipient community was not found',
    '',
    undefined,
  ])('is nothing else: %s', (message) => {
    expect(isRecipientNotFoundError(message)).toBe(false)
  })
})
