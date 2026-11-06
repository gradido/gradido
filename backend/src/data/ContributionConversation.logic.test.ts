// AI-GENERATED — not an architecture reference
import { ContributionMessageType } from '@/graphql/enum/ContributionMessageType'
import { colleagueNoteOnQuestion, lastConversationMessage } from './ContributionConversation.logic'

const message = (id: number, type: ContributionMessageType, isModerator: boolean, at: string) => ({
  id,
  type,
  isModerator,
  createdAt: new Date(at),
})

const question = message(1, ContributionMessageType.DIALOG, true, '2026-10-20T10:00:00.000Z')
const answer = message(2, ContributionMessageType.DIALOG, false, '2026-10-21T10:00:00.000Z')
const change = message(3, ContributionMessageType.HISTORY, false, '2026-10-22T10:00:00.000Z')
const note = message(4, ContributionMessageType.MODERATOR, true, '2026-10-23T10:00:00.000Z')

describe('lastConversationMessage', () => {
  it('takes the newest message, in whatever order they come', () => {
    expect(lastConversationMessage([question, answer])).toBe(answer)
    expect(lastConversationMessage([answer, question])).toBe(answer)
    expect(lastConversationMessage([change, question, answer])).toBe(change)
  })

  it("leaves the moderators' internal notes out: the member's word stays the last", () => {
    expect(lastConversationMessage([question, answer, note])).toBe(answer)
    expect(lastConversationMessage([note])).toBeUndefined()
  })

  it('takes the later id where two messages share their time', () => {
    const sameTime = message(5, ContributionMessageType.DIALOG, false, '2026-10-22T10:00:00.000Z')
    expect(lastConversationMessage([sameTime, change])).toBe(sameTime)
    expect(lastConversationMessage([change, sameTime])).toBe(sameTime)
  })

  it('finds nothing where nothing was said', () => {
    expect(lastConversationMessage([])).toBeUndefined()
  })
})

describe('colleagueNoteOnQuestion', () => {
  // Who wrote what, by row number: the member 1, the moderator who asks 10, a colleague 20.
  const by = (userId: number, m: ReturnType<typeof message>) => ({ ...m, userId })
  const asked = by(
    10,
    message(11, ContributionMessageType.DIALOG, true, '2026-11-05T10:00:00.000Z'),
  )
  const colleaguesNote = by(
    20,
    message(12, ContributionMessageType.MODERATOR, true, '2026-11-06T10:00:00.000Z'),
  )
  const askersNote = by(
    10,
    message(13, ContributionMessageType.MODERATOR, true, '2026-11-06T11:00:00.000Z'),
  )

  it("tells a colleague's note on the open question, in whatever order the messages come", () => {
    expect(colleagueNoteOnQuestion([asked, colleaguesNote])).toBe(true)
    expect(colleagueNoteOnQuestion([colleaguesNote, asked])).toBe(true)
  })

  it('takes no note of the one who asked: such a note answers nothing', () => {
    expect(colleagueNoteOnQuestion([asked, askersNote])).toBe(false)
    // and the newest note decides: the one who asked has read the colleague's
    expect(colleagueNoteOnQuestion([asked, colleaguesNote, askersNote])).toBe(false)
  })

  it('ends with the next message of the conversation', () => {
    const membersAnswer = by(
      1,
      message(14, ContributionMessageType.DIALOG, false, '2026-11-07T10:00:00.000Z'),
    )
    const askedAgain = by(
      10,
      message(15, ContributionMessageType.DIALOG, true, '2026-11-07T10:00:00.000Z'),
    )
    expect(colleagueNoteOnQuestion([asked, colleaguesNote, membersAnswer])).toBe(false)
    expect(colleagueNoteOnQuestion([asked, colleaguesNote, askedAgain])).toBe(false)
  })

  it('needs a question: a note after a note, after the member or after a change is none', () => {
    const earlier = (m: ReturnType<typeof by>) => ({ ...m, createdAt: new Date('2026-11-01') })
    const membersWord = by(1, message(16, ContributionMessageType.DIALOG, false, '2026-11-01'))
    const moderatorsChange = by(
      10,
      message(17, ContributionMessageType.HISTORY, true, '2026-11-01'),
    )
    expect(colleagueNoteOnQuestion([colleaguesNote])).toBe(false)
    expect(colleagueNoteOnQuestion([earlier(askersNote), colleaguesNote])).toBe(false)
    expect(colleagueNoteOnQuestion([membersWord, colleaguesNote])).toBe(false)
    expect(colleagueNoteOnQuestion([moderatorsChange, colleaguesNote])).toBe(false)
    expect(colleagueNoteOnQuestion([])).toBe(false)
  })

  it('takes a question asked after the note as the newer word', () => {
    const noteFirst = { ...colleaguesNote, createdAt: new Date('2026-11-04T10:00:00.000Z') }
    expect(colleagueNoteOnQuestion([noteFirst, asked])).toBe(false)
  })

  it('takes the later id where the note and the question share their time', () => {
    const sameTime = { ...colleaguesNote, createdAt: asked.createdAt }
    expect(colleagueNoteOnQuestion([asked, sameTime])).toBe(true)
    expect(colleagueNoteOnQuestion([{ ...asked, id: 99 }, sameTime])).toBe(false)
  })
})
