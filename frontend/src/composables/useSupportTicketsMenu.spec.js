// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import {
  forgetSupportTicketsMenu,
  setSupportTicketsMenu,
  supportTicketsActiveNow,
  supportTicketsInProgress,
  supportTicketsUnfinished,
} from './useSupportTicketsMenu'

// What the menu reads of the support (K5); the way there, through the chat's beat, is held in
// useChatUpdates.spec.js and Sidebar.spec.js.
const menu = () => ({
  active: supportTicketsActiveNow.value,
  inProgress: supportTicketsInProgress.value,
  unfinished: supportTicketsUnfinished.value,
})

describe('useSupportTicketsMenu', () => {
  afterEach(() => {
    forgetSupportTicketsMenu()
  })

  it('knows nothing before the first answer: the switch not known, no request', () => {
    expect(menu()).toEqual({ active: null, inProgress: 0, unfinished: 0 })
  })

  it('takes an answer as it came', () => {
    setSupportTicketsMenu({ active: false, inProgress: 2, unfinished: 5 })
    expect(menu()).toEqual({ active: false, inProgress: 2, unfinished: 5 })
  })

  it.each([
    [null, 'the server could not count'],
    [undefined, 'a server from before K5'],
  ])('keeps what was shown where the answer is %s (%s)', (answer) => {
    setSupportTicketsMenu({ active: true, inProgress: 1, unfinished: 2 })
    setSupportTicketsMenu(answer)
    expect(menu()).toEqual({ active: true, inProgress: 1, unfinished: 2 })
  })

  it('forgets everything: the numbers were the member who signed out', () => {
    setSupportTicketsMenu({ active: false, inProgress: 1, unfinished: 2 })
    forgetSupportTicketsMenu()
    expect(menu()).toEqual({ active: null, inProgress: 0, unfinished: 0 })
  })

  it('hands out what it holds to read, never to write', () => {
    setSupportTicketsMenu({ active: true, inProgress: 1, unfinished: 1 })
    supportTicketsInProgress.value = 7
    expect(supportTicketsInProgress.value).toBe(1)
  })

  /**
   * ⛔ No question and no timer of its own, and neither the store nor the browser's storage:
   * the store is written to localStorage in full. Read with the comments taken out, because the
   * comments name the very words.
   */
  it('asks nothing, and touches neither the store nor any storage of the browser', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'useSupportTicketsMenu.js'),
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
