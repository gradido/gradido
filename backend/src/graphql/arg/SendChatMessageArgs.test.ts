// AI-GENERATED — not an architecture reference
import { ChatMessageNotify } from '@enum/ChatMessageNotify'
import { ChatImageInput } from '@input/ChatImageInput'
import { MemberAvatarRefInput } from '@input/MemberAvatarRefInput'
import { ValidationError, validate } from 'class-validator'
import { CHAT_IMAGE_MAX_SIDE, MESSAGE_MAX_CHARS } from 'shared'
import { SendChatMessageArgs } from './SendChatMessageArgs'

/**
 * The bounds of a chat message, on the args class that carries them, with the options type-graphql
 * validates with (graphql/schema.ts). The rule they hold (P7, E-044): without a picture the text
 * is 1 to MESSAGE_MAX_CHARS characters, as before; with a picture 0 to as many -- a picture
 * without a caption is a message.
 *
 * ⛔ The upper bound with a picture is the one to watch. A MinLength behind @ValidateIf would have
 * switched off every check of the field, MaxLength included.
 */
const SCHEMA_VALIDATE_OPTIONS = {
  validationError: { target: false },
  skipMissingProperties: true,
  skipNullProperties: true,
  skipUndefinedProperties: false,
  forbidUnknownValues: true,
  stopAtFirstError: true,
}

const pictureOf = (width: number, height: number): ChatImageInput =>
  Object.assign(new ChatImageInput(), { data: '/9j/2Q==', width, height })

const argsWith = (body: string, image?: ChatImageInput | null): SendChatMessageArgs =>
  Object.assign(new SendChatMessageArgs(), {
    ref: Object.assign(new MemberAvatarRefInput(), {
      gradidoID: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      communityUuid: '11111111-1111-4111-8111-111111111111',
    }),
    body,
    notify: ChatMessageNotify.EMAIL,
    image,
  })

/** The names of the checks that refused, the nested ones included. */
const refusedBy = (errors: ValidationError[]): string[] =>
  errors.flatMap((error) => [
    ...Object.keys(error.constraints ?? {}),
    ...refusedBy(error.children ?? []),
  ])

const checksFailing = async (args: SendChatMessageArgs): Promise<string[]> =>
  refusedBy(await validate(args, SCHEMA_VALIDATE_OPTIONS))

describe('SendChatMessageArgs', () => {
  it('takes a text of 1 character to the length of a message without a picture, as before', async () => {
    expect(await checksFailing(argsWith('x'))).toEqual([])
    expect(await checksFailing(argsWith('x'.repeat(MESSAGE_MAX_CHARS)))).toEqual([])
  })

  it('refuses a message with neither text nor picture', async () => {
    expect(await checksFailing(argsWith(''))).toEqual(['isLongEnoughForChatMessage'])
    expect(await checksFailing(argsWith('', null))).toEqual(['isLongEnoughForChatMessage'])
  })

  it('takes a picture without a caption', async () => {
    expect(await checksFailing(argsWith('', pictureOf(800, 600)))).toEqual([])
  })

  it('refuses a text longer than a message may be -- with a picture as well', async () => {
    const tooLong = 'x'.repeat(MESSAGE_MAX_CHARS + 1)

    expect(await checksFailing(argsWith(tooLong))).toEqual(['maxLength'])
    expect(await checksFailing(argsWith(tooLong, pictureOf(800, 600)))).toEqual(['maxLength'])
  })

  /**
   * ⛔ What the request budget and the column rest on (chatImageBudget.test.ts in shared): a
   * character brings ONE variation selector along for nothing -- an emoji with it is one
   * character --, and every further selector counts as a character of its own. Counted
   * otherwise, every selector for nothing, a text of one letter and tens of thousands of
   * selectors would pass as one character.
   */
  it('counts one variation selector with its character, and every further one by itself', async () => {
    const selector = String.fromCodePoint(0xfe0f)

    expect(await checksFailing(argsWith(`😀${selector}`.repeat(MESSAGE_MAX_CHARS)))).toEqual([])
    expect(await checksFailing(argsWith(`x${selector.repeat(MESSAGE_MAX_CHARS)}`))).toEqual([])
    expect(await checksFailing(argsWith(`x${selector.repeat(MESSAGE_MAX_CHARS + 1)}`))).toEqual([
      'maxLength',
    ])
  })

  it('takes each side of a picture from 1 to 4096', async () => {
    expect(await checksFailing(argsWith('', pictureOf(1, 1)))).toEqual([])
    expect(
      await checksFailing(argsWith('', pictureOf(CHAT_IMAGE_MAX_SIDE, CHAT_IMAGE_MAX_SIDE))),
    ).toEqual([])
  })

  it('refuses a side of none, one past 4096, and one that is no whole number', async () => {
    expect(await checksFailing(argsWith('', pictureOf(0, 600)))).toEqual(['min'])
    expect(await checksFailing(argsWith('', pictureOf(800, CHAT_IMAGE_MAX_SIDE + 1)))).toEqual([
      'max',
    ])
    expect(await checksFailing(argsWith('', pictureOf(800.5, 600)))).toEqual(['isInt'])
  })
})
