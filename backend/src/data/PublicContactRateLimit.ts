// AI-GENERATED — not an architecture reference
/**
 * How often one origin may use the public contact form.
 *
 * ## Why this exists at all
 *
 * The house already slows requests down (`express-slow-down` in createServer), but that
 * guard is about server load, not about post: it lets ten requests per second through
 * undelayed, which is around 864,000 mails a day from a single address. A door that hands
 * mail to a member without anybody logging in needs a bound of its own.
 *
 * ## Why it keeps its counters in the process and not in a table
 *
 * A table would survive a restart - and would hold visitors' IP addresses on disk, which
 * is a new pile of personal data, complete with a deletion deadline, in exchange for one
 * number. Counting in the process keeps the address in memory for at most a day and writes
 * nothing anywhere. The price is stated rather than hidden: a restart forgets everybody,
 * and several backend processes would each count on their own. If the counter in the log
 * ever shows that this is not enough, a table is the second answer, not the first.
 */

// Deliberately not configurable through the environment: a new name in `.env.template`
// is a deploy change, and it would have to reach every server before the code that reads it.
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const MAX_PER_HOUR = 3
const MAX_PER_DAY = 10

interface OriginRecord {
  hourStart: number
  hourCount: number
  dayStart: number
  dayCount: number
}

export class PublicContactRateLimit {
  private readonly origins = new Map<string, OriginRecord>()

  /**
   * Counts one attempt and says whether it may go through.
   *
   * The caller passes `now` so a test does not have to wait an hour; production leaves it out.
   */
  public allow(origin: string, now: number = Date.now()): boolean {
    this.forget(now)
    const record = this.origins.get(origin) ?? {
      hourStart: now,
      hourCount: 0,
      dayStart: now,
      dayCount: 0,
    }
    if (now - record.hourStart >= HOUR_MS) {
      record.hourStart = now
      record.hourCount = 0
    }
    if (now - record.dayStart >= DAY_MS) {
      record.dayStart = now
      record.dayCount = 0
    }
    record.hourCount++
    record.dayCount++
    this.origins.set(origin, record)
    return record.hourCount <= MAX_PER_HOUR && record.dayCount <= MAX_PER_DAY
  }

  /**
   * Drops origins whose day is over. Without this the map would grow for as long as the
   * process lives - and growing it is exactly what somebody sending in bulk would do.
   */
  private forget(now: number): void {
    for (const [origin, record] of this.origins) {
      if (now - record.dayStart >= DAY_MS) {
        this.origins.delete(origin)
      }
    }
  }
}

export const publicContactRateLimit = new PublicContactRateLimit()
