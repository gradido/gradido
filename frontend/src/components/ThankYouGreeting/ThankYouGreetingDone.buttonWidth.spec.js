// AI-GENERATED — not an architecture reference
// @vitest-environment node
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * The buttons of the finished greeting were as wide as their card, and on a desk the card is as
 * wide as the page. jsdom lays nothing out, so this reads the source: which buttons carry the
 * class, and what the class says. Comments go first -- they name the rule in prose.
 */
const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'ThankYouGreetingDone.vue'),
  'utf8',
)
const template = source.slice(0, source.indexOf('<script')).replace(/<!--[\s\S]*?-->/g, '')
const style = source.slice(source.indexOf('<style')).replace(/\/\*[\s\S]*?\*\//g, '')

const button = (test) => {
  const tag = template.match(new RegExp(`<BButton(?:(?!<BButton)[^>])*data-test="${test}"[^>]*>`))
  return tag ? tag[0] : null
}
const rule = (selector) => {
  const found = style.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`))
  return found ? found[1] : null
}

describe('ThankYouGreetingDone, the width of its buttons', () => {
  it.each(['thank-you-greeting-share', 'thank-you-greeting-copy', 'thank-you-greeting-print'])(
    '%s is a button of the card',
    (test) => {
      expect(button(test)).toContain('class="tyg-done-button"')
    },
  )

  it('the line of text under them is not', () => {
    expect(button('thank-you-greeting-save')).not.toBeNull()
    expect(button('thank-you-greeting-save')).not.toContain('tyg-done-button')
  })

  it('a button fills a narrow card and stops at the width of the sheet, in the middle', () => {
    expect(rule('.tyg-done-button')).toMatch(/width:\s*min\(24rem,\s*100%\)/)
    expect(rule('.tyg-done-button')).toMatch(/align-self:\s*center/)
  })

  it('the rule is read from the code, not from a comment', () => {
    expect(source).toContain('no wider than the sheet')
    expect(style).not.toContain('no wider than the sheet')
  })
})
