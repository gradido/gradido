// AI-GENERATED — not an architecture reference
import {
  Contribution as DbContribution,
  User as DbUser,
  dbCountUserTypedContributionsByUserId,
  FirstCreationSelect,
  FirstCreationStatus,
} from 'database'
import { GradidoUnit, Result, VoidResult } from 'shared'
import {
  buildFirstCreationMemo,
  FIRST_CREATION_MAX_ENTRIES,
  FIRST_CREATION_TOTAL,
  FirstCreationCheckKey,
  FirstCreationEntryDraft,
  isCheckKey,
  splitFirstCreationAmount,
} from '@/data/FirstCreation.logic'
import { createUserContribution } from '@/graphql/resolver/util/createUserContribution'
import { getUserCreation, validateContribution } from '@/graphql/resolver/util/creations'
import {
  FirstCreationEntriesInvalid,
  FirstCreationNotEligible,
  FirstCreationQuotaExceeded,
} from './FirstCreation.errors'

// The member (DCI role "submitter"): may they start, what do their entries become, and
// the filing of the contributions in their own name — ordinary USER contributions through
// the same core the "create contribution" button uses (ES-002).

/**
 * ES-011 in one place: no process yet (or one the function test reopened), and no
 * contribution the member ever filed themselves — deleted ones included, because a
 * removed manual creation was still a manual creation. The signer question is not asked
 * here; it is the signer role's.
 */
export async function checkEligibility(
  userId: number,
  row: FirstCreationSelect | null,
): Promise<VoidResult<FirstCreationNotEligible>> {
  if (row && row.status !== FirstCreationStatus.FORCED) {
    return { success: false, error: new FirstCreationNotEligible('ALREADY_STARTED') }
  }
  if (row?.status === FirstCreationStatus.FORCED) {
    // The function test opened the window on purpose for an account that has created.
    return { success: true }
  }
  if ((await dbCountUserTypedContributionsByUserId(userId)) > 0) {
    return { success: false, error: new FirstCreationNotEligible('HAS_MANUAL_CONTRIBUTION') }
  }
  return { success: true }
}

export interface PreparedEntry {
  memo: string
  amount: GradidoUnit
  /** The ticked sentence this entry is, or null for a completed catalog sentence. */
  check: FirstCreationCheckKey | null
}

/**
 * Every entry becomes a finished sentence in the member's language and gets its share of
 * the 100 Gradido (remainder on the first). One tick at most per kind: ticking "retiree"
 * twice is two tries of the same box, not two entries.
 */
export function prepareEntries(
  drafts: FirstCreationEntryDraft[],
  language: string,
): Result<PreparedEntry[], FirstCreationEntriesInvalid> {
  if (drafts.length === 0) {
    return { success: false, error: new FirstCreationEntriesInvalid('NO_ENTRIES') }
  }
  if (drafts.length > FIRST_CREATION_MAX_ENTRIES) {
    return { success: false, error: new FirstCreationEntriesInvalid('TOO_MANY') }
  }
  const checksSeen = new Set<string>()
  const memos: { memo: string; check: FirstCreationCheckKey | null }[] = []
  for (const [index, draft] of drafts.entries()) {
    const check = isCheckKey(draft.catalogKey) ? draft.catalogKey : null
    if (check) {
      if (checksSeen.has(check)) {
        return { success: false, error: new FirstCreationEntriesInvalid('DUPLICATE_CHECK') }
      }
      checksSeen.add(check)
    }
    const memo = buildFirstCreationMemo(draft, language, index)
    if (!memo.success) {
      return { success: false, error: new FirstCreationEntriesInvalid(memo.error) }
    }
    memos.push({ memo: memo.value, check })
  }
  const amounts = splitFirstCreationAmount(memos.length)
  return {
    success: true,
    value: memos.map((entry, index) => ({ ...entry, amount: amounts[index] })),
  }
}

/**
 * Whether 100 Gradido are still free this month, asked ONCE for the whole bundle before
 * anything is filed (G §9.12): the per-contribution check inside createUserContribution
 * would otherwise let entries 1-3 in and refuse entry 4.
 */
export async function checkQuota(
  userId: number,
  clientTimezoneOffset: number,
): Promise<VoidResult<FirstCreationQuotaExceeded>> {
  const creations = await getUserCreation(userId, clientTimezoneOffset)
  try {
    validateContribution(creations, FIRST_CREATION_TOTAL, new Date(), clientTimezoneOffset)
    return { success: true }
  } catch {
    return { success: false, error: new FirstCreationQuotaExceeded() }
  }
}

/**
 * Files one USER contribution per entry, dated now (ES-010: the current month), through
 * the same core as the wallet's own form. Each one fires CONTRIBUTION_CREATE and counts
 * against the month like any other.
 */
export async function fileContributions(
  user: DbUser,
  entries: PreparedEntry[],
  clientTimezoneOffset: number,
): Promise<DbContribution[]> {
  const contributions: DbContribution[] = []
  const contributionDate = new Date().toISOString()
  for (const entry of entries) {
    contributions.push(
      await createUserContribution(
        user,
        { amount: entry.amount, memo: entry.memo, contributionDate, creationGroups: [] },
        clientTimezoneOffset,
      ),
    )
  }
  return contributions
}
