// AI-GENERATED — not an architecture reference
import { ContributionMessageType } from '@enum/ContributionMessageType'
import {
  AppDatabase,
  Contribution as DbContribution,
  User as DbUser,
  dbInsertFirstCreation,
  dbSelectFirstCreationByUserId,
  dbSelectFirstCreationEntriesByIds,
  dbUpdateFirstCreationOutcome,
  FirstCreationReviewReason,
  FirstCreationSelect,
  FirstCreationStatus,
  FirstCreationTestMode,
} from 'database'
import { getLogger } from 'log4js'
import { Mutex } from 'redis-semaphore'
import { Result } from 'shared'
import { AnthropicClient } from '@/apis/anthropic/AnthropicClient'
import type { FirstCreationAnswer } from '@/apis/anthropic/crea/firstCreation'
import { buildStubFirstCreationLines } from '@/apis/anthropic/crea/stub'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  composeFirstCreationInternalNote,
  composeFirstCreationMessage,
  composeFirstCreationReviewMessage,
  FirstCreationEntryDraft,
} from '@/data/FirstCreation.logic'
import {
  EVENT_FIRST_CREATION_DONE,
  EVENT_FIRST_CREATION_REVIEW,
  EVENT_FIRST_CREATION_SKIP,
  EVENT_FIRST_CREATION_UNBOOKED,
} from '@/event/Events'
import { LogError } from '@/server/LogError'
import {
  FirstCreationAlreadyRunning,
  FirstCreationError,
  FirstCreationNotEligible,
} from './FirstCreation.errors'
import { loadSignerFor, Signer, signerComments, signerConfirms } from './Signer.role'
import {
  checkEligibility,
  checkQuota,
  fileContributions,
  PreparedEntry,
  prepareEntries,
} from './Submitter.role'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.interactions.firstCreation`)
const db = AppDatabase.getInstance()

/**
 * A SUBMITTED row older than this with contributions still open is a process that broke
 * between filing and confirming; the next status read hands it to a human (G §3.4).
 */
export const FIRST_CREATION_STALE_MS = 5 * 60 * 1000

/** What the window needs to know, in one answer. */
export interface FirstCreationView {
  state: 'NONE' | FirstCreationStatus
  eligible: boolean
  message: string | null
  entries: { memo: string; confirmed: boolean }[]
  functionTestsEnabled: boolean
  testRunsLeft: number | null
}

/*
 * The first creation as an interaction (AGENTS.md): a multi-step flow with intermediate
 * state — file, ask the model, comment, confirm — and three outcomes. Two roles: the
 * SUBMITTER (the member, Submitter.role.ts) and the SIGNER (the configured admin or
 * moderator, Signer.role.ts). Everything after the filing runs through the existing
 * confirmation path in the signer's name; new is only the orchestration and the model's
 * lines (ES-002).
 *
 * ⛔ Who decides: a rule in this file. The model writes lines and may raise its hand
 * (suspicious); it never says yes and never says no. Raised hand, no answer in time, no
 * answer at all — every one of those means "a human looks first", never "refused".
 *
 * ⛔ Not atomic. The contributions live in TypeORM, the process row in Drizzle, and one
 * transaction does not cover both (AGENTS.md). So this is a state machine: SUBMITTED is
 * written right after the filing, moved forward by the outcome, and healed by
 * readFirstCreationStatus when a process broke in between — IN_REVIEW being the fallback
 * of every fallback. The booking path's own lock and confirmedAt check keep a healed or
 * repeated confirm from booking twice.
 */

/** ES-011 plus the signer: the two halves of "may the window open" in one answer. */
async function isEligible(user: DbUser, row: FirstCreationSelect | null): Promise<boolean> {
  const signer = await loadSignerFor(user.id)
  if (!signer.success) {
    return false
  }
  return (await checkEligibility(user.id, row)).success
}

/** Reads the state; heals a SUBMITTED row that the process left behind (G §3.4). */
export async function readFirstCreationStatus(
  user: DbUser,
  clientTimezoneOffset: number,
): Promise<FirstCreationView> {
  let row = await dbSelectFirstCreationByUserId(user.id)
  if (row?.status === FirstCreationStatus.SUBMITTED) {
    row = await healSubmitted(user, row, clientTimezoneOffset)
  }
  const entries = row
    ? (await dbSelectFirstCreationEntriesByIds(row.contributionIds)).map((entry) => ({
        memo: entry.memo,
        confirmed: entry.confirmedAt !== null,
      }))
    : []
  return {
    // The column is a varchar; the enum is what every writer in this file puts into it.
    state: (row?.status as FirstCreationStatus | undefined) ?? 'NONE',
    eligible: await isEligible(user, row),
    message: row?.message ?? null,
    entries,
    // L4 brings the function-test area; until then the window has nothing to show there.
    functionTestsEnabled: false,
    testRunsLeft: null,
  }
}

/**
 * A SUBMITTED row is a process in flight — or one that died. All contributions confirmed
 * means the confirm ran and only the last row update was lost: DONE, without the message
 * (it stands in the thread and the mail). Contributions still open after the stale window
 * means nobody will come back for them: the review message goes onto the thread and the
 * row to IN_REVIEW, the same as a model failure. Younger than that, it is left alone.
 */
async function healSubmitted(
  user: DbUser,
  row: FirstCreationSelect,
  clientTimezoneOffset: number,
): Promise<FirstCreationSelect> {
  const entries = await dbSelectFirstCreationEntriesByIds(row.contributionIds)
  const allConfirmed = entries.length > 0 && entries.every((entry) => entry.confirmedAt !== null)
  if (allConfirmed) {
    await dbUpdateFirstCreationOutcome(row.id, FirstCreationStatus.SUBMITTED, {
      status: FirstCreationStatus.DONE,
    })
    return { ...row, status: FirstCreationStatus.DONE }
  }
  if (Date.now() - row.updatedAt.getTime() < FIRST_CREATION_STALE_MS) {
    return row
  }
  logger.warn(`first creation ${row.id} of user ${user.id} stale in SUBMITTED, handing to review`)
  const reviewMessage = composeFirstCreationReviewMessage(user.language)
  const signer = await loadSignerFor(user.id)
  const firstId = row.contributionIds[0]
  if (signer.success && firstId !== undefined) {
    try {
      await signerComments(
        signer.value,
        firstId,
        reviewMessage,
        ContributionMessageType.DIALOG,
        clientTimezoneOffset,
      )
    } catch (error) {
      logger.error('first creation healing: review comment failed', error)
    }
  }
  const moved = await dbUpdateFirstCreationOutcome(row.id, FirstCreationStatus.SUBMITTED, {
    status: FirstCreationStatus.IN_REVIEW,
    reviewReason: FirstCreationReviewReason.MODEL_ERROR,
    message: reviewMessage,
  })
  return moved.success
    ? {
        ...row,
        status: FirstCreationStatus.IN_REVIEW,
        reviewReason: FirstCreationReviewReason.MODEL_ERROR,
        message: reviewMessage,
      }
    : ((await dbSelectFirstCreationByUserId(user.id)) ?? row)
}

/** The member closed the window with nothing entered (ES-011): an event, no row. */
export async function skipFirstCreation(user: DbUser): Promise<void> {
  await EVENT_FIRST_CREATION_SKIP(user)
}

type ModelStep =
  | { kind: 'answer'; answer: FirstCreationAnswer; model: string | null }
  | { kind: 'failure'; reason: FirstCreationReviewReason; detail: string }

/** Asks the model — or the stub, or nobody — for the lines; never throws. */
async function askModel(entries: PreparedEntry[], language: string): Promise<ModelStep> {
  const modelEntries = entries.filter((entry) => entry.check === null)
  if (modelEntries.length === 0) {
    // Only ticks: every line is fixed, nothing to ask.
    return { kind: 'answer', answer: { lines: [], suspicious: false, reason: '' }, model: null }
  }
  const client = AnthropicClient.getInstance()
  if (client) {
    const result = await client.firstCreationLines(modelEntries, language)
    if (result.success) {
      return { kind: 'answer', answer: result.value.answer, model: result.value.model }
    }
    return {
      kind: 'failure',
      reason:
        result.error.reason === 'MODEL_TIMEOUT'
          ? FirstCreationReviewReason.MODEL_TIMEOUT
          : FirstCreationReviewReason.MODEL_ERROR,
      detail: result.error.message,
    }
  }
  if (CONFIG.CREA_STUB) {
    return {
      kind: 'answer',
      answer: buildStubFirstCreationLines(modelEntries, language),
      model: 'stub',
    }
  }
  return {
    kind: 'failure',
    reason: FirstCreationReviewReason.MODEL_ERROR,
    detail: 'no model configured',
  }
}

/**
 * Saves the member's entries and runs the whole process (G §3.2). Returns the view the
 * window shows next, or one of the expected failures; anything that breaks AFTER the
 * contributions exist ends in IN_REVIEW rather than in an error.
 */
export async function submitFirstCreation(
  user: DbUser,
  drafts: FirstCreationEntryDraft[],
  clientTimezoneOffset: number,
): Promise<Result<FirstCreationView, FirstCreationError>> {
  // One process per member at a time: a second Save from a second tab is refused, not
  // queued — queued, it would find the row taken and file a second bundle for nothing.
  const mutex = new Mutex(db.getRedisClient(), `FIRST_CREATION_LOCK:${user.id}`)
  if (!(await mutex.tryAcquire())) {
    return { success: false, error: new FirstCreationAlreadyRunning() }
  }
  try {
    const signer = await loadSignerFor(user.id)
    if (!signer.success) {
      return { success: false, error: new FirstCreationNotEligible('NO_SIGNER') }
    }
    const existing = await dbSelectFirstCreationByUserId(user.id)
    const eligible = await checkEligibility(user.id, existing)
    if (!eligible.success) {
      return eligible
    }
    const prepared = prepareEntries(drafts, user.language)
    if (!prepared.success) {
      return prepared
    }
    const quota = await checkQuota(user.id, clientTimezoneOffset)
    if (!quota.success) {
      return quota
    }

    const contributions = await fileContributions(user, prepared.value, clientTimezoneOffset)
    const row = await openProcessRow(user.id, existing, contributions, prepared.value)
    const view = await runOutcome(
      user,
      signer.value,
      row,
      contributions,
      prepared.value,
      clientTimezoneOffset,
    )
    return { success: true, value: view }
  } finally {
    await mutex.release()
  }
}

/**
 * SUBMITTED, right after the filing — a fresh row, or the FORCED row the function test
 * left, moved on with the new contribution ids. Failing here after the contributions
 * exist is not an expected outcome (the lock and the eligibility check stand in front of
 * it), so it throws.
 */
async function openProcessRow(
  userId: number,
  existing: FirstCreationSelect | null,
  contributions: DbContribution[],
  entries: PreparedEntry[],
): Promise<FirstCreationSelect> {
  const contributionIds = contributions.map((contribution) => contribution.id)
  if (existing?.status === FirstCreationStatus.FORCED) {
    const moved = await dbUpdateFirstCreationOutcome(existing.id, FirstCreationStatus.FORCED, {
      status: FirstCreationStatus.SUBMITTED,
      contributionIds,
      entriesCount: entries.length,
      reviewReason: null,
      message: null,
      model: null,
      signerUserId: null,
    })
    if (!moved.success) {
      throw new LogError('first creation: forced row vanished while filing', existing.id)
    }
    const reread = await dbSelectFirstCreationByUserId(userId)
    if (!reread) {
      throw new LogError('first creation: row vanished while filing', existing.id)
    }
    return reread
  }
  const inserted = await dbInsertFirstCreation({
    userId,
    status: FirstCreationStatus.SUBMITTED,
    entriesCount: entries.length,
    contributionIds,
  })
  if (!inserted.success) {
    throw new LogError('first creation: could not open the process row', inserted.error)
  }
  return inserted.value
}

/**
 * The three outcomes (G §3.2 step 7). A — answer in time, no hand raised, real run or test
 * WITH booking: message, comment, confirm each, DONE. B — test WITHOUT booking: like A
 * without the confirms, DONE_UNBOOKED. C — hand raised, or no usable answer: the neutral
 * review message onto the thread (and the internal note if the hand was raised), IN_REVIEW.
 * Whatever throws inside lands in C as well.
 */
async function runOutcome(
  user: DbUser,
  signer: Signer,
  row: FirstCreationSelect,
  contributions: DbContribution[],
  entries: PreparedEntry[],
  clientTimezoneOffset: number,
): Promise<FirstCreationView> {
  const first = contributions[0]
  const step = await askModel(entries, user.language)
  try {
    if (step.kind === 'failure') {
      return await review(user, signer, row, first, step.reason, null, null, clientTimezoneOffset)
    }
    if (step.answer.suspicious) {
      return await review(
        user,
        signer,
        row,
        first,
        FirstCreationReviewReason.SUSPICION,
        step.answer.reason || 'no reason given',
        step.model,
        clientTimezoneOffset,
      )
    }
    const message = composeFirstCreationMessage({
      firstName: user.firstName,
      language: user.language,
      lines: step.answer.lines,
      checks: entries.flatMap((entry) => (entry.check ? [entry.check] : [])),
    })
    await signerComments(
      signer,
      first.id,
      message,
      ContributionMessageType.DIALOG,
      clientTimezoneOffset,
    )
    const withoutBooking = row.testMode === FirstCreationTestMode.WITHOUT_BOOKING
    if (!withoutBooking) {
      for (const contribution of contributions) {
        await signerConfirms(signer, contribution.id, clientTimezoneOffset)
      }
    }
    const status = withoutBooking ? FirstCreationStatus.DONE_UNBOOKED : FirstCreationStatus.DONE
    await dbUpdateFirstCreationOutcome(row.id, FirstCreationStatus.SUBMITTED, {
      status,
      message,
      model: step.model,
      signerUserId: signer.user.id,
    })
    if (withoutBooking) {
      await EVENT_FIRST_CREATION_UNBOOKED(user, signer.user, first)
    } else {
      await EVENT_FIRST_CREATION_DONE(user, signer.user, first)
    }
  } catch (error) {
    logger.error(`first creation ${row.id}: outcome failed, handing to review`, error)
    try {
      return await review(
        user,
        signer,
        row,
        first,
        FirstCreationReviewReason.MODEL_ERROR,
        null,
        step.kind === 'answer' ? step.model : null,
        clientTimezoneOffset,
      )
    } catch (reviewError) {
      logger.error(`first creation ${row.id}: review fallback failed as well`, reviewError)
    }
  }
  return readFirstCreationStatus(user, clientTimezoneOffset)
}

/** Outcome C: the neutral message to the member, the internal note for the moderation. */
async function review(
  user: DbUser,
  signer: Signer,
  row: FirstCreationSelect,
  first: DbContribution,
  reason: FirstCreationReviewReason,
  internalReason: string | null,
  model: string | null,
  clientTimezoneOffset: number,
): Promise<FirstCreationView> {
  const message = composeFirstCreationReviewMessage(user.language)
  await signerComments(
    signer,
    first.id,
    message,
    ContributionMessageType.DIALOG,
    clientTimezoneOffset,
  )
  if (internalReason !== null) {
    await signerComments(
      signer,
      first.id,
      composeFirstCreationInternalNote(internalReason),
      ContributionMessageType.MODERATOR,
      clientTimezoneOffset,
    )
  }
  await dbUpdateFirstCreationOutcome(row.id, FirstCreationStatus.SUBMITTED, {
    status: FirstCreationStatus.IN_REVIEW,
    reviewReason: reason,
    message,
    model,
    signerUserId: signer.user.id,
  })
  await EVENT_FIRST_CREATION_REVIEW(user, signer.user, first)
  return readFirstCreationStatus(user, clientTimezoneOffset)
}
