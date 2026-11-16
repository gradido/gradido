// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import {
  contributionsInProgress,
  forgetContributionsInProgress,
  setContributionsInProgress,
} from './useContributionsInProgress'

// What the menu reads of the member's contributions; the way there, through the chat's beat, is
// held in useChatUpdates.spec.js and Sidebar.spec.js.
describe('useContributionsInProgress', () => {
  afterEach(() => {
    forgetContributionsInProgress()
  })

  it('counts none before the first answer', () => {
    expect(contributionsInProgress.value).toBe(0)
  })

  it('takes an answer as it came, also back to none', () => {
    setContributionsInProgress(3)
    expect(contributionsInProgress.value).toBe(3)
    setContributionsInProgress(0)
    expect(contributionsInProgress.value).toBe(0)
  })

  it.each([
    [null, 'the server could not count'],
    [undefined, 'an answer without the field'],
  ])('keeps what was shown where the answer is %s (%s)', (answer) => {
    setContributionsInProgress(2)
    setContributionsInProgress(answer)
    expect(contributionsInProgress.value).toBe(2)
  })

  it('forgets the number: it was the member who signed out', () => {
    setContributionsInProgress(2)
    forgetContributionsInProgress()
    expect(contributionsInProgress.value).toBe(0)
  })

  it('hands out what it holds to read, never to write', () => {
    setContributionsInProgress(1)
    contributionsInProgress.value = 7
    expect(contributionsInProgress.value).toBe(1)
  })

  /**
   * ⛔ No question and no timer of its own, and neither the store nor the browser's storage:
   * the store is written to localStorage in full. Read with the comments taken out, because the
   * comments name the very words.
   */
  it('asks nothing, and touches neither the store nor any storage of the browser', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'useContributionsInProgress.js'),
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
