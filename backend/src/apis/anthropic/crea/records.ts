// AI-GENERATED — not an architecture reference
import { type CreaRecordInsert } from 'database'
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
 * in the resolver. `moderator_final`/`comment` start null (filled when the
 * moderator later decides, DO-4).
 */
export function buildCreaRecordRows(
  evaluation: CreaEvaluation,
  meta: CreaRecordMeta,
): Omit<CreaRecordInsert, 'recordUuid'>[] {
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
