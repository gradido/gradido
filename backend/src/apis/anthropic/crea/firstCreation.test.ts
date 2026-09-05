// AI-GENERATED — not an architecture reference
import {
  buildFirstCreationUserMessage,
  checkFirstCreationAnswer,
  FIRST_CREATION_LINE_MAX_CHARS,
  FIRST_CREATION_SCHEMA,
} from './firstCreation'

const good = (n: number) => ({
  lines: Array.from({ length: n }, (_, i) => ({ entryIndex: i, text: `fuer Zeile ${i}` })),
  suspicious: false,
  reason: '',
})

describe('first creation answer form check', () => {
  it('accepts the exact shape and orders the lines by entry index', () => {
    const shuffled = {
      lines: [
        { entryIndex: 2, text: ' fuer drei ' },
        { entryIndex: 0, text: 'fuer eins' },
        { entryIndex: 1, text: 'fuer zwei' },
      ],
      suspicious: true,
      reason: ' Gewalt ',
    }
    const result = checkFirstCreationAnswer(shuffled, 3)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value.lines).toEqual(['fuer eins', 'fuer zwei', 'fuer drei'])
      expect(result.value.suspicious).toBe(true)
      expect(result.value.reason).toBe('Gewalt')
    }
  })

  it.each([
    ['a missing line', { ...good(3), lines: good(3).lines.slice(0, 2) }, 3],
    ['one line too many', good(4), 3],
    ['an index gap', { ...good(2), lines: [good(2).lines[0], { entryIndex: 2, text: 'x' }] }, 2],
    ['a repeated index', { ...good(2), lines: [good(2).lines[0], good(2).lines[0]] }, 2],
    ['an empty line', { ...good(1), lines: [{ entryIndex: 0, text: '   ' }] }, 1],
    [
      'a line that is too long',
      {
        ...good(1),
        lines: [{ entryIndex: 0, text: 'x'.repeat(FIRST_CREATION_LINE_MAX_CHARS + 1) }],
      },
      1,
    ],
    ['a non-boolean flag', { ...good(1), suspicious: 'yes' }, 1],
    ['a missing reason', { lines: good(1).lines, suspicious: false }, 1],
    ['no object at all', 'nope', 1],
  ])('rejects %s as malformed', (_name, raw, n) => {
    const result = checkFirstCreationAnswer(raw, n)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.name).toBe('FirstCreationAnswerMalformed')
    }
  })

  it('accepts a line of exactly the maximum length', () => {
    const raw = {
      ...good(1),
      lines: [{ entryIndex: 0, text: 'x'.repeat(FIRST_CREATION_LINE_MAX_CHARS) }],
    }
    expect(checkFirstCreationAnswer(raw, 1).success).toBe(true)
  })
})

describe('first creation user message', () => {
  it('carries every sentence with its index and the language, and nothing about the person', () => {
    const message = buildFirstCreationUserMessage(
      [{ memo: 'Ich habe Kuchen gebacken' }, { memo: 'Ich habe vorgelesen' }],
      'de',
    )
    expect(message).toContain('### Eintrag 0 (entryIndex 0)\nIch habe Kuchen gebacken')
    expect(message).toContain('### Eintrag 1 (entryIndex 1)\nIch habe vorgelesen')
    expect(message).toContain('"de"')
    expect(message).toContain(`${FIRST_CREATION_LINE_MAX_CHARS} Zeichen`)
    // No placeholder for a name and no name field: the salutation is built locally.
    expect(message).not.toContain('[ANREDE]')
    expect(message).not.toMatch(/Vorname|firstName|E-Mail|Alias/)
  })

  it('pins the schema the API is constrained to', () => {
    expect(FIRST_CREATION_SCHEMA.required).toEqual(['lines', 'suspicious', 'reason'])
    expect(FIRST_CREATION_SCHEMA.properties.lines.items.required).toEqual(['entryIndex', 'text'])
  })
})
