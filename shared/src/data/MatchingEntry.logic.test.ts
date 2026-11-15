// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { sameWords } from './MatchingEntry.logic'

describe('sameWords', () => {
  it('counts the same words in another case and with blanks around them as the same', () => {
    expect(sameWords('Kongress Frequency Healing', '  kongress FREQUENCY healing ')).toBe(true)
    expect(sameWords('Ich liebe Übungen', 'ich liebe übungen')).toBe(true)
  })

  it('counts other words as other, also where they only begin the same way', () => {
    expect(sameWords('Kongress Frequency Healing', 'Kongress Frequency Healing 2027')).toBe(false)
    expect(sameWords('Kongress Frequency Healing', 'Kongress  Frequency Healing')).toBe(false)
  })
})
