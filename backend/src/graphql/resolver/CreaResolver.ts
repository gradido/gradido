import { CreaBatchInput } from '@input/CreaBatchInput'
import { CreaContributionInput } from '@input/CreaContributionInput'
import { CreaSettingsInput } from '@input/CreaSettingsInput'
import { CreaBatchEvaluation } from '@model/CreaBatchEvaluation'
import { CreaEvaluation } from '@model/CreaEvaluation'
import { CreaRewriteResult } from '@model/CreaRewriteResult'
import { CreaModelTestResult, CreaSettings } from '@model/CreaSettings'
import { Arg, Authorized, Mutation, Query, Resolver } from 'type-graphql'
import { AnthropicClient } from '@/apis/anthropic/AnthropicClient'
import { metaFromInput, persistCreaRecords } from '@/apis/anthropic/crea/records'
import {
  type CreaEffort,
  defaultCreaModel,
  readCreaSettings,
  writeCreaSettings,
} from '@/apis/anthropic/crea/settings'
import {
  buildStubBatch,
  buildStubBatchRewrite,
  buildStubEvaluation,
  buildStubRewrite,
} from '@/apis/anthropic/crea/stub'
import { RIGHTS } from '@/auth/RIGHTS'
import { CONFIG } from '@/config'

@Resolver()
export class CreaResolver {
  @Authorized([RIGHTS.AI_SEND_MESSAGE])
  @Mutation(() => CreaEvaluation)
  async creaEvaluateContribution(
    @Arg('input') input: CreaContributionInput,
  ): Promise<CreaEvaluation> {
    const client = AnthropicClient.getInstance()
    let evaluation: CreaEvaluation
    if (client) {
      evaluation = await client.evaluateContribution(input)
    } else if (CONFIG.CREA_STUB) {
      // Staging preview before the API key (DO-5): a canned evaluation that still
      // runs the deterministic layer and persists, so the whole UI/DB path works.
      evaluation = buildStubEvaluation(input)
    } else {
      throw new Error('Anthropic API is not enabled')
    }
    // Persist one record per activity when the caller supplied a contribution
    // reference (the admin UI, DO-4); the thin slice skips persistence (E-007).
    if (input.contributionRef) {
      await persistCreaRecords(evaluation, metaFromInput(input, CONFIG.ANTHROPIC_MODEL))
    }
    return evaluation
  }

  /**
   * Rewrites the reply text when the moderator deviates from Crea's own
   * recommendation (E-017): a fresh responseText for the moderator's target
   * decision + optional context, plus — on a confirm rewrite — the memoSupplement
   * appended to the public contribution (E-019). Deliberately does NOT persist —
   * the statistically valid record is Crea's first, uninfluenced judgement written
   * by creaEvaluateContribution; this follow-up would otherwise double it.
   */
  @Authorized([RIGHTS.AI_SEND_MESSAGE])
  @Mutation(() => CreaRewriteResult)
  async creaRewriteResponse(
    @Arg('input') input: CreaContributionInput,
  ): Promise<CreaRewriteResult> {
    if (!input.moderatorDecision) {
      throw new Error('moderatorDecision is required to rewrite the response')
    }
    const client = AnthropicClient.getInstance()
    if (client) {
      return client.rewriteResponse(input)
    }
    if (CONFIG.CREA_STUB) {
      return buildStubRewrite(input)
    }
    throw new Error('Anthropic API is not enabled')
  }

  /**
   * Evaluates several open contributions of one participant together (E-020): ONE
   * overall verdict + ONE reply, so the participant gets a single message instead of
   * many identical mails. Batch mode is deliberately lean and does NOT persist records
   * (no single contributionRef; the fine-grained per-contribution records stay with
   * the single-contribution path, nachruestbar later).
   */
  @Authorized([RIGHTS.AI_SEND_MESSAGE])
  @Mutation(() => CreaBatchEvaluation)
  async creaEvaluateBatch(@Arg('input') input: CreaBatchInput): Promise<CreaBatchEvaluation> {
    const client = AnthropicClient.getInstance()
    if (client) {
      return client.evaluateBatch(input)
    }
    if (CONFIG.CREA_STUB) {
      return buildStubBatch(input)
    }
    throw new Error('Anthropic API is not enabled')
  }

  /**
   * Rewrites the joint batch reply when the moderator deviates from Crea's overall
   * recommendation (E-017 for the batch, E-020): a fresh joint responseText for the
   * moderator's target decision + optional context. Like the single rewrite it does
   * NOT re-judge and does NOT persist. No memoSupplement in batch mode (E-019).
   */
  @Authorized([RIGHTS.AI_SEND_MESSAGE])
  @Mutation(() => CreaRewriteResult)
  async creaRewriteBatch(@Arg('input') input: CreaBatchInput): Promise<CreaRewriteResult> {
    if (!input.moderatorDecision) {
      throw new Error('moderatorDecision is required to rewrite the batch response')
    }
    const client = AnthropicClient.getInstance()
    if (client) {
      return client.rewriteBatch(input)
    }
    if (CONFIG.CREA_STUB) {
      return buildStubBatchRewrite(input)
    }
    throw new Error('Anthropic API is not enabled')
  }

  /**
   * The global Crea runtime settings for the admin panel (DO-4). Admin-only
   * (COMMUNITY_UPDATE): moderators inherit the effect but cannot change it.
   */
  @Authorized([RIGHTS.COMMUNITY_UPDATE])
  @Query(() => CreaSettings)
  async creaSettings(): Promise<CreaSettings> {
    const settings = await readCreaSettings()
    return { model: settings.model, effort: settings.effort, defaultModel: defaultCreaModel() }
  }

  /**
   * Sets the global Crea model + effort (DO-4), applied for all moderators at once.
   * An empty model clears the override and falls back to the env default.
   */
  @Authorized([RIGHTS.COMMUNITY_UPDATE])
  @Mutation(() => CreaSettings)
  async setCreaSettings(@Arg('input') input: CreaSettingsInput): Promise<CreaSettings> {
    const settings = await writeCreaSettings(input.model ?? null, input.effort as CreaEffort)
    return { model: settings.model, effort: settings.effort, defaultModel: defaultCreaModel() }
  }

  /**
   * Fires a tiny probe call with the given model + effort so the admin can verify a
   * model string works before saving it for all moderators (DO-4). Never throws; the
   * outcome is returned for a toast.
   */
  @Authorized([RIGHTS.COMMUNITY_UPDATE])
  @Mutation(() => CreaModelTestResult)
  async testCreaModel(@Arg('input') input: CreaSettingsInput): Promise<CreaModelTestResult> {
    const client = AnthropicClient.getInstance()
    if (!client) {
      return { ok: false, message: 'Die Anthropic-API ist nicht aktiv (kein Schluessel gesetzt).' }
    }
    const model = input.model?.trim() || defaultCreaModel()
    return client.probeModel(model, input.effort as CreaEffort)
  }
}
