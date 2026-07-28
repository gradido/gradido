import { CreaRecord } from 'database'
import { v4 as uuidv4 } from 'uuid'
import type { CreaContributionInput } from '@/graphql/input/CreaContributionInput'
import type { CreaEvaluation } from '@/graphql/model/CreaEvaluation'
import { CREA_BEHAVIOR_VERSION, CREA_RULESET_VERSION, CREA_TAXONOMY_VERSION } from './ruleset'

// Contribution-level context for a batch of records (E-007 / E-010). Pseudonymous:
// community readable, person a pseudonym, no name. Supplied by the caller (the
// admin UI in DO-4); the thin slice may omit it, in which case nothing persists.
export interface CreaRecordMeta {
  contributionRef: string
  communityUuid?: string | null
  personPseudonym?: string | null
  rawText?: string | null
  model?: string | null
}

/**
 * Maps a Crea evaluation to one flat record per activity (decisions
 * E-004/006/007/010/011). Pure: no I/O, no uuid/date generation — those happen
 * in persistCreaRecords. `moderator_final`/`comment` start null (filled when the
 * moderator later decides, DO-4).
 */
export function buildCreaRecordRows(
  evaluation: CreaEvaluation,
  meta: CreaRecordMeta,
): Array<Record<string, unknown>> {
  return evaluation.activities.map((activity) => ({
    contributionRef: meta.contributionRef,
    communityUuid: meta.communityUuid ?? null,
    personPseudonym: meta.personPseudonym ?? null,
    activity: activity.activity,
    categoryKey: activity.categoryKey,
    outputType: activity.outputType,
    hours: activity.hours,
    hoursEstimated: activity.hoursEstimated,
    creaVerdict: activity.verdict,
    confidence: activity.confidence,
    appliedRule: evaluation.appliedRule ?? null,
    discrepancy: evaluation.discrepancy,
    overallVerdict: evaluation.overallVerdict,
    moderatorFinal: null,
    moderatorComment: null,
    rawText: meta.rawText ?? null,
    taxonomyVersion: CREA_TAXONOMY_VERSION,
    rulesetVersion: CREA_RULESET_VERSION,
    behaviorVersion: CREA_BEHAVIOR_VERSION,
    model: meta.model ?? null,
  }))
}

/** Builds the meta context from the resolver input plus the configured model. */
export function metaFromInput(input: CreaContributionInput, model: string): CreaRecordMeta {
  return {
    contributionRef: input.contributionRef as string,
    communityUuid: input.communityUuid ?? null,
    personPseudonym: input.personPseudonym ?? null,
    rawText: input.text,
    model,
  }
}

/**
 * Persists the evaluation as crea_records rows (one per activity). Each row gets
 * a fresh record_uuid here so buildCreaRecordRows stays pure. Called only when
 * the caller supplied a contributionRef (the thin slice skips persistence).
 */
export async function persistCreaRecords(
  evaluation: CreaEvaluation,
  meta: CreaRecordMeta,
): Promise<void> {
  for (const row of buildCreaRecordRows(evaluation, meta)) {
    const record = CreaRecord.create()
    Object.assign(record, row, { recordUuid: uuidv4() })
    await CreaRecord.save(record)
  }
}
