import { CreaSetting } from 'database'
import { CONFIG } from '@/config'

// Global Crea runtime settings (DO-4): the Claude model + effort an admin picks in
// the admin UI, stored as a single-row singleton (crea_settings, id = 1) and applied
// for all moderators. Read on every Crea call so a change takes effect at once; the
// env ANTHROPIC_MODEL is the fallback when no model is stored.

export const CREA_EFFORTS = ['disabled', 'low', 'medium', 'high', 'xhigh', 'max'] as const
export type CreaEffort = (typeof CREA_EFFORTS)[number]

const SINGLETON_ID = 1

function normalizeEffort(value: string | null | undefined): CreaEffort {
  return CREA_EFFORTS.includes(value as CreaEffort) ? (value as CreaEffort) : 'disabled'
}

export interface StoredCreaSettings {
  model: string | null
  effort: CreaEffort
}

/** The raw stored settings for the admin UI (model null = "use the env default"). */
export async function readCreaSettings(): Promise<StoredCreaSettings> {
  const row = await CreaSetting.findOneBy({ id: SINGLETON_ID })
  return { model: row?.model ?? null, effort: normalizeEffort(row?.effort) }
}

/** Upserts the singleton settings row. An empty/blank model clears the override. */
export async function writeCreaSettings(
  model: string | null,
  effort: CreaEffort,
): Promise<StoredCreaSettings> {
  let row = await CreaSetting.findOneBy({ id: SINGLETON_ID })
  if (!row) {
    row = CreaSetting.create({ id: SINGLETON_ID })
  }
  const trimmed = model?.trim()
  row.model = trimmed ? trimmed : null
  row.effort = effort
  await CreaSetting.save(row)
  return { model: row.model, effort: normalizeEffort(row.effort) }
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
}

/**
 * The effective request parameters (model + thinking/effort) for one Anthropic call.
 * effort 'disabled' keeps thinking off (the lean single-JSON default, fastest); any
 * level switches on adaptive thinking at that effort and raises max_tokens to leave
 * room for the reasoning before the JSON.
 */
export async function resolveCreaModelParams(): Promise<CreaModelParams> {
  const { model, effort } = await readCreaSettings()
  const effectiveModel = model ?? CONFIG.ANTHROPIC_MODEL
  if (effort === 'disabled') {
    return { model: effectiveModel, thinking: { type: 'disabled' }, maxTokens: 8192 }
  }
  return { model: effectiveModel, thinking: { type: 'adaptive' }, effort, maxTokens: 16000 }
}
