// AI-GENERATED — not an architecture reference
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

/**
 * A rule of MatchList's stylesheet that the test library cannot see -- jsdom lays nothing out --,
 * read from the source, as ChatBubble.layout.spec.js reads its own:
 *
 * The line over the list that names the search's centre keeps its place while it is empty. Under
 * a shown contact the place they are found in is read a moment after the search moved onto them
 * (Bernd, 10.10.2026); until then the line says nothing, and an empty paragraph has no height of
 * its own. Without one the sort under it would jump down by a line when the name arrives, under
 * a finger. Measured in the built wallet: 19.5 px with its text and without, at 1280, 390 and
 * 320 px.
 */
const here = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(resolve(here, './MatchList.vue'), 'utf8')
const styles = source.slice(source.indexOf('<style')).replace(/\/\*[\s\S]*?\*\//g, '')

/** The declarations of the rule for exactly this selector. */
const ruleOf = (selector) =>
  [...styles.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((m) => m[1].split(',').some((part) => part.trim() === selector))
    .map((m) => m[2].trim())
const valueOf = (rule, property) =>
  rule?.match(new RegExp(`(?:^|;)\\s*${property}:\\s*([^;]+);`))?.[1].trim()

describe('MatchList, what only a browser lays out', () => {
  const [line] = ruleOf('.center-label')

  it('finds the rule of the line that names the centre', () => {
    expect(ruleOf('.center-label')).toHaveLength(1)
  })

  it('gives that line the height of a line of its own text, also while it is empty', () => {
    const lineHeight = valueOf(line, 'line-height')
    const least = valueOf(line, 'min-height')

    // A plain factor and the same factor in em: both follow the line's own font size.
    expect(lineHeight).toMatch(/^\d+(\.\d+)?$/)
    expect(least).toBe(`${lineHeight}em`)
  })
})
