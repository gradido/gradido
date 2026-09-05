import { CreaBatchInput } from '@input/CreaBatchInput'
import { CreaContributionInput } from '@input/CreaContributionInput'
import { CreaSettingsInput } from '@input/CreaSettingsInput'
import { CreaBatchEvaluation } from '@model/CreaBatchEvaluation'
import { CreaEvaluation } from '@model/CreaEvaluation'
import { CreaRewriteResult } from '@model/CreaRewriteResult'
import { CreaModelTestResult, CreaSettings, FirstCreationSigner } from '@model/CreaSettings'
import {
  User as DbUser,
  dbGetFirstCreationSignerUserId,
  dbGetUserWithRolesById,
  dbIsMatchingKeyingActive,
  dbSetFirstCreationSignerUserId,
  dbSetMatchingKeyingActive,
} from 'database'
import { SALUTATION_MAX_LENGTH } from 'shared'
import { Arg, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
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
import { EVENT_ADMIN_USER_SALUTATION_SET } from '@/event/Events'
import { checkSignerAccount } from '@/interactions/firstCreation/Signer.role'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'

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
   * Stores how this participant is addressed, so the next moderator starts from the
   * same salutation instead of guessing again (E-013). Set from Crea's evaluation
   * window, where the wrong salutation is noticed. An empty value clears it and hands
   * the decision back to the first-name heuristic.
   *
   * This writes to another person's user record, so it carries its own right and leaves
   * an event behind, like every other cross-user write in this codebase. The messages
   * thrown here are for the log and for developers; the moderator sees a translated
   * toast built in the admin.
   */
  @Authorized([RIGHTS.SET_USER_SALUTATION])
  @Mutation(() => Boolean)
  async setCreaSalutation(
    @Arg('userId', () => Int) userId: number,
    @Ctx() context: Context,
    @Arg('salutation', () => String, { nullable: true }) salutation?: string | null,
  ): Promise<boolean> {
    const value = salutation?.trim() || null
    // The column is varchar(255) (migration 0105). Without this the driver rejects the
    // write in strict mode, or truncates it mid-word where it does not.
    if (value && value.length > SALUTATION_MAX_LENGTH) {
      throw new LogError('Salutation exceeds the maximum length', value.length)
    }
    const user = await DbUser.findOneBy({ id: userId })
    if (!user) {
      throw new LogError('Could not find user with given ID', userId)
    }
    user.salutation = value
    await DbUser.save(user)
    await EVENT_ADMIN_USER_SALUTATION_SET(user, getUser(context))
    return true
  }

  /**
   * The global Crea runtime settings for the admin panel (DO-4). Guarded by the
   * dedicated AI_SETTINGS right, which is admin-only: the model applies to every
   * moderator at once, so moderators inherit the effect but not the control (E-028).
   */
  @Authorized([RIGHTS.AI_SETTINGS])
  @Query(() => CreaSettings)
  async creaSettings(): Promise<CreaSettings> {
    const settings = await readCreaSettings()
    return {
      model: settings.model,
      effort: settings.effort,
      defaultModel: defaultCreaModel(),
      fastMode: settings.fastMode,
      // From `communities`, not from the Crea settings row: the model and how hard it
      // thinks are one setting for the whole instance, but who pays for keying belongs
      // to the community that has the members.
      matchingKeyingActive: await dbIsMatchingKeyingActive(),
      firstCreationSigner: await readFirstCreationSigner(),
    }
  }

  /**
   * Sets the global Crea model + effort (DO-4), applied for all moderators at once.
   * An empty model clears the override and falls back to the env default.
   */
  @Authorized([RIGHTS.AI_SETTINGS])
  @Mutation(() => CreaSettings)
  async setCreaSettings(@Arg('input') input: CreaSettingsInput): Promise<CreaSettings> {
    // ⛔ This mutation writes the MODERATION settings only. The keying switch has its
    // own, and that separation is not tidiness: it is one table each, it is one Save
    // button each on the page, and it means a save of the model can no longer carry a
    // stale switch value from a browser tab that has been open for an hour. There is
    // no ordering question left either, because there is no second write here.
    // ⚠️ BEFORE the write, and that is the point rather than the order it reads in.
    // The type promises the stored switch state, so it has to be read rather than
    // invented - but this mutation does not touch it, and a transient failure of a
    // read nobody asked for must not fail a save that has already committed. Read
    // first: then a failure here means nothing was written, which is what the error
    // toast says.
    const matchingKeyingActive = await dbIsMatchingKeyingActive()
    const settings = await writeCreaSettings(
      input.model ?? null,
      input.effort as CreaEffort,
      input.fastMode ?? false,
    )
    return {
      model: settings.model,
      effort: settings.effort,
      defaultModel: defaultCreaModel(),
      fastMode: settings.fastMode,
      matchingKeyingActive,
      firstCreationSigner: await readFirstCreationSigner(),
    }
  }

  /**
   * Who signs the first creation (ES-005). Its own mutation and its own Save button, for
   * the same reason the keying switch has one: a save of the model from a tab that has
   * been open for an hour must not be able to revert the signer — and a reverted signer
   * is not a cosmetic slip, it shuts the window for every new member.
   *
   * ⛔ Refuses an account that could not sign (no moderation role, a group scope, deleted):
   * stored, such a value would switch the window off silently, and the admin would learn
   * about it from a member who never saw it. `null` clears the signer on purpose.
   */
  @Authorized([RIGHTS.AI_SETTINGS])
  @Mutation(() => FirstCreationSigner, { nullable: true })
  async setFirstCreationSigner(
    @Arg('userId', () => Int, { nullable: true }) userId: number | null,
  ): Promise<FirstCreationSigner | null> {
    if (userId === null) {
      await dbSetFirstCreationSignerUserId(null)
      return null
    }
    const found = await dbGetUserWithRolesById(userId)
    if (!found.success) {
      throw new LogError('FIRST_CREATION_SIGNER_NOT_FOUND', userId)
    }
    const check = checkSignerAccount(found.value)
    if (!check.success) {
      throw new LogError(check.error.message, userId)
    }
    await dbSetFirstCreationSignerUserId(userId)
    return describeSigner(found.value)
  }

  /**
   * Whether Crea works out the key words of matching entries — the second half of
   * this page, and the one that spends money per entry.
   *
   * Its own mutation rather than a fourth field on `setCreaSettings`, because it is
   * its own table, its own decision and its own Save button. Saving a model must not
   * be able to move it, which is exactly what a shared form could do from a tab that
   * had been open since before somebody else switched it.
   *
   * ⛔ Answers with what is STORED, not with what was asked for. The write throwing
   * already covers the row-not-found case, so the two differ only when a SECOND admin
   * wrote in between - and then the honest answer is the one in the database, not the
   * one this caller happened to send. The page follows it, so the box ends up showing
   * what is true rather than what was clicked.
   */
  @Authorized([RIGHTS.AI_SETTINGS])
  @Mutation(() => Boolean)
  async setCreaMatchingKeying(@Arg('active') active: boolean): Promise<boolean> {
    const written = await dbSetMatchingKeyingActive(active)
    if (!written.success) {
      throw new LogError('could not store the matching keying switch', written.error)
    }
    return await dbIsMatchingKeyingActive()
  }

  /**
   * Fires a tiny probe call with the given model + effort so the admin can verify a
   * model string works before saving it for all moderators (DO-4). Never throws; the
   * outcome is returned for a toast.
   */
  @Authorized([RIGHTS.AI_SETTINGS])
  @Mutation(() => CreaModelTestResult)
  async testCreaModel(@Arg('input') input: CreaSettingsInput): Promise<CreaModelTestResult> {
    const client = AnthropicClient.getInstance()
    if (!client) {
      return { ok: false, code: 'api_inactive', message: '', fastMode: 'off', fastModeDetail: '' }
    }
    const model = input.model?.trim() || defaultCreaModel()
    return client.probeModel(model, input.effort as CreaEffort, input.fastMode ?? false)
  }
}

/** The stored signer for the admin page, or null when nobody is configured. */
async function readFirstCreationSigner(): Promise<FirstCreationSigner | null> {
  const userId = await dbGetFirstCreationSignerUserId()
  if (userId === null) {
    return null
  }
  const found = await dbGetUserWithRolesById(userId)
  if (!found.success) {
    return {
      userId,
      firstName: null,
      lastName: null,
      alias: null,
      role: null,
      eligible: false,
      reason: 'NOT_FOUND',
    }
  }
  return describeSigner(found.value)
}

function describeSigner(user: DbUser): FirstCreationSigner {
  const check = checkSignerAccount(user)
  return {
    userId: user.id,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    alias: user.alias ?? null,
    role: user.userRoles?.[0]?.role ?? null,
    eligible: check.success,
    reason: check.success ? '' : check.error.reason,
  }
}
