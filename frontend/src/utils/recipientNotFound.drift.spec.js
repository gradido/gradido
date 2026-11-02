// AI-GENERATED — not an architecture reference
// @vitest-environment node
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { isRecipientNotFoundError, isUserNotFoundAnswer } from './recipientNotFound'

/**
 * The wallet recognises "nobody has that account" by the server's words. The send error page's line
 * for it waited for 'recipient not known' long after the server had changed them, and never fired.
 * So the sentences are read here from where the servers throw them.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const source = (...path) => readFileSync(join(root, ...path), 'utf8')

describe('the words the wallet knows, in the sources of the servers', () => {
  it('`user` says so with the sentence the wallet looks for', () => {
    const [, sentence] = source('backend', 'src', 'graphql', 'resolver', 'UserResolver.ts').match(
      /throw new Error\('(User not found)'\)/,
    )
    expect(isUserNotFoundAnswer({ graphQLErrors: [{ message: sentence }] })).toBe(true)
  })

  it('sendCoins says so with the sentence the wallet looks for', () => {
    const [, sentence] = source(
      'backend',
      'src',
      'graphql',
      'resolver',
      'TransactionResolver.ts',
    ).match(/'(The recipient user was not found: )'/)
    expect(isRecipientNotFoundError(`${sentence}sarah@example.org`)).toBe(true)
  })

  it('the other community says so in its answer to the vote', () => {
    const [, sentence] = source(
      'federation',
      'src',
      'graphql',
      'api',
      '1_0',
      'resolver',
      'SendCoinsResolver.ts',
    ).match(/`(voteForSendCoins with unknown recipientUserIdentifier in the community=)`/)
    expect(isRecipientNotFoundError(`${sentence}Wien`)).toBe(true)
  })
})
