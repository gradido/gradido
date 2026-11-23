// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import {
  forgetModerationWaiting,
  moderationCreationsWaiting,
  moderationSupportTicketsWaiting,
  setModerationWaiting,
} from './useModerationWaiting'

const shown = () => [moderationCreationsWaiting.value, moderationSupportTicketsWaiting.value]

// What the menu reads of the moderation ("Meine Gruppen", MG3); the way there, through the chat's
// beat, is held in useChatUpdates.spec.js and Sidebar.spec.js.
describe('useModerationWaiting', () => {
  afterEach(() => {
    forgetModerationWaiting()
  })

  it('counts nothing before the first answer', () => {
    expect(shown()).toEqual([0, 0])
  })

  it('takes an answer as it came, also back to nothing', () => {
    setModerationWaiting({ creations: 3, supportTickets: 2 })
    expect(shown()).toEqual([3, 2])
    setModerationWaiting({ creations: 0, supportTickets: 0 })
    expect(shown()).toEqual([0, 0])
  })

  // a moderator who does not handle the support: the server leaves that number null
  it("shows nothing for a number that is not the member's to count", () => {
    setModerationWaiting({ creations: 4, supportTickets: 5 })
    setModerationWaiting({ creations: 4, supportTickets: null })
    expect(shown()).toEqual([4, 0])
  })

  it.each([
    [null, 'nothing to moderate, or the server could not count'],
    [undefined, 'an answer without the field'],
  ])('keeps what was shown where the answer is %s (%s)', (answer) => {
    setModerationWaiting({ creations: 2, supportTickets: 1 })
    setModerationWaiting(answer)
    expect(shown()).toEqual([2, 1])
  })

  it('forgets the numbers: they were the member who signed out', () => {
    setModerationWaiting({ creations: 2, supportTickets: 1 })
    forgetModerationWaiting()
    expect(shown()).toEqual([0, 0])
  })

  it('hands out what it holds to read, never to write', () => {
    setModerationWaiting({ creations: 1, supportTickets: 1 })
    moderationCreationsWaiting.value = 7
    moderationSupportTicketsWaiting.value = 7
    expect(shown()).toEqual([1, 1])
  })

  /**
   * ⛔ No question and no timer of its own, and neither the store nor the browser's storage:
   * the store is written to localStorage in full. Read with the comments taken out, because the
   * comments name the very words.
   */
  it('asks nothing, and touches neither the store nor any storage of the browser', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'useModerationWaiting.js'),
      'utf8',
    )
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    expect(code).not.toMatch(/apollo|graphql|setTimeout|setInterval/i)
    expect(code).not.toMatch(/\$store|useStore|@\/store|store\/store|\bstore\s*\./)
    expect(code).not.toMatch(/localStorage|sessionStorage|indexedDB/)
    // Gegenprobe on the stripping: the comments do name the store and the storage
    expect(source).toMatch(/localStorage/)
    expect(source).toMatch(/store/)
  })
})
