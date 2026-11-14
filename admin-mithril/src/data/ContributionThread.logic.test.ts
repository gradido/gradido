// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import type { ThreadMessage } from './Contribution.schema'
import {
  colleagueQuestion,
  messageParts,
  recordAmount,
  recordDate,
  threadAuthors,
  withBold,
} from './ContributionThread.logic'

describe('messageParts', () => {
  it('parts text and links', () => {
    expect(messageParts('see https://gradido.net/x ok', 'DIALOG')).toEqual([
      { type: 'text', text: 'see ' },
      { type: 'link', text: 'https://gradido.net/x' },
      { type: 'text', text: ' ok' },
    ])
  })

  it("takes a change's record apart into date, text and amount", () => {
    expect(messageParts('Thu Oct 01 2026\n---\nold --- memo\n---\n50.5', 'HISTORY')).toEqual([
      { type: 'date', text: 'Thu Oct 01 2026' },
      { type: 'text', text: 'old --- memo' },
      { type: 'amount', text: '50.5' },
    ])
  })

  it('shows a record of another shape, and a message that only looks like one, as it came', () => {
    expect(messageParts('a\n---\nb', 'HISTORY')).toEqual([{ type: 'text', text: 'a\n---\nb' }])
    expect(messageParts('a\n---\nb\n---\nc', 'DIALOG')).toEqual([
      { type: 'text', text: 'a\n---\nb\n---\nc' },
    ])
  })
})

describe('withBold', () => {
  it('sets bold runs bold, also across lines, and lets no markup through', () => {
    expect(withBold('**a\nb** and **c** <b>x</b> &')).toBe(
      '<strong>a\nb</strong> and <strong>c</strong> &lt;b&gt;x&lt;/b&gt; &amp;',
    )
  })
})

describe('recordDate and recordAmount', () => {
  it('read only the forms a record is written in', () => {
    expect(recordDate('Thu Oct 01 2026 00:00:00 GMT+0000 (UTC)')?.toISOString()).toBe(
      '2026-10-01T00:00:00.000Z',
    )
    expect(recordDate('01/02/2024')).toBeNull()
    expect(recordAmount('-50.5')).toBe(-50.5)
    expect(recordAmount('0x10')).toBeNull()
  })
})

describe('colleagueQuestion', () => {
  const me = { gradidoID: 'me', communityUuid: 'c' }
  const message = (id: number, more: Partial<ThreadMessage> = {}): ThreadMessage => ({
    id,
    message: '',
    createdAt: '2026-10-06T09:00:00.000Z',
    type: 'DIALOG',
    userAlias: 'colleague',
    userId: 2,
    userAvatarColorIndex: null,
    userGradidoID: 'other',
    userCommunityUuid: 'c',
    userAvatarUpdatedAt: null,
    isModerator: true,
    ...more,
  })

  it('names the colleague whose question is the newest word, notes left out', () => {
    const thread = [
      message(1, { isModerator: false, userGradidoID: 'member' }),
      message(2),
      message(3, { type: 'MODERATOR', userGradidoID: 'me' }),
    ]
    expect(colleagueQuestion('IN_PROGRESS', thread, 3, me)).toEqual({ name: 'colleague' })
  })

  it('takes the later of two at the same moment by its id', () => {
    const thread = [message(2), message(1, { isModerator: false, userGradidoID: 'member' })]
    expect(colleagueQuestion('IN_PROGRESS', thread, 2, me)).toEqual({ name: 'colleague' })
  })

  it('knows of none where the moderator asked, the member answered, or the thread is not all here', () => {
    expect(
      colleagueQuestion('IN_PROGRESS', [message(1, { userGradidoID: 'me' })], 1, me),
    ).toBeNull()
    expect(
      colleagueQuestion(
        'IN_PROGRESS',
        [message(1), message(2, { isModerator: false, userGradidoID: 'member' })],
        2,
        me,
      ),
    ).toBeNull()
    expect(colleagueQuestion('IN_PROGRESS', [message(1)], 2, me)).toBeNull()
    expect(colleagueQuestion('PENDING', [message(1)], 1, me)).toBeNull()
  })
})

describe('threadAuthors', () => {
  const message = (more: Partial<ThreadMessage>): ThreadMessage => ({
    id: 1,
    message: '',
    createdAt: '2026-11-14T09:00:00.000Z',
    type: 'DIALOG',
    userAlias: 'someone',
    userId: 2,
    userAvatarColorIndex: null,
    userGradidoID: 'g',
    userCommunityUuid: 'c',
    userAvatarUpdatedAt: '2026-11-01T00:00:00.000Z',
    isModerator: false,
    ...more,
  })

  it('names who wrote, by the pair and the date of the picture, and leaves out who is gone', () => {
    expect(
      threadAuthors([
        message({}),
        message({ userGradidoID: null, userCommunityUuid: null }),
        message({ userGradidoID: 'h', userAvatarUpdatedAt: null }),
      ]),
    ).toEqual([
      { gradidoID: 'g', communityUuid: 'c', avatarUpdatedAt: '2026-11-01T00:00:00.000Z' },
      { gradidoID: 'h', communityUuid: 'c', avatarUpdatedAt: null },
    ])
  })
})
