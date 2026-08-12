// AI-GENERATED — not an architecture reference

import { describe, it, expect } from 'vitest'
import { chequeFileName, wrapText } from './thankYouCheque'

// There is no canvas in the test environment. `wrapText` only needs measureText,
// mocked here with a fixed character width so the line breaks are predictable.
const ctxWithCharWidth = (width) => ({
  measureText: (text) => ({ width: text.length * width }),
})

describe('chequeFileName', () => {
  it('takes the occasion and puts the amount first', () => {
    expect(chequeFileName('Gradido-Café Berlin', '20')).toBe('20 GDD - Gradido-Café Berlin.png')
  })

  it('keeps hyphens so that "Dank-Scheck" stays "Dank-Scheck"', () => {
    expect(chequeFileName('Dank-Scheck Nr. 012', '5')).toBe('5 GDD - Dank-Scheck Nr. 012.png')
  })

  it('replaces characters Windows forbids in file names', () => {
    const name = chequeFileName('Café um 12:00 / Saal <A> "groß" | Nr?*', '20')
    expect(name).not.toMatch(/[<>:"/\\|?*]/)
    expect(name.endsWith('.png')).toBe(true)
  })

  it('truncates long names at a word boundary, not mid-word', () => {
    const occasion = 'Vortrag Nürtingen, Donnerstag 16. August, Stadthalle Süd, Eingang West'
    const name = chequeFileName(occasion, '20')
    const core = name.replace(/^20 GDD - /, '').replace(/\.png$/, '')
    expect(core.length).toBeLessThanOrEqual(50)
    expect(core).not.toMatch(/\s$/)
    // whole words only, no dangling fragment at the end
    expect(occasion).toContain(core)
  })

  it('never ends on a dot or a space — Windows rejects such names', () => {
    expect(chequeFileName('Bis später...', '3')).toBe('3 GDD - Bis später.png')
    expect(chequeFileName('Danke   ', '3')).toBe('3 GDD - Danke.png')
  })

  it('falls back to a fixed name when the occasion is empty', () => {
    expect(chequeFileName('', '10')).toBe('10 GDD - Gradido-Scheck.png')
    expect(chequeFileName(null, '10')).toBe('10 GDD - Gradido-Scheck.png')
  })

  it('avoids the names Windows reserves', () => {
    expect(chequeFileName('nul', '1')).toBe('1 GDD - Gradido-Scheck.png')
    expect(chequeFileName('COM1', '1')).toBe('1 GDD - Gradido-Scheck.png')
  })

  it('leaves out the amount when none is given', () => {
    expect(chequeFileName('Gradido-Café', null)).toBe('Gradido-Café.png')
  })
})

describe('wrapText', () => {
  const ctx = ctxWithCharWidth(10)

  it('returns no line for empty text', () => {
    expect(wrapText(ctx, '', 100)).toEqual([])
    expect(wrapText(ctx, null, 100)).toEqual([])
  })

  it('keeps short text on one line', () => {
    expect(wrapText(ctx, 'kurz', 100)).toEqual(['kurz'])
  })

  it('breaks at word boundaries', () => {
    expect(wrapText(ctx, 'eins zwei drei', 100)).toEqual(['eins zwei', 'drei'])
  })

  it('truncates after the allowed number of lines and adds an ellipsis', () => {
    const lines = wrapText(ctx, 'eins zwei drei vier fünf sechs sieben', 100, 2)
    expect(lines).toHaveLength(2)
    expect(lines[1].endsWith('…')).toBe(true)
  })

  it('does not truncate when the text fits anyway', () => {
    const lines = wrapText(ctx, 'eins zwei', 100, 2)
    expect(lines).toEqual(['eins zwei'])
    expect(lines.join('')).not.toContain('…')
  })

  it('keeps a single overlong word instead of losing it', () => {
    expect(wrapText(ctx, 'Donaudampfschifffahrtsgesellschaft', 50)).toEqual([
      'Donaudampfschifffahrtsgesellschaft',
    ])
  })
})
