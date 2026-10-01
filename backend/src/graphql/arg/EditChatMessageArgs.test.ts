// AI-GENERATED — not an architecture reference
import { ValidationError, validate } from 'class-validator'
import { MESSAGE_MAX_CHARS } from 'shared'
import { EditChatMessageArgs } from './EditChatMessageArgs'
import { NewChatMessagesSinceArgs } from './NewChatMessagesSinceArgs'

/**
 * What the arguments of a changed message hold themselves (E-060), with the options type-graphql
 * validates with (graphql/schema.ts): the uuid, and the upper bound of a chat message. The lower
 * bound is the resolver's -- a text may be emptied where the message carries a picture.
 */
const SCHEMA_VALIDATE_OPTIONS = {
  validationError: { target: false },
  skipMissingProperties: true,
  skipNullProperties: true,
  skipUndefinedProperties: false,
  forbidUnknownValues: true,
  stopAtFirstError: true,
}

const MESSAGE = '40000000-0000-4000-8000-000000000001'

/** The names of the checks that refused. */
const refusedBy = (errors: ValidationError[]): string[] =>
  errors.flatMap((error) => Object.keys(error.constraints ?? {}))

const checksFailing = async (args: object): Promise<string[]> =>
  refusedBy(await validate(args, SCHEMA_VALIDATE_OPTIONS))

const edit = (messageUuid: unknown, body: unknown): EditChatMessageArgs =>
  Object.assign(new EditChatMessageArgs(), { messageUuid, body })

describe('EditChatMessageArgs', () => {
  it('takes a text up to 2000 characters, and an empty one', async () => {
    expect(await checksFailing(edit(MESSAGE, 'x'))).toEqual([])
    expect(await checksFailing(edit(MESSAGE, 'x'.repeat(MESSAGE_MAX_CHARS)))).toEqual([])
    // Whether an empty text is one: the resolver knows whether the message carries a picture.
    expect(await checksFailing(edit(MESSAGE, ''))).toEqual([])
  })

  it('refuses more than 2000 characters, and what is no text', async () => {
    expect(await checksFailing(edit(MESSAGE, 'x'.repeat(MESSAGE_MAX_CHARS + 1)))).toEqual([
      'maxLength',
    ])
    // Which of the two checks speaks first is class-validator's order; one of them does.
    expect(await checksFailing(edit(MESSAGE, 42))).toHaveLength(1)
  })

  it('refuses what is no uuid', async () => {
    expect(await checksFailing(edit('5', 'x'))).toEqual(['isUuid'])
    expect(await checksFailing(edit("' or 1=1 --", 'x'))).toEqual(['isUuid'])
  })
})

/** Where a beat goes on from for changed messages (E-060): the cursor, as the last answer gave it. */
describe('NewChatMessagesSinceArgs.editedCursor', () => {
  const beat = (editedCursor: unknown): NewChatMessagesSinceArgs =>
    Object.assign(new NewChatMessagesSinceArgs(), { afterId: 5, limit: 50, editedCursor })

  it('takes a cursor, and none', async () => {
    expect(await checksFailing(beat('1759309220123-0'))).toEqual([])
    expect(await checksFailing(beat('1759309220123-4711'))).toEqual([])
    expect(await checksFailing(beat(null))).toEqual([])
    expect(await checksFailing(beat(undefined))).toEqual([])
  })

  // It becomes a moment and an id the database is asked with: nothing else gets that far.
  it('refuses what is no cursor', async () => {
    for (const noCursor of ['', 'yesterday', '2026-10-01T09:00:20.123Z', '5', '5-', '5-6 or 1=1']) {
      expect(await checksFailing(beat(noCursor))).toEqual(['matches'])
    }
    expect(await checksFailing(beat(5))).toEqual(['matches'])
  })
})
