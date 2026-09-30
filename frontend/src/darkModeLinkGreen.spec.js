// AI-GENERATED — not an architecture reference
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

/**
 * The dark mode's link green (Bernd, 29.09.2026): #3db85f, chosen so that every green link reads at
 * 4.5:1 or more on the dark mode's three grounds -- the cards (`--surface`), the page (`--bg`) and
 * the muted surface (`--surface-muted`, the language list's chosen row). #0b9130 before came to
 * 3.4:1 on the cards.
 *
 * The green is written in three places that have to agree: the token, the rgb triple Bootstrap's
 * `rgba(var(--bs-link-color-rgb), …)` reads, and the picture view's caption links, which stand
 * outside `.dark-mode` in the light theme and carry the value themselves.
 */
const here = dirname(fileURLToPath(import.meta.url))
const read = (path) => readFileSync(resolve(here, path), 'utf8')
const DARK = read('./assets/scss/gradido-template-dark.scss')
const BRIDGE = read('./assets/scss/_color-mode-bridge.scss')
const IMAGE_VIEW = read('./components/Chat/ChatImageView.vue')

const token = (name) => DARK.match(new RegExp(`\\n\\s*--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`))?.[1]
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const luminance = (hex) =>
  rgb(hex)
    .map((value) => value / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0)
const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

describe("the dark mode's link green", () => {
  const link = token('link')

  it('is the green Bernd chose', () => {
    expect(link).toBe('#3db85f')
  })

  it.each(['surface', 'bg', 'surface-muted'])('reads at 4.5:1 or more on --%s', (ground) => {
    expect(token(ground), `--${ground} is gone from the dark stylesheet`).toBeTruthy()
    expect(contrast(link, token(ground))).toBeGreaterThanOrEqual(4.5)
  })

  it("is the rgb triple Bootstrap's link colours read", () => {
    const triples = [...BRIDGE.matchAll(/--bs-link(?:-hover)?-color-rgb:\s*([\d,\s]+);/g)].map(
      (m) => m[1].split(',').map((part) => Number(part.trim())),
    )
    expect(triples).toHaveLength(2)
    for (const triple of triples) expect(triple).toEqual(rgb(link))
  })

  // The caption's links and the copy button behind a video link (ChatVideoLinkCopy), one rule.
  it("is the picture view's caption link colour", () => {
    const rule = IMAGE_VIEW.match(
      /\n\.modal \.chat-image-view-caption :is\(a:not\(\.chat-file-card\), \.chat-video-link-copy\)\s*\{([^}]*)\}/,
    )?.[1]
    expect(rule).toMatch(new RegExp(`color:\\s*${link}\\b`))
  })
})
