// AI-GENERATED — not an architecture reference
import { ContributionMessageType } from '@enum/ContributionMessageType'
import {
  AppDatabase,
  Contribution as DbContribution,
  User as DbUser,
  dbFindLatestEventForAffectedUser,
  dbFindReferrerAlias,
  dbGetFirstCreationSignerUserId,
  dbInsertEvent,
  dbSelectFirstCreationEntriesByUserId,
  dbSelectFirstCreationMessage,
  dbUnmarkFirstCreationContributions,
  dbUpdateUserFirstCreationStatus,
  EventType,
  FirstCreationEntryRow,
  FirstCreationStatus,
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
  composeFirstCreationCheckConflictNote,
  composeFirstCreationInternalNote,
  composeFirstCreationMessage,
  composeFirstCreationReviewMessage,
  conflictingChecks,
  FirstCreationEntryDraft,
  hasFirstCreationCatalog,
} from '@/data/FirstCreation.logic'
import { FirstCreationReviewReason } from '@/data/FirstCreationReviewReason.enum'
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
  /**
   * Whom to offer thanks to once the bundle is thanked (ZE-007): the member who brought this
   * one here, by alias, or null. Asked only for a settled process, which is the moment the
   * window shows the button.
   */
  referrerAlias: string | null
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
 * ⛔ Not atomic. The contributions are written through TypeORM, the state through Drizzle,
 * and one transaction does not cover both (AGENTS.md). So this is a state machine, and its
 * ORDER is the safety: the state is claimed FIRST (the conditional update on
 * `users.first_creation_status` is the arbiter, the Redis lock only keeps two tabs from
 * racing to the same refusal), then the contributions are filed with their mark, then the
 * outcome moves the state on. From the claim onwards nothing throws out of the process:
 * whatever breaks lands in IN_REVIEW with a reason, and a status read heals a process that
 * died — but only when nobody holds that member's lock any more.
 *
 * The state lives on the user row, and the `user` handed in is the row as the request
 * loaded it. Every step that moves the state writes the object too (`moveStatus`), so a
 * view read at the end of the process describes what the process did, not what it found.
 */

/**
 * ES-011 plus the signer plus the catalog plus the account kind: the halves of "may the
 * window open". A project account (ES-021) never sees it — the deny-list in isAuthorized
 * refuses the status query outright, and this is the same answer one layer in, for the
 * paths that reach the interaction without the resolver.
 */
