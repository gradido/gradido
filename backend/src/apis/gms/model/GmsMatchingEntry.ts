// AI-GENERATED — not an architecture reference
import { MatchingEntrySelect } from 'database'

/**
 * A matching entry as the GMS receives it: plain text only. The GMS derives the
 * vector from the summary itself; the community server stays the master copy.
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
  }

  uuid: string
  matchingType: string
  summary: string
  details: string | null
  remote: boolean
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
