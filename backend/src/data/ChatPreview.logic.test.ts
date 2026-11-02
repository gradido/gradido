// AI-GENERATED — not an architecture reference
import { chatPreviewWords, laterChatPreview } from './ChatPreview.logic'

const at = (iso: string) => ({ at: new Date(iso) })

describe('laterChatPreview', () => {
  const message = at('2026-10-20T10:00:00.000Z')
  const booking = at('2026-10-21T10:00:00.000Z')

  it('takes the booking where it came after the last message (E-083)', () => {
    expect(laterChatPreview(message, booking)).toBe(booking)
  })

  it('takes the message where it came after the last booking', () => {
    const later = at('2026-10-22T10:00:00.000Z')
    expect(laterChatPreview(later, booking)).toBe(later)
  })

  it('takes the message where both came at the same moment', () => {
    const same = at('2026-10-21T10:00:00.000Z')
    expect(laterChatPreview(same, booking)).toBe(same)
  })

  it('takes whichever there is, and nothing where there is neither', () => {
    expect(laterChatPreview(message, null)).toBe(message)
    expect(laterChatPreview(null, booking)).toBe(booking)
    expect(laterChatPreview(null, null)).toBeNull()
  })
})

describe('chatPreviewWords', () => {
  it('puts the subject of a message from the e-mail form before its text', () => {
    expect(chatPreviewWords('Einladung zum Fest', 'Hallo Bernd')).toBe(
      'Einladung zum Fest\n\nHallo Bernd',
    )
  })

  it('leaves out a subject that says nothing', () => {
    expect(chatPreviewWords(null, 'Hallo')).toBe('Hallo')
    expect(chatPreviewWords('', 'Hallo')).toBe('Hallo')
    expect(chatPreviewWords('  ', 'Hallo')).toBe('Hallo')
  })

  it('says nothing for a picture without words', () => {
    expect(chatPreviewWords(null, '')).toBe('')
  })
})
