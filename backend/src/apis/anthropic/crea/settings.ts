// AI-GENERATED — not an architecture reference
import { dbSelectCreaSettings, dbUpsertCreaModerationSettings } from 'database'
import { CONFIG } from '@/config'

// Global Crea runtime settings (DO-4): the Claude model + effort an admin picks in
// the admin UI, stored as a single-row singleton (crea_settings, id = 1) and applied
// for all moderators. Read on every Crea call so a change takes effect at once; the
// env ANTHROPIC_MODEL is the fallback when no model is stored.

export const CREA_EFFORTS = ['disabled', 'low', 'medium', 'high', 'xhigh', 'max'] as const
export type CreaEffort = (typeof CREA_EFFORTS)[number]

function normalizeEffort(value: string | null | undefined): CreaEffort {
  return CREA_EFFORTS.includes(value as CreaEffort) ? (value as CreaEffort) : 'disabled'
}

export interface StoredCreaSettings {
  model: string | null
  effort: CreaEffort
  fastMode: boolean
}

/** The raw stored settings for the admin UI (model null = "use the env default"). */
export async function readCreaSettings(): Promise<StoredCreaSettings> {
  const row = await dbSelectCreaSettings()
  return {
    model: row?.model ?? null,
    effort: normalizeEffort(row?.effort),
    fastMode: row?.fastMode ?? false,
  }
}

/** Upserts the singleton settings row. An empty/blank model clears the override. */
export async function writeCreaSettings(
  model: string | null,
  effort: CreaEffort,
  fastMode: boolean,
): Promise<StoredCreaSettings> {
  const trimmed = model?.trim()
  const stored = { model: trimmed ? trimmed : null, effort, fastMode }
  await dbUpsertCreaModerationSettings(stored)
  return stored
}

/** The env-configured fallback model, shown to the admin and used when none is stored. */
export function defaultCreaModel(): string {
  return CONFIG.ANTHROPIC_MODEL
}

export interface CreaModelParams {
  model: string
  thinking: { type: 'disabled' } | { type: 'adaptive' }
  effort?: Exclude<CreaEffort, 'disabled'>
  maxTokens: number
  fastMode: boolean
}

/**
 * The effective request parameters (model + thinking/effort + fast mode) for one
 * Anthropic call. effort 'disabled' keeps thinking off (the lean single-JSON default,
 * fastest); any level switches on adaptive thinking at that effort and raises
 * max_tokens to leave room for the reasoning before the JSON.
 *
 * On the 8192: Crea's structured JSON output is usually small, but a contribution with
 * many activities (e.g. a long, semicolon-separated list) yields a longer activities
 * array plus reasoning and reply. At 2048 such a case was truncated mid-JSON and
 * reached the moderator as a parse error. This is only a ceiling — normal calls stop
 * well before it, so the generous limit costs nothing.
 */
export async function resolveCreaModelParams(): Promise<CreaModelParams> {
  const { model, effort, fastMode } = await readCreaSettings()
  const effectiveModel = model ?? CONFIG.ANTHROPIC_MODEL
  if (effort === 'disabled') {
    return { model: effectiveModel, thinking: { type: 'disabled' }, maxTokens: 8192, fastMode }
  }
  return {
    model: effectiveModel,
    thinking: { type: 'adaptive' },
    effort,
    maxTokens: 16000,
    fastMode,
  }
}
