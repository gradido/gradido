// AI-GENERATED — not an architecture reference
import { ValidationError, validate } from 'class-validator'
import { MESSAGE_MAX_CHARS } from 'shared'
import { ForwardChatMessageArgs } from './ForwardChatMessageArgs'
import { SendChatGroupMessageArgs } from './SendChatGroupMessageArgs'
import { SendEmailArgs } from './SendEmailArgs'

/**
 * How long a message may be (MESSAGE_MAX_CHARS), on the args classes that take one beside the two
 * with tests of their own (SendChatMessageArgs, EditChatMessageArgs): a message to a group, the
 * words that go with a forwarded message, and the text of the form "send an e-mail". With the
 * options type-graphql validates with (graphql/schema.ts).
 */
const SCHEMA_VALIDATE_OPTIONS = {
  validationError: { target: false },
  skipMissingProperties: true,
  skipNullProperties: true,
  skipUndefinedProperties: false,
  forbidUnknownValues: true,
  stopAtFirstError: true,
}

const UUID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

/** The names of the checks that refused, the nested ones included. */
const refusedBy = (errors: ValidationError[]): string[] =>
  errors.flatMap((error) => [
    ...Object.keys(error.constraints ?? {}),
    ...refusedBy(error.children ?? []),
  ])

const checksFailing = async (args: object): Promise<string[]> =>
  refusedBy(await validate(args, SCHEMA_VALIDATE_OPTIONS))

const toAGroup = (body: string): SendChatGroupMessageArgs =>
  Object.assign(new SendChatGroupMessageArgs(), { groupUuid: UUID, body, announce: false })

const withAForwardedMessage = (words: string): ForwardChatMessageArgs =>
  Object.assign(new ForwardChatMessageArgs(), {
    messageUuid: UUID,
    groupUuids: [UUID],
    members: [],
    words,
    alsoByEmail: false,
  })

const asALetter = (memo: string): SendEmailArgs =>
  Object.assign(new SendEmailArgs(), {
    recipientCommunityIdentifier: '',
    recipientIdentifier: 'anna',
    subject: 'About Saturday',
    memo,
  })

describe('the length of a message', () => {
  it.each<[string, (text: string) => object]>([
    ['a message to a group', toAGroup],
    ['the words that go with a forwarded message', withAForwardedMessage],
    ['the text of a letter', asALetter],
  ])('is bounded for %s', async (_what, args) => {
    expect(await checksFailing(args('x'.repeat(MESSAGE_MAX_CHARS)))).toEqual([])
    expect(await checksFailing(args('x'.repeat(MESSAGE_MAX_CHARS + 1)))).toEqual(['maxLength'])
  })
})
