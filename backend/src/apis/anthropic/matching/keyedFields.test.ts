// AI-GENERATED — not an architecture reference
import { KEY_TRAIT_MAX_CHARS, KEY_WORD_MAX_CHARS, MAX_KEY_WORDS_PER_ENTRY } from 'shared'
import type { KeyingAnswerRecord } from './instruction'
import { keyedFieldsFromAnswer } from './keyedFields'

/** A record shaped the way the model answers, with the German field names. */
const answer = (overrides: Partial<KeyingAnswerRecord> = {}): KeyingAnswerRecord => ({
  nr: 1,
  schluessel: ['wohnungsrenovierung', 'renovierung', 'maler'],
  sache: 'wohnung',
  taetigkeit: 'renovieren',
  klasse: 'reparatur',
  gebiet: 'bau',
  wer: 'maler',
  merkmal: ['professionell'],
  gesuchter_beruf: '',
  ...overrides,
})

describe('keyedFieldsFromAnswer', () => {
  it('translates the German field names to the ones we store', () => {
    const { fields } = keyedFieldsFromAnswer(answer())
    expect(fields).toEqual({
      keyWords: ['wohnungsrenovierung', 'renovierung', 'maler'],
      keySubject: 'wohnung',
      keyActivity: 'renovieren',
      keyCategory: 'reparatur',
      keyArea: 'bau',
      keyActor: 'maler',
      keySoughtActor: null,
      keyTraits: ['professionell'],
    })
  })

  it('folds the fields that go into the index', () => {
    const { fields } = keyedFieldsFromAnswer(
      answer({ schluessel: ['Rasenlüfter'], sache: 'Grünfläche', wer: 'Gärtner' }),
    )
    expect(fields.keyWords).toEqual(['rasenluefter'])
    expect(fields.keySubject).toBe('gruenflaeche')
    expect(fields.keyActor).toBe('gaertner')
  })

  it('leaves the fields nothing compares as the model wrote them', () => {
    // Folding would cost the spelling and buy nothing: no search ever looks at these.
    const { fields } = keyedFieldsFromAnswer(
      answer({ taetigkeit: 'Bäume fällen', gebiet: 'Garten & Hof' }),
    )
    expect(fields.keyActivity).toBe('Bäume fällen')
    expect(fields.keyArea).toBe('Garten & Hof')
  })

  it('leaves traits alone beyond trimming them', () => {
    // They are short phrases, not words. Folding would turn `fuer kinder` into one
    // unreadable string, and nothing gains from it.
    const { fields } = keyedFieldsFromAnswer(answer({ merkmal: ['  fuer kinder ', 'gebraucht'] }))
    expect(fields.keyTraits).toEqual(['fuer kinder', 'gebraucht'])
  })

  it('turns the empty answers into null', () => {
    // The model answers with an empty string where a field does not apply -
    // `gesuchter_beruf` outside the "sucht" channel is the everyday case - and null
    // is what means "nothing here" everywhere downstream.
    const { fields } = keyedFieldsFromAnswer(
      answer({ gesuchter_beruf: '', wer: '', taetigkeit: '' }),
    )
    expect(fields.keySoughtActor).toBeNull()
    expect(fields.keyActor).toBeNull()
    expect(fields.keyActivity).toBeNull()
  })

  it('keeps the sought actor when the channel is one that has it', () => {
    const { fields } = keyedFieldsFromAnswer(answer({ gesuchter_beruf: 'Installateur' }))
    expect(fields.keySoughtActor).toBe('installateur')
  })

  it('drops a category that is not one of the twelve, and says so', () => {
    // The schema asks for one of the twelve, so anything else is an answer that
    // ignored the list. Dropping it costs one field; refusing the whole answer would
    // cost the member their keying.
    const { fields, dropped } = keyedFieldsFromAnswer(answer({ klasse: 'reparieren' }))
    expect(fields.keyCategory).toBeNull()
    expect(dropped).toContain('category "reparieren" is not one of the twelve')
    expect(fields.keyWords).toHaveLength(3)
  })

  it('drops an over-long word and keeps the rest of the answer', () => {
    const tooLong = 'a'.repeat(KEY_WORD_MAX_CHARS + 1)
    const { fields, dropped } = keyedFieldsFromAnswer(
      answer({ schluessel: ['fahrrad', tooLong, 'reparatur'] }),
    )
    expect(fields.keyWords).toEqual(['fahrrad', 'reparatur'])
    expect(dropped).toHaveLength(1)
  })

  it('drops an over-long trait as well', () => {
    const { fields, dropped } = keyedFieldsFromAnswer(
      answer({ merkmal: ['gebraucht', 'x'.repeat(KEY_TRAIT_MAX_CHARS + 1)] }),
    )
    expect(fields.keyTraits).toEqual(['gebraucht'])
    expect(dropped).toHaveLength(1)
  })

  it('caps a runaway answer at the number of words an entry may carry', () => {
    const many = Array.from({ length: MAX_KEY_WORDS_PER_ENTRY + 20 }, (_, i) => `wort${i}`)
    const { fields } = keyedFieldsFromAnswer(answer({ schluessel: many }))
    expect(fields.keyWords).toHaveLength(MAX_KEY_WORDS_PER_ENTRY)
  })

  it('folds duplicates the model repeated', () => {
    const { fields } = keyedFieldsFromAnswer(
      answer({ schluessel: ['fahrrad', 'Fahrrad', 'fahrrad'] }),
    )
    expect(fields.keyWords).toEqual(['fahrrad'])
  })

  it('survives a record with nothing in it', () => {
    // Not a hypothetical: the schema requires every field, but an empty string and an
    // empty list satisfy it, and that is what a sentence the model made nothing of
    // comes back as. It has to become a keying with no words, not a crash.
    const { fields } = keyedFieldsFromAnswer({ nr: 1 })
    expect(fields.keyWords).toEqual([])
    expect(fields.keySubject).toBeNull()
    expect(fields.keyTraits).toEqual([])
  })
})
