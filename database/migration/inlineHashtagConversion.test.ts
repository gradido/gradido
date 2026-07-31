import { inlineGroupTagIds } from './migrations/0109-migrate_inline_hashtags_to_group_tags'

// Lives OUTSIDE migrations/ on purpose: the migration runner loads every file in that
// directory and runs it as a migration, and detectLastDBVersion counts anything named
// "NNNN-..." as a version. A test file in there breaks both.

// The one-off conversion turns what members SAW into what is stored. Its rule therefore has
// to be the display rule, not the SQL rule the search used — those two disagreed, and a
// conversion by the SQL rule would file contributions under groups they were never shown in.
// These cases pin that difference; without them the substring reading could come back
// unnoticed, and it would be permanent.

const GROUPS = new Map<string, number>([
  ['amstetten', 1],
  ['amstetten-sued', 2],
  ['feuerwehr', 3],
  ['grünwald', 4],
])

describe('0109: inline hashtag conversion', () => {
  it('converts a hashtag that names a group', () => {
    expect(inlineGroupTagIds('Vier Stunden beim #Amstetten Fest geholfen', GROUPS)).toEqual([1])
  })

  it('ignores case, the way the display did', () => {
    expect(inlineGroupTagIds('#AMSTETTEN', GROUPS)).toEqual([1])
    expect(inlineGroupTagIds('#amstetten', GROUPS)).toEqual([1])
  })

  // The whole reason this runs in TypeScript instead of as one UPDATE with LIKE '%#tag%'.
  it('does NOT let a longer hashtag count as a shorter group', () => {
    expect(inlineGroupTagIds('#Amstetten-Sued war klasse', GROUPS)).toEqual([2])
    expect(inlineGroupTagIds('#Feuerwehrfest war klasse', GROUPS)).toEqual([])
  })

  it('ends a token at the first character that is not part of a tag', () => {
    expect(inlineGroupTagIds('Danke, #feuerwehr!', GROUPS)).toEqual([3])
    expect(inlineGroupTagIds('#feuerwehr, #amstetten', GROUPS)).toEqual([3, 1])
  })

  it('keeps a hashtag that names no group', () => {
    expect(inlineGroupTagIds('#danke fuer alles', GROUPS)).toEqual([])
  })

  it('lists a group once, however often it is written', () => {
    expect(inlineGroupTagIds('#amstetten und nochmal #Amstetten', GROUPS)).toEqual([1])
  })

  // Accents are deliberately NOT folded: "#Grunwald" never displayed as the group
  // "grünwald", so the conversion does not invent that membership either.
  it('does not fold accents', () => {
    expect(inlineGroupTagIds('#grünwald', GROUPS)).toEqual([4])
    expect(inlineGroupTagIds('#grunwald', GROUPS)).toEqual([])
  })

  it('says nothing about a memo without a hashtag', () => {
    expect(inlineGroupTagIds('Zwei Stunden Gartenarbeit', GROUPS)).toEqual([])
  })
})
