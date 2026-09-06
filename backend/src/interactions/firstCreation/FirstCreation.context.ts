// AI-GENERATED — not an architecture reference
import { ContributionMessageType } from '@enum/ContributionMessageType'
import {
  AppDatabase,
  Contribution as DbContribution,
  User as DbUser,
  dbFindLatestEventForAffectedUser,
  dbGetFirstCreationSignerUserId,
  dbInsertFirstCreation,
  dbSelectFirstCreationByUserId,
  dbSelectFirstCreationEntriesByIds,
  dbUpdateFirstCreationOutcome,
  FirstCreationEntryRow,
  FirstCreationReviewReason,
  FirstCreationSelect,
  FirstCreationStatus,
  FirstCreationTestMode,
} from 'database'
import { getLogger } from 'log4js'
import { Mutex } from 'redis-semaphore'
import { Result, VoidResult } from 'shared'
import { AnthropicClient } from '@/apis/anthropic/AnthropicClient'
import type { FirstCreationAnswer } from '@/apis/anthropic/crea/firstCreation'
import { buildStubFirstCreationLines } from '@/apis/anthropic/crea/stub'
import { RIGHTS } from '@/auth/RIGHTS'
import { roleByName } from '@/auth/ROLES'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  composeFirstCreationInternalNote,
  composeFirstCreationMessage,
  composeFirstCreationReviewMessage,
  FirstCreationEntryDraft,
  hasFirstCreationCatalog,
} from '@/data/FirstCreation.logic'
import {
  EVENT_FIRST_CREATION_DONE,
  EVENT_FIRST_CREATION_REVIEW,
  EVENT_FIRST_CREATION_SKIP,
  EVENT_FIRST_CREATION_TEST,
  EVENT_FIRST_CREATION_UNBOOKED,
  EventType,
} from '@/event/Events'
import {
  FirstCreationAlreadyRunning,
  FirstCreationError,
  FirstCreationNotEligible,
  FirstCreationTestRefused,
} from './FirstCreation.errors'
import { loadSignerFor, Signer, signerComments, signerConfirms } from './Signer.role'
import {
  checkEligibility,
  checkQuota,
  countRemainingTestRuns,
  fileContributions,
  PreparedEntry,
  prepareEntries,
} from './Submitter.role'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.interactions.firstCreation`)
const db = AppDatabase.getInstance()

/**
 * A SUBMITTED row older than this whose lock nobody holds is a process that died between
 * claiming the row and settling; the next status read hands it to a human (G §3.4).
 */
export const FIRST_CREATION_STALE_MS = 5 * 60 * 1000

/** What the window needs to know, in one answer. */
export interface FirstCreationView {
  state: 'NONE' | FirstCreationStatus
  eligible: boolean
  message: string | null
  entries: FirstCreationEntryView[]
  /**
   * Whether the member has closed the window with "nothing comes to mind" before (ES-012):
   * the project-account question is asked on the FIRST skip only, and the skip event is the
   * one trace a skip leaves.
   */
  skippedBefore: boolean
  functionTestsEnabled: boolean
  testRunsLeft: number | null
  isFirstCreationSigner: boolean | null
}

export interface FirstCreationEntryView {
  memo: string
  confirmed: boolean
  /** PENDING | IN_PROGRESS | CONFIRMED | DENIED | DELETED - read off the contribution. */
  status: string
}

/*
 * The first creation as an interaction (AGENTS.md): a multi-step flow with intermediate
 * state — claim, file, ask the model, comment, confirm — and three outcomes. Two roles: the
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
 * transaction does not cover both (AGENTS.md). So this is a state machine, and its ORDER
 * is the safety: the row is claimed FIRST (the unique key on user_id is the arbiter, the
 * Redis lock only keeps two tabs from racing to the same refusal), then the contributions
 * are filed and their ids written onto the row, then the outcome moves the row on. From
 * the claim onwards nothing throws out of the process: whatever breaks lands in IN_REVIEW
 * with a reason, and a status read heals a row whose process died — but only when nobody
 * holds that member's lock any more.
 */

/**
 * ES-011 plus the signer plus the catalog plus the account kind: the halves of "may the
 * window open". A project account (ES-021) never sees it — the deny-list in isAuthorized
 * refuses the status query outright, and this is the same answer one layer in, for the
 * paths that reach the interaction without the resolver.
 */
async function isEligible(user: DbUser, row: FirstCreationSelect | null): Promise<boolean> {
  if (!user.creationAllowed) {
    return false
  }
  // Cheapest checks first: a settled row and a manual contribution need no signer lookup.
  if (!(await checkEligibility(user.id, row)).success) {
    return false
  }
  if (!hasFirstCreationCatalog(user.language)) {
    return false
  }
  return (await loadSignerFor(user.id)).success
}

const lockKey = (userId: number) => `FIRST_CREATION_LOCK:${userId}`

/**
 * The per-member lock. `onLockLost` logs instead of throwing: redis-semaphore refreshes the
 * key from a timer while the process waits for the model, and a throw from that timer
 * would be an unhandled rejection that takes the whole backend down.
 */
const memberLock = (userId: number) =>
  new Mutex(db.getRedisClient(), lockKey(userId), {
    onLockLost: (error) => logger.error(`first creation lock lost for user ${userId}`, error),
  })

const releaseQuietly = async (mutex: Mutex, userId: number): Promise<void> => {
  try {
    await mutex.release()
  } catch (error) {
    // A failed release must not turn a finished process into an error answer; the key
    // expires on its own.
    logger.error(`first creation lock release failed for user ${userId}`, error)
  }
}

const entryView = (entry: FirstCreationEntryRow): FirstCreationEntryView => ({
  memo: entry.memo,
  confirmed: entry.confirmedAt !== null,
  status: entry.deletedAt ? 'DELETED' : entry.status,
})

/** Reads the state; heals a SUBMITTED row whose process died (G §3.4). */
export async function readFirstCreationStatus(
  user: DbUser,
  clientTimezoneOffset: number,
): Promise<FirstCreationView> {
  let row = await dbSelectFirstCreationByUserId(user.id)
  if (row?.status === FirstCreationStatus.SUBMITTED) {
    row = await healSubmitted(user, row, clientTimezoneOffset)
  }
  // A FORCED row is a window about to reopen: what it shows belongs to the run that
  // has not happened yet, not to the one before.
  const showsPreviousRun = row?.status === FirstCreationStatus.FORCED
  const entries =
    row && !showsPreviousRun
      ? (await dbSelectFirstCreationEntriesByIds(row.contributionIds)).map(entryView)
      : []
  return {
    // The column is a varchar; the enum is what every writer in this file puts into it.
    state: (row?.status as FirstCreationStatus | undefined) ?? 'NONE',
    eligible: await isEligible(user, row),
    message: showsPreviousRun ? null : (row?.message ?? null),
    entries,
    skippedBefore:
      (await dbFindLatestEventForAffectedUser(EventType.FIRST_CREATION_SKIP, user.id)) !== null,
    ...(await functionTestView(user, clientTimezoneOffset)),
  }
}

/**
 * The three fields the function-test area reads (ES-014). They answer TOGETHER or not at
 * all: the switch is a plain server setting and everybody may know it, but the count and
 * the signer question cost two more reads apiece, so they are asked only for an account
 * that actually holds the key — which is every reader of that area and nobody else.
 *
 * The role is read off the user's own `userRoles`, the same relation isAuthorized loads
 * onto the context user (`relations: ['emailContact', 'userRoles']`) and the same mapping
 * it applies. A user handed in without that relation falls to ROLE_USER through
 * roleByName's default branch, so the two extra reads are skipped and the fields say
 * nothing — the direction a mistake has to fail in.
 */
async function functionTestView(
  user: DbUser,
  clientTimezoneOffset: number,
): Promise<
  Pick<FirstCreationView, 'functionTestsEnabled' | 'testRunsLeft' | 'isFirstCreationSigner'>
> {
  const enabled = CONFIG.FUNCTION_TESTS_ENABLED
  const mayRunFunctionTests = roleByName(user.userRoles?.[0]?.role).hasRight(RIGHTS.FUNCTION_TESTS)
  if (!enabled || !mayRunFunctionTests) {
    return { functionTestsEnabled: enabled, testRunsLeft: null, isFirstCreationSigner: null }
  }
  return {
    functionTestsEnabled: true,
    testRunsLeft: await countRemainingTestRuns(user.id, clientTimezoneOffset),
    isFirstCreationSigner: (await dbGetFirstCreationSignerUserId()) === user.id,
  }
}

/**
 * A SUBMITTED row is a process in flight — or one that died. Alive is what the lock says:
 * while the member's lock is held, the row is left alone whatever its age. With the lock
 * free, all contributions confirmed means the confirm ran and only the last row update was
 * lost: DONE. Contributions still open after the stale window means nobody will come back
 * for them: the review note goes onto the thread and the row to IN_REVIEW.
 */
async function healSubmitted(
  user: DbUser,
  row: FirstCreationSelect,
  clientTimezoneOffset: number,
): Promise<FirstCreationSelect> {
  if (Date.now() - row.updatedAt.getTime() < FIRST_CREATION_STALE_MS) {
    return row
  }
  const mutex = memberLock(user.id)
  if (!(await mutex.tryAcquire())) {
    // Somebody is still working on it.
    return row
  }
  try {
    const entries = await dbSelectFirstCreationEntriesByIds(row.contributionIds)
    const allConfirmed = entries.length > 0 && entries.every((entry) => entry.confirmedAt !== null)
    if (allConfirmed) {
      const moved = await dbUpdateFirstCreationOutcome(row.id, FirstCreationStatus.SUBMITTED, {
        status: FirstCreationStatus.DONE,
      })
      return moved.success
        ? { ...row, status: FirstCreationStatus.DONE }
        : ((await dbSelectFirstCreationByUserId(user.id)) ?? row)
    }
    logger.warn(`first creation ${row.id} of user ${user.id} stale in SUBMITTED, handing to review`)
    const signer = await loadSignerFor(user.id)
    await settleInReview({
      user,
      signer: signer.success ? signer.value : null,
      row,
      contributionIds: row.contributionIds,
      reason: FirstCreationReviewReason.PROCESS_ERROR,
      internalReason: null,
      model: null,
      clientTimezoneOffset,
    })
    return (await dbSelectFirstCreationByUserId(user.id)) ?? row
  } finally {
    await releaseQuietly(mutex, user.id)
  }
}

/**
 * The member closed the window with nothing entered (ES-011): an event, no row — and only
 * when the window was open, so the skipper count counts skippers.
 */
export async function skipFirstCreation(user: DbUser): Promise<void> {
  const row = await dbSelectFirstCreationByUserId(user.id)
  if (await isEligible(user, row)) {
    await EVENT_FIRST_CREATION_SKIP(user)
  }
}

/**
 * ES-014: reopen this admin's OWN window on an account that has long since created, and
 * say which of the two variants the run that follows is (ES-016). Everything after this is
 * the ordinary process — the row is simply put back to FORCED, which is the one state
 * checkEligibility lets past a member who has already created.
 *
 * ⛔ Refused BEFORE the row is written wherever the run could not finish anyway — see the
 * signer check below. The wallet says the same thing in front of the button
 * (isFirstCreationSigner); this is what holds against a bare API call.
 *
 * The member's own lock is taken for the same reason submitFirstCreation takes it: a run
 * in flight must not have its row pulled back under it.
 */
export async function startFirstCreationTest(
  user: DbUser,
  withBooking: boolean,
  clientTimezoneOffset: number,
): Promise<VoidResult<FirstCreationTestRefused>> {
  if (!CONFIG.FUNCTION_TESTS_ENABLED) {
    return { success: false, error: new FirstCreationTestRefused('DISABLED') }
  }
  // ES-021: an administrator who declared their own account a project account. FUNCTION_TESTS
  // is not on the deny-list, so this is the one door in — and a forced row alone opens no
  // window (isEligible asks the account kind first). Refused here, where it can be said.
  if (!user.creationAllowed) {
    return { success: false, error: new FirstCreationTestRefused('PROJECT_ACCOUNT') }
  }
  // ⛔ Both halves, and for one reason: a forced row alone does not open a window.
  // isEligible asks for a signer as well, so pressing the button without one — or as the
  // signer, for whom loadSignerFor answers IS_MEMBER — would write the row, send the admin
  // to the overview and show them nothing at all. Refused here, where it can be said.
  const signer = await loadSignerFor(user.id)
  if (!signer.success) {
    const refusal = signer.error.reason === 'IS_MEMBER' ? 'IS_SIGNER' : 'NO_SIGNER'
    return { success: false, error: new FirstCreationTestRefused(refusal) }
  }
  // The same question submitFirstCreation asks, asked one step earlier: the window would
  // open on an exhausted month and refuse the moment the entries were written out. The
  // wallet greys both buttons at zero runs left, which leaves a hand-written call as the
  // only way here — and ES-015 says an exhausted month is told BEFORE, not after.
  if (!(await checkQuota(user.id, clientTimezoneOffset)).success) {
    return { success: false, error: new FirstCreationTestRefused('NO_QUOTA') }
  }
  const mutex = memberLock(user.id)
  if (!(await mutex.tryAcquire())) {
    return { success: false, error: new FirstCreationTestRefused('RUNNING') }
  }
  try {
    const forced = await forceProcessRow(user.id, withBooking)
    if (!forced.success) {
      return forced
    }
  } finally {
    await releaseQuietly(mutex, user.id)
  }
  // The row is the outcome and it is written; the event is its trace. A failing trace is
  // logged, never turned into an answer that says the press did not work while the window
  // is in fact armed — the same rule the outcome events downstream follow.
  try {
    await EVENT_FIRST_CREATION_TEST(user)
  } catch (error) {
    logger.error(`first creation test: event failed for user ${user.id}`, error)
  }
  return { success: true }
}

/**
 * The row, put back to FORCED. A row that is SUBMITTED belongs to a process still on its
 * way and is refused; every other state is an outcome and may be reopened.
 *
 * What the previous run left is cleared here rather than at the next claim: a FORCED row
 * is a window about to open, and its message, its model and its signer describe a run that
 * is over. The expected status is the one just read, so a writer who got there first loses
 * this step instead of overwriting them.
 */
async function forceProcessRow(
  userId: number,
  withBooking: boolean,
): Promise<VoidResult<FirstCreationTestRefused>> {
  const testMode = withBooking
    ? FirstCreationTestMode.WITH_BOOKING
    : FirstCreationTestMode.WITHOUT_BOOKING
  const existing = await dbSelectFirstCreationByUserId(userId)
  if (!existing) {
    const inserted = await dbInsertFirstCreation({
      userId,
      status: FirstCreationStatus.FORCED,
      entriesCount: 0,
      contributionIds: [],
      testMode,
    })
    if (!inserted.success) {
      // A second call landed between the read and the insert; that call did the same job.
      return { success: false, error: new FirstCreationTestRefused('RUNNING') }
    }
    return { success: true }
  }
  if (existing.status === FirstCreationStatus.SUBMITTED) {
    return { success: false, error: new FirstCreationTestRefused('RUNNING') }
  }
  const moved = await dbUpdateFirstCreationOutcome(
    existing.id,
    existing.status as FirstCreationStatus,
    {
      status: FirstCreationStatus.FORCED,
      testMode,
      reviewReason: null,
      message: null,
      model: null,
      signerUserId: null,
      contributionIds: [],
      entriesCount: 0,
    },
  )
  if (!moved.success) {
    return { success: false, error: new FirstCreationTestRefused('RUNNING') }
  }
  return { success: true }
}

type ModelStep =
  | { kind: 'answer'; answer: FirstCreationAnswer; model: string | null }
  | { kind: 'failure'; reason: FirstCreationReviewReason; detail: string }

/** Asks the model — or the stub, or nobody — for the lines. Never throws. */
async function askModel(entries: PreparedEntry[], language: string): Promise<ModelStep> {
  const modelEntries = entries.filter((entry) => entry.check === null)
  if (modelEntries.length === 0) {
    // Only ticks: every line is fixed, nothing to ask.
    return { kind: 'answer', answer: { lines: [], suspicious: false, reason: '' }, model: null }
  }
  try {
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
  } catch (error) {
    // The client reads the model settings before it calls; a database hiccup there is a
    // model failure for this process, not an exception out of it.
    logger.error('first creation: model step threw', error)
    return {
      kind: 'failure',
      reason: FirstCreationReviewReason.MODEL_ERROR,
      detail: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Saves the member's entries and runs the whole process (G §3.2). Returns the view the
 * window shows next, or one of the expected failures — all of which are decided BEFORE
 * anything is written.
 */
export async function submitFirstCreation(
  user: DbUser,
  drafts: FirstCreationEntryDraft[],
  clientTimezoneOffset: number,
): Promise<Result<FirstCreationView, FirstCreationError>> {
  // One process per member at a time: a second Save from a second tab is refused, not
  // queued — queued, it would find the row taken and be refused a minute later.
  const mutex = memberLock(user.id)
  if (!(await mutex.tryAcquire())) {
    return { success: false, error: new FirstCreationAlreadyRunning() }
  }
  try {
    // ES-021: the resolver's deny-list already refuses a project account; asked again here
    // so that every caller of this function — not only the one behind FIRST_CREATION —
    // meets the same condition isEligible asks before opening the window.
    if (!user.creationAllowed) {
      return { success: false, error: new FirstCreationNotEligible('PROJECT_ACCOUNT') }
    }
    const signer = await loadSignerFor(user.id)
    if (!signer.success) {
      return { success: false, error: new FirstCreationNotEligible('NO_SIGNER') }
    }
    if (!hasFirstCreationCatalog(user.language)) {
      // The sentence stems are ledger data (they become the memo); a language without
      // them gets no window rather than an English stem glued to its own text.
      return { success: false, error: new FirstCreationNotEligible('NO_CATALOG') }
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

    const claimed = await claimProcessRow(user.id, existing, prepared.value.length)
    if (!claimed.success) {
      return claimed
    }
    const view = await runProcess(
      user,
      signer.value,
      claimed.value,
      prepared.value,
      clientTimezoneOffset,
    )
    return { success: true, value: view }
  } finally {
    await releaseQuietly(mutex, user.id)
  }
}

/**
 * SUBMITTED, before anything else is written — a fresh row, or the FORCED row the function
 * test left, moved on. The unique key on user_id is the arbiter: a duplicate means another
 * process owns this member and is answered as "already running".
 */
async function claimProcessRow(
  userId: number,
  existing: FirstCreationSelect | null,
  entriesCount: number,
): Promise<Result<FirstCreationSelect, FirstCreationAlreadyRunning>> {
  if (existing?.status === FirstCreationStatus.FORCED) {
    const moved = await dbUpdateFirstCreationOutcome(existing.id, FirstCreationStatus.FORCED, {
      status: FirstCreationStatus.SUBMITTED,
      contributionIds: [],
      entriesCount,
      reviewReason: null,
      message: null,
      model: null,
      signerUserId: null,
    })
    if (!moved.success) {
      return { success: false, error: new FirstCreationAlreadyRunning() }
    }
    const reread = await dbSelectFirstCreationByUserId(userId)
    if (!reread) {
      return { success: false, error: new FirstCreationAlreadyRunning() }
    }
    return { success: true, value: reread }
  }
  const inserted = await dbInsertFirstCreation({
    userId,
    status: FirstCreationStatus.SUBMITTED,
    entriesCount,
    contributionIds: [],
  })
  if (!inserted.success) {
    if (inserted.error.name === 'DBDuplicateEntryError') {
      return { success: false, error: new FirstCreationAlreadyRunning() }
    }
    // A plain insert failure on an empty row is not something the member can do anything
    // about, and nothing has been written yet: it may crash.
    throw inserted.error
  }
  return { success: true, value: inserted.value }
}

/**
 * Everything after the claim. Never throws: the row exists, so every failure has a place
 * to land (IN_REVIEW with a reason), and the answer is always the view of what happened.
 */
async function runProcess(
  user: DbUser,
  signer: Signer,
  row: FirstCreationSelect,
  entries: PreparedEntry[],
  clientTimezoneOffset: number,
): Promise<FirstCreationView> {
  // Filing writes into `filed` as it goes, so a throw halfway leaves the ids of what
  // exists rather than nothing.
  const filed: DbContribution[] = []
  try {
    await fileContributions(user, entries, clientTimezoneOffset, filed)
    await dbUpdateFirstCreationOutcome(row.id, FirstCreationStatus.SUBMITTED, {
      status: FirstCreationStatus.SUBMITTED,
      contributionIds: filed.map((contribution) => contribution.id),
    })
  } catch (error) {
    logger.error(`first creation ${row.id}: filing failed after ${filed.length} entries`, error)
    return settleInReview({
      user,
      signer,
      row,
      contributionIds: filed.map((contribution) => contribution.id),
      reason: FirstCreationReviewReason.PROCESS_ERROR,
      internalReason: null,
      model: null,
      clientTimezoneOffset,
    })
  }
  const contributionIds = filed.map((contribution) => contribution.id)
  const step = await askModel(entries, user.language)
  if (step.kind === 'failure') {
    return settleInReview({
      user,
      signer,
      row,
      contributionIds,
      reason: step.reason,
      internalReason: null,
      model: null,
      clientTimezoneOffset,
    })
  }
  if (step.answer.suspicious) {
    return settleInReview({
      user,
      signer,
      row,
      contributionIds,
      reason: FirstCreationReviewReason.SUSPICION,
      internalReason: step.answer.reason || 'no reason given',
      model: step.model,
      clientTimezoneOffset,
    })
  }
  return settleAsThanked(user, signer, row, filed, entries, step, clientTimezoneOffset)
}

/**
 * Outcomes A and B: message, one comment on the first contribution, confirms (A only),
 * DONE or DONE_UNBOOKED. A throw anywhere in here is a process failure and lands in
 * IN_REVIEW — with the note on the first contribution that is still open, because the
 * ones already booked no longer take a moderator message.
 */
async function settleAsThanked(
  user: DbUser,
  signer: Signer,
  row: FirstCreationSelect,
  contributions: DbContribution[],
  entries: PreparedEntry[],
  step: Extract<ModelStep, { kind: 'answer' }>,
  clientTimezoneOffset: number,
): Promise<FirstCreationView> {
  const first = contributions[0]
  const contributionIds = contributions.map((contribution) => contribution.id)
  try {
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
    const moved = await dbUpdateFirstCreationOutcome(row.id, FirstCreationStatus.SUBMITTED, {
      status,
      message,
      model: step.model,
      signerUserId: signer.user.id,
    })
    if (!moved.success) {
      // The row was moved by somebody else while this process ran; the booking stands,
      // the row says what the other writer said. Loud in the log, no second note.
      logger.error(`first creation ${row.id}: row left SUBMITTED while the process ran`)
    }
    // The outcome is committed from here on. An event that fails is logged, never
    // answered with the review fallback - that would mail the member a second,
    // contradicting note over a thanked and booked bundle.
    try {
      if (withoutBooking) {
        await EVENT_FIRST_CREATION_UNBOOKED(user, signer.user, first)
      } else {
        await EVENT_FIRST_CREATION_DONE(user, signer.user, first)
      }
    } catch (eventError) {
      logger.error(`first creation ${row.id}: outcome event failed`, eventError)
    }
  } catch (error) {
    logger.error(`first creation ${row.id}: thanking failed, handing to review`, error)
    return settleInReview({
      user,
      signer,
      row,
      contributionIds,
      reason: FirstCreationReviewReason.PROCESS_ERROR,
      internalReason: null,
      model: step.model,
      clientTimezoneOffset,
    })
  }
  return readFirstCreationStatus(user, clientTimezoneOffset)
}

interface ReviewSettlement {
  user: DbUser
  signer: Signer | null
  row: FirstCreationSelect
  contributionIds: number[]
  reason: FirstCreationReviewReason
  internalReason: string | null
  model: string | null
  clientTimezoneOffset: number
}

/**
 * Outcome C, and the landing place of every failure: the neutral note to the member on
 * the first contribution that is still open, the internal note for the moderation when
 * Crea raised its hand, IN_REVIEW with the reason, one event. Runs exactly once per
 * process and never throws: each step is guarded on its own, so a failing mail or event
 * cannot repeat the note.
 */
async function settleInReview(settlement: ReviewSettlement): Promise<FirstCreationView> {
  const { user, signer, row, contributionIds, reason, internalReason, model } = settlement
  const message = composeFirstCreationReviewMessage(user.language)
  const entries = await dbSelectFirstCreationEntriesByIds(contributionIds)
  const target = entries.find((entry) => entry.confirmedAt === null && entry.deletedAt === null)
  if (signer && target) {
    try {
      await signerComments(
        signer,
        target.id,
        message,
        ContributionMessageType.DIALOG,
        settlement.clientTimezoneOffset,
      )
    } catch (error) {
      logger.error(`first creation ${row.id}: review note failed`, error)
    }
    if (internalReason !== null) {
      try {
        await signerComments(
          signer,
          target.id,
          composeFirstCreationInternalNote(internalReason),
          ContributionMessageType.MODERATOR,
          settlement.clientTimezoneOffset,
        )
      } catch (error) {
        logger.error(`first creation ${row.id}: internal note failed`, error)
      }
    }
  } else {
    logger.warn(
      `first creation ${row.id}: review without a thread note (signer ${signer ? 'yes' : 'no'}, open contribution ${target ? 'yes' : 'no'})`,
    )
  }
  const moved = await dbUpdateFirstCreationOutcome(row.id, FirstCreationStatus.SUBMITTED, {
    status: FirstCreationStatus.IN_REVIEW,
    reviewReason: reason,
    message,
    model,
    signerUserId: signer?.user.id ?? null,
    contributionIds,
  })
  if (!moved.success) {
    logger.error(`first creation ${row.id}: could not move the row to IN_REVIEW`)
  }
  try {
    const first = contributionIds[0]
    if (signer && first !== undefined) {
      await EVENT_FIRST_CREATION_REVIEW(user, signer.user, { id: first } as DbContribution)
    }
  } catch (error) {
    logger.error(`first creation ${row.id}: review event failed`, error)
  }
  return readFirstCreationStatus(user, settlement.clientTimezoneOffset)
}
