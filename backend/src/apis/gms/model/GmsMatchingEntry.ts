// AI-GENERATED — not an architecture reference
import { MatchingEntrySelect } from 'database'

/**
 * What a language model made of an entry's sentence, as the GMS receives it.
 *
 * All of it or none of it, and that is what the group is for: the GMS reads an absent
 * keying as "this caller says nothing about it" and keeps what it has, while a present
 * one is written whole - including the fields the model left empty, which is how a
 * re-keying can take a word back rather than only add one.
 *
 * `instructionVersion` is what makes the difference visible over there, so it travels
 * even though the GMS cannot re-key anything itself: it is how an operator sees which
 * communities have caught up with an improved instruction.
 *
 * The index the entry is found under is deliberately NOT in here. The GMS derives it
 * from these fields itself - what an entry is findable under is not a community
 * server's decision.
 */
export class GmsEntryKeying {
  constructor(entry: MatchingEntrySelect, instructionVersion: string, keyedAt: Date) {
    this.keyWords = entry.keyWords ?? []
    this.keySubject = entry.keySubject
    this.keyActivity = entry.keyActivity
    this.keyCategory = entry.keyCategory
    this.keyArea = entry.keyArea
    this.keyActor = entry.keyActor
    this.keySoughtActor = entry.keySoughtActor
    this.keyTraits = entry.keyTraits ?? []
    this.instructionVersion = instructionVersion
    this.keyedAt = keyedAt.toISOString()
  }

  keyWords: string[]
  keySubject: string | null
  keyActivity: string | null
  keyCategory: string | null
  keyArea: string | null
  keyActor: string | null
  keySoughtActor: string | null
  keyTraits: string[]
  instructionVersion: string
  keyedAt: string
}

/**
 * A matching entry as the GMS receives it: the member's own text, plus the keying if
 * this entry has one. The GMS derives the vector from the summary itself and the
 * index from the keying; the community server stays the master copy.
 *
 * Note there is no `active` flag: a paused entry is not sent, it is deleted. The
 * GMS only ever holds entries that may actually turn up in someone's search.
 */
export class GmsMatchingEntry {
  constructor(entry: MatchingEntrySelect) {
    this.uuid = entry.uuid
    this.matchingType = entry.matchingType
    this.summary = entry.summary
    this.details = entry.details
    this.remote = entry.remote
    // Left off entirely when the entry has not been keyed, rather than sent as null:
    // absent is what tells the GMS to leave whatever it has alone, and an entry that
    // was just edited is exactly the case where that matters.
    this.keying = keyingOf(entry)
  }

  uuid: string
  matchingType: string
  summary: string
  details: string | null
  remote: boolean
  keying?: GmsEntryKeying
}

/**
 * The keying of an entry, or nothing when it has none.
 *
 * `instruction_version` and `keyed_at` are the witness: the ten keyed columns are
 * written together, and these two are the ones that cannot legitimately be empty for
 * a keyed entry, so either both are there or nothing was ever worked out.
 */
function keyingOf(entry: MatchingEntrySelect): GmsEntryKeying | undefined {
  if (!entry.instructionVersion || !entry.keyedAt) {
    return undefined
  }
  return new GmsEntryKeying(entry, entry.instructionVersion, entry.keyedAt)
}

/** One entry addressed to its owner - the payload of the per-entry route. */
export class GmsUserMatchingEntry extends GmsMatchingEntry {
  constructor(userUuid: string, entry: MatchingEntrySelect) {
    super(entry)
    this.userUuid = userUuid
  }

  userUuid: string
}

/**
 * One member's entries, stated in full. What is in `entries` is written, what is
 * missing from it is removed, and an empty list says the member has no entries at
 * all. A member nobody sends a snapshot for is not touched.
 *
 * That is how a repair run cleans up entries which were paused or deleted while the
 * GMS could not be reached, without ever sending a delete.
 */
export class GmsMatchingEntrySnapshot {
  constructor(userUuid: string, entries: MatchingEntrySelect[]) {
    this.userUuid = userUuid
    this.entries = entries.map((entry) => new GmsMatchingEntry(entry))
  }

  userUuid: string
  entries: GmsMatchingEntry[]
}
