import { matchLegacyHashtag } from './legacyHashtagRule'

// Group functions: the rule that decides which memos name a group.
//
// It is the DISPLAY rule the wallet used before the group field existed, plus one
// deliberate addition -- the "# tag" typo, which never displayed as a group and is
// therefore offered and counted separately.
//
// These run without a database on purpose: the rule is the part that must not drift, and a
// test that needs a database only runs in CI.
describe('matchLegacyHashtag', () => {
  describe('the spelling that always worked', () => {
    it('finds the tag written directly after the hash', () => {
      expect(matchLegacyHashtag('Vier Stunden beim #Amstetten Fest geholfen', 'amstetten')).toBe(
        'exact',
      )
    })

    it('ignores case on both sides', () => {
      expect(matchLegacyHashtag('#AMSTETTEN', 'amstetten')).toBe('exact')
      expect(matchLegacyHashtag('#amstetten', 'Amstetten')).toBe('exact')
    })

    it('finds the tag at the very start and hard against punctuation', () => {
      expect(matchLegacyHashtag('#feuerwehr, danke!', 'feuerwehr')).toBe('exact')
      expect(matchLegacyHashtag('Danke, #feuerwehr!', 'feuerwehr')).toBe('exact')
    })

    it('keeps a hyphenated tag whole', () => {
      expect(matchLegacyHashtag('#amstetten-sued war klasse', 'amstetten-sued')).toBe('exact')
    })
  })

  describe('what it must NOT take', () => {
    // The whole reason this rule is the display rule and not the old "%#tag%" SQL one.
    it('does not read a longer word as the shorter tag', () => {
      expect(matchLegacyHashtag('#feuerwehrfest war klasse', 'feuerwehr')).toBeNull()
    })

    it('does not read a hyphenated tag as its first part', () => {
      expect(matchLegacyHashtag('#amstetten-sued', 'amstetten')).toBeNull()
    })

    // Lower-cased, but not accent-folded: "#Alesund" never displayed as "ålesund".
    it('does not fold accents, in either direction', () => {
      expect(matchLegacyHashtag('#Alesund', 'ålesund')).toBeNull()
      expect(matchLegacyHashtag('#grunwald', 'grünwald')).toBeNull()
      expect(matchLegacyHashtag('#grünwald', 'grünwald')).toBe('exact')
    })

    it('ignores the word without a hash in front of it', () => {
      expect(matchLegacyHashtag('Wir waren in Amstetten', 'amstetten')).toBeNull()
    })

    it('ignores a memo with no hash at all', () => {
      expect(matchLegacyHashtag('Zwei Stunden Gartenarbeit', 'amstetten')).toBeNull()
    })

    it('survives an empty memo', () => {
      expect(matchLegacyHashtag(null, 'amstetten')).toBeNull()
      expect(matchLegacyHashtag('', 'amstetten')).toBeNull()
    })
  })

  describe('the blank typo, which is a decision and not a repair', () => {
    it('finds a tag written after a blank', () => {
      expect(matchLegacyHashtag('Geholfen beim # Amstetten Fest', 'amstetten')).toBe('loose')
    })

    it('finds it after several blanks or a tab', () => {
      expect(matchLegacyHashtag('#   Amstetten', 'amstetten')).toBe('loose')
      expect(matchLegacyHashtag('#\tAmstetten', 'amstetten')).toBe('loose')
    })

    // A hash at the end of a line with a word under it is layout, not intent.
    it('does not cross a line break', () => {
      expect(matchLegacyHashtag('#\nAmstetten', 'amstetten')).toBeNull()
      expect(matchLegacyHashtag('Titel #\n\nAmstetten', 'amstetten')).toBeNull()
    })

    // The canonical list is the safety net: only a word naming a real group counts, which is
    // what keeps ordinary text with a stray hash out.
    it('leaves ordinary text alone, because it names no group', () => {
      expect(matchLegacyHashtag('Kosten: # 5 Euro', 'amstetten')).toBeNull()
      expect(matchLegacyHashtag('# Überschrift', 'amstetten')).toBeNull()
    })

    it('still refuses the prefix collision after a blank', () => {
      expect(matchLegacyHashtag('# feuerwehrfest', 'feuerwehr')).toBeNull()
    })
  })

  // A memo carrying both spellings is one contribution, and it is an exact hit -- otherwise
  // it would be counted under "never displayed as a group", which would be untrue of it.
  it('reports exact when a memo has both spellings', () => {
    expect(matchLegacyHashtag('#Amstetten und auch # Amstetten', 'amstetten')).toBe('exact')
    expect(matchLegacyHashtag('# Amstetten und auch #Amstetten', 'amstetten')).toBe('exact')
  })
})
