// AI-GENERATED — not an architecture reference
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

/**
 * Own messages on the right, the other person's on the left (E-014) -- two rules of ChatBubble's
 * stylesheet, which the test library cannot see: jsdom lays nothing out. They went missing once
 * when the bubble's rules were put in a new order for the menu at a message (E-059), and every own
 * message stood on the left; the probe found it, no test did. Read from the source, as
 * darkModeLinkGreen.spec.js reads its colours.
 */
const here = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(resolve(here, './ChatBubble.vue'), 'utf8')
const styles = source
  .slice(source.indexOf('<style'))
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')

/** The declarations of the rule for exactly this selector, outside any media query. */
const ruleOf = (selector) =>
  [...styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((m) => m[1].split(',').some((part) => part.trim() === selector))
    .map((m) => m[2].trim())

describe('ChatBubble, the sides of a conversation', () => {
  it('keeps own messages to the right', () => {
    expect(ruleOf('.chat-bubble-mine')).toContainEqual(
      expect.stringMatching(/align-items:\s*flex-end\s*;/),
    )
  })

  it("keeps the other person's messages to the left", () => {
    expect(ruleOf('.chat-bubble-theirs')).toContainEqual(
      expect.stringMatching(/align-items:\s*flex-start\s*;/),
    )
  })
})