async function isEligible(user: DbUser): Promise<boolean> {
  if (!user.creationAllowed) {
    return false
  }
  // Cheapest checks first: a settled state needs no signer lookup, and a member who has not
  // started costs one count exactly once (checkEligibility).
  if (!(await checkEligibility(user)).success) {
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

/**
 * One step of the state machine: the row, and on success the object that mirrors it. The
 * expected state is the one just read off the object, so a writer who got there first
 * wins and this step reports it instead of overwriting them.
 */
async function moveStatus(user: DbUser, next: FirstCreationStatus): Promise<VoidResult<Error>> {
  const expected = (user.firstCreationStatus as FirstCreationStatus | null) ?? null
  const moved = await dbUpdateUserFirstCreationStatus(user.id, expected, next)
  if (moved.success) {
    user.firstCreationStatus = next
  }
  return moved
}

const isForced = (status: string | null): boolean =>
  status === FirstCreationStatus.FORCED || status === FirstCreationStatus.FORCED_UNBOOKED

const isSettled = (status: string | null): boolean =>
  status === FirstCreationStatus.DONE ||
  status === FirstCreationStatus.DONE_UNBOOKED ||
  status === FirstCreationStatus.IN_REVIEW

const entryView = (entry: FirstCreationEntryRow): FirstCreationEntryView => ({
  memo: entry.memo,
  confirmed: entry.confirmedAt !== null,
  status: entry.deletedAt ? 'DELETED' : entry.status,
})

/**
 * Reads the state; heals a SUBMITTED process that died (G §3.4). The state comes off the
 * user row the request loaded, so a member whose process is settled or who has found the
 * regular path costs the entries and the skip event and nothing else.
 */
export async function readFirstCreationStatus(
  user: DbUser,
  clientTimezoneOffset: number,
): Promise<FirstCreationView> {
  if (user.firstCreationStatus === FirstCreationStatus.SUBMITTED) {
    await healSubmitted(user, clientTimezoneOffset)
  }
  // Asked before the state is read: a member who has created on their own is written down
  // as HAS_CREATED on the way, and the state below says so.
  const eligible = await isEligible(user)
  const status = (user.firstCreationStatus as FirstCreationStatus | null) ?? null
  // A FORCED state is a window about to reopen: what it shows belongs to the run that has
  // not happened yet, not to the one before. Nothing to show either for a member who has
  // not started or who created on their own.
  const showsBundle =
    status !== null && !isForced(status) && status !== FirstCreationStatus.HAS_CREATED
  const entries = showsBundle
    ? (await dbSelectFirstCreationEntriesByUserId(user.id)).map(entryView)
    : []
  return {
    state: status ?? 'NONE',
    eligible,
    message: showsBundle ? await messageOf(user, status) : null,
    entries,
    skippedBefore:
      (await dbFindLatestEventForAffectedUser(EventType.FIRST_CREATION_SKIP, user.id)) !== null,
    referrerAlias: isSettled(status) ? await dbFindReferrerAlias(user.id) : null,
    ...(await functionTestView(user, clientTimezoneOffset)),
  }
}

/**
 * The one message the window shows (ES-009): the thanks, read back off the thread the
 * signer wrote it to, or the review notice, which is the same sentence for everybody in the
 * member's language and is composed rather than stored. Nothing while the process runs.
 */
async function messageOf(user: DbUser, status: FirstCreationStatus): Promise<string | null> {
  if (status === FirstCreationStatus.IN_REVIEW) {
    return composeFirstCreationReviewMessage(user.language)
  }
  if (status === FirstCreationStatus.DONE || status === FirstCreationStatus.DONE_UNBOOKED) {
    return dbSelectFirstCreationMessage(user.id)
  }
  return null
}

/**
 * The three fields the function-test area reads (ES-014). They answer TOGETHER or not at
 * all: the switch is a plain server setting and everybody may know it, but the count and
 * the signer question cost two more reads apiece, so they are asked only for an account
 * that actually holds the key — which is every reader of that area and nobody else.
 *
 * The role is read off the user's own `userRole`, the same relation isAuthorized loads
 * onto the context user (`relations: ['emailContact', 'userRole']`) and the same mapping
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
  const mayRunFunctionTests = roleByName(user.userRole?.role).hasRight(RIGHTS.FUNCTION_TESTS)
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
 * A SUBMITTED process is one in flight — or one that died. Alive is what the lock says:
 * while the member's lock is held, the process is left alone. With the lock free, all
 * contributions confirmed means the confirm ran and only the last step was lost: DONE.
 * Contributions still open means nobody will come back for them: the review note goes
 * onto the thread and the process to IN_REVIEW.
 */
async function healSubmitted(user: DbUser, clientTimezoneOffset: number): Promise<void> {
  const mutex = memberLock(user.id)
  if (!(await mutex.tryAcquire())) {
    // Somebody is still working on it.
    return
  }
  try {
    const entries = await dbSelectFirstCreationEntriesByUserId(user.id)
    const allConfirmed = entries.length > 0 && entries.every((entry) => entry.confirmedAt !== null)
    if (allConfirmed) {
      const moved = await moveStatus(user, FirstCreationStatus.DONE)
      if (!moved.success) {
        // Somebody else moved it first; what they wrote stands, and the next read shows it.
        return
      }
      // Done when its last contribution was confirmed, as the process would have noted it then.
      const doneAt = new Date(
        Math.max(...entries.map((entry) => entry.confirmedAt?.getTime() ?? 0)),
      )
      await noteHealedDone(user, entries, doneAt)
      return
    }
    logger.warn(`first creation of user ${user.id} stale in SUBMITTED, handing to review`)
    const signer = await loadSignerFor(user.id)
    await settleInReview({
      user,
      signer: signer.success ? signer.value : null,
      reason: FirstCreationReviewReason.PROCESS_ERROR,
      internalNote: null,
      clientTimezoneOffset,
    })
  } finally {
    await releaseQuietly(mutex, user.id)
  }
}

/**
 * The outcome event of a bundle that was booked and thanked while its process died before the
 * state moved on: the line the process writes itself (FIRST_CREATION_DONE -- the member affected,
 * the signer acting, the first contribution), so that the healed bundle counts as done on the
 * figures page -- dated `doneAt`, when it was done, not when the next status read found it. A
 * running process does not remember its signer, so the one configured now is named; without one
 * there is nobody to name and no line, as settleInReview writes none. A line that fails is
 * logged, and the healed state stands.
 */
async function noteHealedDone(
  user: DbUser,
  entries: FirstCreationEntryRow[],
  doneAt: Date,
): Promise<void> {
  try {
    const signer = await loadSignerFor(user.id)
    const first = entries[0]
    if (!signer.success || first === undefined) {
      logger.warn(
        `first creation of user ${user.id}: healed to DONE with no signer to name, no event`,
      )
      return
    }
    await dbInsertEvent({
      type: EventType.FIRST_CREATION_DONE,
      affectedUserId: user.id,
      actingUserId: signer.value.user.id,
      involvedContributionId: first.id,
      createdAt: doneAt,
    })
  } catch (error) {
    logger.error(`first creation of user ${user.id}: outcome event of the healing failed`, error)
  }
}

/**
 * The member closed the window with nothing entered (ES-011): an event, no state — and only
 * when the window was open, so the skipper count counts skippers.
 */
export async function skipFirstCreation(user: DbUser): Promise<void> {
  if (await isEligible(user)) {
    await dbInsertEvent({
      type: EventType.FIRST_CREATION_SKIP,
      affectedUserId: user.id,
      actingUserId: user.id,
    })
  }
}

/**
 * ES-014: reopen this admin's OWN window on an account that has long since created, and
 * say which of the two variants the run that follows is (ES-016). Everything after this is
 * the ordinary process — the state is simply put to FORCED (or FORCED_UNBOOKED), which is
 * the one state checkEligibility lets past a member who has already created.
 *
 * ⛔ Refused BEFORE the state is written wherever the run could not finish anyway — see the
 * signer check below. The wallet says the same thing in front of the button
 * (isFirstCreationSigner); this is what holds against a bare API call.
 *
 * The member's own lock is taken for the same reason submitFirstCreation takes it: a run
 * in flight must not have its state pulled back under it.
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
  // is not on the deny-list, so this is the one door in — and a forced state alone opens no
  // window (isEligible asks the account kind first). Refused here, where it can be said.
  if (!user.creationAllowed) {
    return { success: false, error: new FirstCreationTestRefused('PROJECT_ACCOUNT') }
  }
  // ⛔ Both halves, and for one reason: a forced state alone does not open a window.
  // isEligible asks for a signer as well, so pressing the button without one — or as the
  // signer, for whom loadSignerFor answers IS_MEMBER — would write the state, send the admin
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
    const forced = await forceProcess(user, withBooking)
    if (!forced.success) {
      return forced
    }
  } finally {
    await releaseQuietly(mutex, user.id)
  }
  // The state is the outcome and it is written; the event is its trace. A failing trace is
  // logged, never turned into an answer that says the press did not work while the window
  // is in fact armed — the same rule the outcome events downstream follow.
  try {
    await dbInsertEvent({
      type: EventType.FIRST_CREATION_TEST,
      affectedUserId: user.id,
      actingUserId: user.id,
    })
  } catch (error) {
    logger.error(`first creation test: event failed for user ${user.id}`, error)
  }
  return { success: true }
}

/**
 * The state, put to FORCED. A SUBMITTED process belongs to a run still on its way and is
 * refused; every other state is an outcome and may be reopened.
 *
 * What the previous run left is cleared here rather than at the next claim: a FORCED state
 * is a window about to open, and the bundle it shows belongs to the run that is over. The
 * expected state is the one just read, so a writer who got there first wins this step.
 */
async function forceProcess(
  user: DbUser,
  withBooking: boolean,
): Promise<VoidResult<FirstCreationTestRefused>> {
  if (user.firstCreationStatus === FirstCreationStatus.SUBMITTED) {
    return { success: false, error: new FirstCreationTestRefused('RUNNING') }
  }
  const moved = await moveStatus(
    user,
    withBooking ? FirstCreationStatus.FORCED : FirstCreationStatus.FORCED_UNBOOKED,
  )
  if (!moved.success) {
    return { success: false, error: new FirstCreationTestRefused('RUNNING') }
  }
  await dbUnmarkFirstCreationContributions(user.id)
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
  // queued — queued, it would find the state taken and be refused a minute later.
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
    const eligible = await checkEligibility(user)
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

    // ES-016: the mode of a function-test run is in the armed state, and it is read before
    // the claim takes it away. A real run books.
    const withoutBooking = user.firstCreationStatus === FirstCreationStatus.FORCED_UNBOOKED
    const claimed = await claimProcess(user)
    if (!claimed.success) {
      return claimed
    }
    const view = await runProcess(
      user,
      signer.value,
      withoutBooking,
      prepared.value,
      clientTimezoneOffset,
    )
    return { success: true, value: view }
  } finally {
    await releaseQuietly(mutex, user.id)
  }
}

/**
 * SUBMITTED, before anything else is written — from nothing, or from the FORCED state the
 * function test left. The conditional update is the arbiter: a state that has moved in the
 * meantime means another process owns this member and is answered as "already running".
 */
async function claimProcess(user: DbUser): Promise<VoidResult<FirstCreationAlreadyRunning>> {
  const moved = await moveStatus(user, FirstCreationStatus.SUBMITTED)
  if (!moved.success) {
    return { success: false, error: new FirstCreationAlreadyRunning() }
  }
  return { success: true }
}

/**
 * Everything after the claim. Never throws: the state is claimed, so every failure has a
 * place to land (IN_REVIEW with a reason), and the answer is always the view of what
 * happened.
 */
async function runProcess(
  user: DbUser,
  signer: Signer,
  withoutBooking: boolean,
  entries: PreparedEntry[],
  clientTimezoneOffset: number,
): Promise<FirstCreationView> {
  // Filing writes into `filed` as it goes, so a throw halfway leaves the entries that exist
  // rather than nothing — each of them marked as it was written.
  const filed: DbContribution[] = []
  try {
    await fileContributions(user, entries, clientTimezoneOffset, filed)
  } catch (error) {
    logger.error(
      `first creation of user ${user.id}: filing failed after ${filed.length} entries`,
      error,
    )
    return settleInReview({
      user,
      signer,
      reason: FirstCreationReviewReason.PROCESS_ERROR,
      internalNote: null,
      clientTimezoneOffset,
    })
  }

  /**
   * ⭐ Ticks that contradict each other go to a human — they are not refused (Bernd, 07.09.).
   *
   * ⛔ The obvious place would have been `prepareEntries`, next to the `DUPLICATE_CHECK` that
   * already turns the same tick twice away. That would have been wrong: a refusal there ends
   * at the member's screen with "das hat nicht geklappt", and the case Bernd wants a
   * moderator to SEE would never reach one. The wallet keeps both ticks from being set at
   * all; this is for everything that is not our wallet.
   *
   * Asked here rather than before the filing, so the bundle exists for the moderation to
   * look at and the note has an open thread to land on — and before the model, because the
   * decision is already made and nobody should wait half a minute for an answer that will
   * not be used.
   */
  const conflicting = conflictingChecks(entries.map((entry) => entry.check))
  if (conflicting.length > 0) {
    return settleInReview({
      user,
      signer,
      reason: FirstCreationReviewReason.CHECK_CONFLICT,
      internalNote: composeFirstCreationCheckConflictNote(conflicting),
      clientTimezoneOffset,
    })
  }

  const step = await askModel(entries, user.language)
  if (step.kind === 'failure') {
    logger.warn(`first creation of user ${user.id}: ${step.reason}: ${step.detail}`)
    return settleInReview({
      user,
      signer,
      reason: step.reason,
      internalNote: null,
      clientTimezoneOffset,
    })
  }
  if (step.answer.suspicious) {
    return settleInReview({
      user,
      signer,
      reason: FirstCreationReviewReason.SUSPICION,
      internalNote: composeFirstCreationInternalNote(step.answer.reason || 'no reason given'),
      internalNoteAiModel: step.model,
      clientTimezoneOffset,
    })
  }
  return settleAsThanked(user, signer, withoutBooking, filed, entries, step, clientTimezoneOffset)
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
  withoutBooking: boolean,
  contributions: DbContribution[],
  entries: PreparedEntry[],
  step: Extract<ModelStep, { kind: 'answer' }>,
  clientTimezoneOffset: number,
): Promise<FirstCreationView> {
  const first = contributions[0]
  try {
    const message = composeFirstCreationMessage({
      firstName: user.firstName,
      language: user.language,
      lines: step.answer.lines,
      checks: entries.flatMap((entry) => (entry.check ? [entry.check] : [])),
    })
    // ⛔ The one place in the house where the mail must NOT offer a reply. The comment
    // leaves the contribution open — and the loop below shuts it seconds later, long
    // before the member opens the mail. Answering "directly at your contribution" is true
    // when it is sent and false when it is read (Bernd, 06.09.).
    //
    // ⚠️ Only outcome A. Without the booking (ES-016), and on every path through
    // settleInReview, the contributions stay open on purpose and answering is exactly what
    // they are for, so those keep the button.
    //
    // ⚠️ And the inversion this order carries, named rather than left for somebody to find:
    // if a confirm below FAILS, the catch hands the bundle to settleInReview, the
    // contribution stays open, and the member is holding a mail that says it is closed.
    // They are corrected within seconds — the review note that follows is answerable and
    // says so. Two ways out were weighed and both cost more than the case is worth:
    // confirming before commenting is impossible (a confirmed contribution takes no
    // moderator message at all, which is why this order exists), and lifting the mail out
    // of addModeratorMessageAs would mean a second copy of a nine-field call with two
    // derived values in it — a copied block, in the one path every moderator uses.
    //
    // The message is written to the thread and nowhere else: the window reads it back from
    // there (dbSelectFirstCreationMessage) -- with the model that wrote its lines on the row.
    await signerComments(
      signer,
      first.id,
      message,
      ContributionMessageType.DIALOG,
      clientTimezoneOffset,
      withoutBooking,
      step.model,
    )
    if (!withoutBooking) {
      for (const contribution of contributions) {
        await signerConfirms(signer, contribution.id, clientTimezoneOffset)
      }
    }
    const status = withoutBooking ? FirstCreationStatus.DONE_UNBOOKED : FirstCreationStatus.DONE
    const moved = await moveStatus(user, status)
    if (!moved.success) {
      // The state was moved by somebody else while this process ran; the booking stands,
      // the state says what the other writer said. Loud in the log, no second note.
      logger.error(`first creation of user ${user.id}: state left SUBMITTED while the process ran`)
    }
    logger.info(`first creation of user ${user.id}: ${status}, lines by ${step.model ?? 'nobody'}`)
    // The outcome is committed from here on. An event that fails is logged, never
    // answered with the review fallback - that would mail the member a second,
    // contradicting note over a thanked and booked bundle.
    try {
      if (withoutBooking) {
        await dbInsertEvent({
          type: EventType.FIRST_CREATION_UNBOOKED,
          affectedUserId: user.id,
          actingUserId: signer.user.id,
          involvedContributionId: first.id,
        })
      } else {
        await dbInsertEvent({
          type: EventType.FIRST_CREATION_DONE,
          affectedUserId: user.id,
          actingUserId: signer.user.id,
          involvedContributionId: first.id,
        })
      }
    } catch (eventError) {
      logger.error(`first creation of user ${user.id}: outcome event failed`, eventError)
    }
  } catch (error) {
    logger.error(`first creation of user ${user.id}: thanking failed, handing to review`, error)
    return settleInReview({
      user,
      signer,
      reason: FirstCreationReviewReason.PROCESS_ERROR,
      internalNote: null,
      clientTimezoneOffset,
    })
  }
  return readFirstCreationStatus(user, clientTimezoneOffset)
}

interface ReviewSettlement {
  user: DbUser
  signer: Signer | null
  /** Why a human looks first -- for the log, where the review quota is measured against its causes. */
  reason: FirstCreationReviewReason
  /**
   * The note for the moderation, ready to post, or null where there is nothing to say.
   *
   * ⛔ The finished text, not a raw reason: the wording belongs to the outcome, not to this
   * function. Crea's note opens with "Crea hat ... angehalten", and a stop the rules made
   * needs a different sentence -- composing it here would have put every stop on Crea.
   */
  internalNote: string | null
  /** The model whose words the internal note carries: Crea's reason for stopping. Absent where a rule stopped. */
  internalNoteAiModel?: string | null
  clientTimezoneOffset: number
}

/**
 * Outcome C, and the landing place of every failure: the neutral note to the member on
 * the first contribution that is still open, the internal note for the moderation when
 * Crea raised its hand, IN_REVIEW, one event. Runs exactly once per process and never
 * throws: each step is guarded on its own, so a failing mail or event cannot repeat the
 * note. The bundle is read off its mark: whatever the filing managed to write is what the
 * moderation gets to see.
 */
async function settleInReview(settlement: ReviewSettlement): Promise<FirstCreationView> {
  const { user, signer, reason, internalNote } = settlement
  logger.warn(`first creation of user ${user.id}: handed to review, ${reason}`)
  const message = composeFirstCreationReviewMessage(user.language)
  const entries = await dbSelectFirstCreationEntriesByUserId(user.id)
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
      logger.error(`first creation of user ${user.id}: review note failed`, error)
    }
    if (internalNote !== null) {
      try {
        await signerComments(
          signer,
          target.id,
          internalNote,
          ContributionMessageType.MODERATOR,
          settlement.clientTimezoneOffset,
          true,
          settlement.internalNoteAiModel ?? null,
        )
      } catch (error) {
        logger.error(`first creation of user ${user.id}: internal note failed`, error)
      }
    }
  } else {
    logger.warn(
      `first creation of user ${user.id}: review without a thread note (signer ${signer ? 'yes' : 'no'}, open contribution ${target ? 'yes' : 'no'})`,
    )
  }
  const moved = await moveStatus(user, FirstCreationStatus.IN_REVIEW)
  if (!moved.success) {
    logger.error(`first creation of user ${user.id}: could not move the state to IN_REVIEW`)
  }
  try {
    const first = entries[0]
    if (signer && first !== undefined) {
      await dbInsertEvent({
        type: EventType.FIRST_CREATION_REVIEW,
        affectedUserId: user.id,
        actingUserId: signer.user.id,
        involvedContributionId: first.id,
      })
    }
  } catch (error) {
    logger.error(`first creation of user ${user.id}: review event failed`, error)
  }
  return readFirstCreationStatus(user, settlement.clientTimezoneOffset)
}
