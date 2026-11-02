// AI-GENERATED — not an architecture reference
import { ContributionMessageType } from '@/graphql/enum/ContributionMessageType'
import { lastConversationMessage } from './ContributionConversation.logic'

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
