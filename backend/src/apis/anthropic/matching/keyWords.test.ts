// AI-GENERATED — not an architecture reference
import { indexWordsOf, normaliseKeyWord, normaliseKeyWords } from './keyWords'

/**
 * The folding cases below are the same, with the same answers, as in the GMS's
 * `matching/keyWords.test.ts`. Two copies of one rule need two copies of the proof:
 * what makes a member here find a member there is that both sides fold a word to the
 * same string, and only a test on each side can say that they do.
 *
 * The `indexWordsOf` cases are not shared - this column is nullable and the GMS's is
 * not - so do not expect that half to diff clean.
 */
describe('normaliseKeyWord', () => {
  it('lower-cases', () => {
    expect(normaliseKeyWord('Fahrrad')).toBe('fahrrad')
  })

  it('spells out the German umlauts rather than dropping them', () => {
    expect(normaliseKeyWord('Rasenlüfter')).toBe('rasenluefter')
    expect(normaliseKeyWord('Bäcker')).toBe('baecker')
    expect(normaliseKeyWord('Möbel')).toBe('moebel')
    expect(normaliseKeyWord('Straße')).toBe('strasse')
  })

  // macOS and some input methods produce the DECOMPOSED form - a plain `u` followed
  // by a combining diaeresis. Without folding that to the precomposed one first, the
  // mark is simply dropped and `rasenlufter` joins the vocabulary beside
  // `rasenluefter` as a second word for one thing. Both servers would agree on it,
  // which is what would make it invisible.
  it('folds the decomposed umlaut the same as the precomposed one', () => {
    expect(normaliseKeyWord('Rasenl\u00fcfter')).toBe('rasenluefter')
    expect(normaliseKeyWord('Rasenlu\u0308fter')).toBe('rasenluefter')
  })

  it('drops spaces, hyphens and punctuation', () => {
    expect(normaliseKeyWord('e-bike')).toBe('ebike')
    expect(normaliseKeyWord('nachhilfe mathematik')).toBe('nachhilfemathematik')
    expect(normaliseKeyWord('reparatur.')).toBe('reparatur')
  })

  it('keeps digits', () => {
    expect(normaliseKeyWord('E45-Motor')).toBe('e45motor')
  })

  // The measured cost of folding to [a-z0-9] rather than transliterating. Pinned here
  // so a later widening is a decision rather than a surprise: it would change which
  // entries find each other, and it would have to change on both sides at once.
  it('mangles a letter it has no rule for, and empties a foreign script', () => {
    expect(normaliseKeyWord('café')).toBe('caf')
    expect(normaliseKeyWord('велосипед')).toBe('')
  })
})

describe('normaliseKeyWords', () => {
  it('normalises, keeps the order it was given, and folds duplicates', () => {
    expect(normaliseKeyWords(['Rasenlüfter', 'vertikutierer', 'RASENLUEFTER'])).toEqual([
      'rasenluefter',
      'vertikutierer',
    ])
  })

  it('drops what normalises to nothing instead of keeping an empty word', () => {
    // An empty word in an index would share a word with every other entry that has
    // one, so it must never reach the column or the vocabulary.
    expect(normaliseKeyWords(['fahrrad', '???', '', 'велосипед'])).toEqual(['fahrrad'])
  })
})

describe('indexWordsOf', () => {
  it('adds subject, actor and sought actor to the coined words', () => {
    expect(
      indexWordsOf({
        keyWords: ['fahrradreparatur', 'fahrrad', 'reparatur'],
        keySubject: 'fahrrad',
        keyActor: 'fahrradmechaniker',
        keySoughtActor: null,
      }),
    ).toEqual(['fahrradreparatur', 'fahrrad', 'reparatur', 'fahrradmechaniker'])
  })

  it('takes the sought actor in, which is what a need is found by', () => {
    expect(
      indexWordsOf({
        keyWords: ['wasserhahn', 'tropfen'],
        keySubject: 'wasserhahn',
        keyActor: null,
        keySoughtActor: 'installateur',
      }),
    ).toEqual(['wasserhahn', 'tropfen', 'installateur'])
  })

  it('folds the three away again when the model already named them', () => {
    expect(
      indexWordsOf({
        keyWords: ['dachdecker', 'dach'],
        keySubject: 'dach',
        keyActor: 'dachdecker',
        keySoughtActor: null,
      }),
    ).toEqual(['dachdecker', 'dach'])
  })

  it('is empty for an entry that was never keyed', () => {
    expect(indexWordsOf({ keyWords: null })).toEqual([])
  })
})
