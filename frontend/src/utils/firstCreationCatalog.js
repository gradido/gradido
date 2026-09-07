// AI-GENERATED — not an architecture reference

/**
 * The sentence stems of the first creation, grouped for the window (J §4).
 *
 * ⛔ The KEYS are a literal on both sides of the wire and have to agree. The backend builds
 * the memo from the key alone -- `FIRST_CREATION_CATALOG_KEYS` in
 * `backend/src/data/FirstCreation.logic.ts`, read out of `core/src/locales` -- and refuses
 * an entry whose key it does not know (`UNKNOWN_KEY`). Neither package can import the
 * other, so the only thing holding the two lists together is the test beside this file:
 * it counts them and compares them name by name against the copy written down there.
 *
 * ★ The GROUPING is the window's own business and nothing else reads it. The backend keeps
 * the list flat on purpose, so a category can be renamed, split or reordered here without
 * a backend release -- as long as no key leaves and none is invented.
 *
 * ⚠️ The TEXTS live in `frontend/src/locales`, under `firstCreation.catalog.<key>`, and are
 * a second copy of what `core/src/locales` says. That is deliberate and not a mistake to be
 * tidied away: the window shows the stem before anything is sent, and the backend writes
 * the stem that ends up in the ledger. Two readers, two files. The `locales` test checks
 * that every key here has a text in de and en; whether the two files WORD it identically is
 * a question for the localisation work, not for this file.
 */

/** The six groups, in the order the window shows them (E §1, mockup V02). */
export const FIRST_CREATION_CATEGORIES = [
  {
    key: 'cannotThemselves',
    stems: [
      'helpedSickPerson',
      'helpedOldPerson',
      'supportedDisabledPerson',
      'accompaniedHardTime',
    ],
  },
  {
    key: 'familyCare',
    stems: ['caredForChildren', 'lookedAfterGrandchildren', 'nursedRelative'],
  },
  {
    key: 'communityVolunteering',
    stems: [
      'supportedClub',
      'fireBrigadeRescue',
      'helpedParish',
      'communityProject',
      'helpedFellowStudents',
      'helpedNeighbourhood',
    ],
  },
  {
    key: 'animalsNature',
    stems: ['animalShelter', 'natureEnvironment'],
  },
  {
    key: 'knowledgeCulture',
    stems: ['sharedKnowledge', 'musicChoirCulture'],
  },
  {
    key: 'forChildren',
    stems: [
      'helpedAtHome',
      'madeSomeoneHappy',
      'lookedAfterOrTaught',
      'helpedElderlyPerson',
      'animalsOrNature',
    ],
  },
]

/**
 * The sentences a member TICKS rather than completes. No free text, no model line -- the
 * whole entry is the tick (ES-008: it counts as an entry, so somebody who only ticks gets
 * the hundred on one contribution).
 *
 * `child` is stage two and deliberately absent rather than present and hidden.
 */
export const FIRST_CREATION_CHECK_KEYS = ['retiree', 'child']

/**
 * Ticks that cannot both be true of one person. "Ich bin Rentnerin / Rentner" and "Ich bin
 * ein Kind" are two answers to the same question, and both at once says something about the
 * member that cannot be so (Bernd, 07.09.).
 *
 * ⛔ A named GROUP, not "the other tick". There are two of them today, and a third one
 * anybody adds will not necessarily contradict either — a blanket "at most one tick" would
 * refuse a tick that is simply a second true thing.
 *
 * ⚠️ The backend holds the same list (`FIRST_CREATION_EXCLUSIVE_CHECKS` in
 * `backend/src/data/FirstCreation.logic.ts`) and neither package can import the other, so
 * the test beside the locales compares the two by hand, as it does for the keys themselves.
 * The two lists do different jobs: here a tick takes the other one's place, there the
 * bundle is handed to a moderator.
 */
export const FIRST_CREATION_EXCLUSIVE_CHECKS = ['retiree', 'child']

/** Every stem, flat -- the shape the backend's list has, for the test to compare against. */
export const FIRST_CREATION_CATALOG_KEYS = FIRST_CREATION_CATEGORIES.flatMap(
  (category) => category.stems,
)

/**
 * How many stems of a category stand open before "show more" (W5). Three, because the
 * window has to stay usable on a phone, where the whole catalog unfolded is longer than
 * anybody scrolls (mockup V02 §5).
 */
export const FIRST_CREATION_STEMS_VISIBLE = 3

/**
 * The ceiling the backend enforces (`FIRST_CREATION_MAX_ENTRIES`). Mirrored here so the
 * window can stop offering another line rather than let the member write one and have it
 * refused -- change one, change both.
 */
export const FIRST_CREATION_MAX_ENTRIES = 10

/**
 * How many words an opened field needs before Save comes alive.
 *
 * ⚠️ This is the real floor, not the backend's `MEMO_MIN_CHARS` of five: a stem plus "ja"
 * already clears five characters, and what the community reads back would be a sentence
 * that says nothing. Three words is a form rule and nothing more -- the text itself is
 * never corrected or commented on (D §7.3.3, Helena).
 */
export const FIRST_CREATION_MIN_WORDS = 3
